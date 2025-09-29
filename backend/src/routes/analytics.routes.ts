import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import Joi from 'joi';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';
import { logger } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Validation schemas
 */
const analyticsSchemas = {
  dateRange: Joi.object({
    dateFrom: Joi.date().optional(),
    dateTo: Joi.date().optional().min(Joi.ref('dateFrom')),
    repId: Joi.string().uuid().optional()
  }),

  comparison: Joi.object({
    period1Start: Joi.date().required(),
    period1End: Joi.date().required().min(Joi.ref('period1Start')),
    period2Start: Joi.date().required(),
    period2End: Joi.date().required().min(Joi.ref('period2Start')),
    repId: Joi.string().uuid().optional()
  })
};

/**
 * Build base filter for analytics queries
 */
const buildAnalyticsFilter = (userRole: string, userId: string, repId?: string) => {
  const filter: any = { deletedAt: null };

  if (userRole === 'REP') {
    // Reps can only see their own data
    filter.assignedRepId = userId;
  } else if (repId && userRole === 'ADMIN') {
    // Admins can filter by specific rep
    filter.assignedRepId = repId;
  }

  return filter;
};

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get comprehensive dashboard analytics
 * @access  Private
 */
router.get('/dashboard',
  authenticate,
  validate({ query: analyticsSchemas.dateRange }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const { dateFrom, dateTo, repId } = req.query;

    // Build base filter
    const merchantFilter = buildAnalyticsFilter(user.role, user.id, repId as string);

    // Date range filter
    const dateFilter: any = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom as string);
    if (dateTo) dateFilter.lte = new Date(dateTo as string);

    // Parallel queries for dashboard data
    const [
      merchantStats,
      pipelineStats,
      onboardingStats,
      activityStats,
      payoutStats,
      categoryStats,
      recentActivities,
      overdueActions
    ] = await Promise.all([
      // 1. Merchant Statistics
      prisma.merchant.aggregate({
        where: merchantFilter,
        _count: { id: true }
      }).then(async (result) => {
        const total = result._count.id;
        
        // Get live merchants count
        const liveCount = await prisma.onboarding.count({
          where: {
            status: 'LIVE',
            merchant: merchantFilter
          }
        });

        // Get new merchants in period
        const newMerchants = Object.keys(dateFilter).length > 0 
          ? await prisma.merchant.count({
              where: {
                ...merchantFilter,
                createdAt: dateFilter
              }
            })
          : 0;

        return { total, live: liveCount, new: newMerchants };
      }),

      // 2. Pipeline Statistics
      prisma.pipeline.groupBy({
        by: ['currentStage'],
        where: { merchant: merchantFilter },
        _count: { currentStage: true }
      }).then(async (stages) => {
        // Calculate conversion rates
        const stageDistribution = stages.reduce((acc, stage) => {
          acc[stage.currentStage] = stage._count.currentStage;
          return acc;
        }, {} as Record<string, number>);

        const total = Object.values(stageDistribution).reduce((sum, count) => sum + count, 0);
        const won = stageDistribution.WON || 0;
        const rejected = stageDistribution.REJECTED || 0;
        const active = total - rejected;

        return {
          distribution: stageDistribution,
          conversion: {
            wonRate: active > 0 ? Math.round((won / active) * 100) : 0,
            rejectionRate: total > 0 ? Math.round((rejected / total) * 100) : 0
          }
        };
      }),

      // 3. Onboarding Statistics
      prisma.onboarding.groupBy({
        by: ['status'],
        where: { merchant: merchantFilter },
        _count: { status: true },
        _avg: { completionPercentage: true }
      }).then((results) => ({
        statusDistribution: results.reduce((acc, item) => {
          acc[item.status] = {
            count: item._count.status,
            avgCompletion: item._avg.completionPercentage 
              ? Math.round(item._avg.completionPercentage * 100) 
              : 0
          };
          return acc;
        }, {} as Record<string, any>)
      })),

      // 4. Activity Statistics
      prisma.activity.aggregate({
        where: {
          deletedAt: null,
          merchant: merchantFilter,
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
        },
        _count: { id: true }
      }).then(async (activityResult) => {
        // Get activity type breakdown
        const typeBreakdown = await prisma.activity.groupBy({
          by: ['type'],
          where: {
            deletedAt: null,
            merchant: merchantFilter,
            ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
          },
          _count: { type: true }
        });

        // Get outcome breakdown
        const outcomeBreakdown = await prisma.activity.groupBy({
          by: ['outcome'],
          where: {
            deletedAt: null,
            outcome: { not: null },
            merchant: merchantFilter,
            ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
          },
          _count: { outcome: true }
        });

        return {
          total: activityResult._count.id,
          byType: typeBreakdown.reduce((acc, item) => {
            acc[item.type] = item._count.type;
            return acc;
          }, {} as Record<string, number>),
          byOutcome: outcomeBreakdown.reduce((acc, item) => {
            if (item.outcome) {
              acc[item.outcome] = item._count.outcome;
            }
            return acc;
          }, {} as Record<string, number>)
        };
      }),

      // 5. Payout Statistics
      prisma.payoutLedger.aggregate({
        where: {
          merchant: merchantFilter,
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
        },
        _sum: { amount: true },
        _count: { id: true }
      }).then(async (payoutResult) => {
        // Get payout breakdown by type
        const typeBreakdown = await prisma.payoutLedger.groupBy({
          by: ['type'],
          where: {
            merchant: merchantFilter,
            ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
          },
          _sum: { amount: true },
          _count: { type: true }
        });

        return {
          totalAmount: payoutResult._sum.amount || 0,
          totalCount: payoutResult._count.id,
          byType: typeBreakdown.reduce((acc, item) => {
            acc[item.type] = {
              amount: item._sum.amount || 0,
              count: item._count.type
            };
            return acc;
          }, {} as Record<string, any>)
        };
      }),

      // 6. Category Distribution
      prisma.merchant.groupBy({
        by: ['category'],
        where: merchantFilter,
        _count: { category: true }
      }).then(async (categories) => {
        // Get live status by category
        const categoryLiveStats = await Promise.all(
          categories.map(async (cat) => {
            const liveCount = await prisma.onboarding.count({
              where: {
                status: 'LIVE',
                merchant: {
                  ...merchantFilter,
                  category: cat.category
                }
              }
            });

            return {
              category: cat.category,
              total: cat._count.category,
              live: liveCount,
              liveRate: Math.round((liveCount / cat._count.category) * 100)
            };
          })
        );

        return categoryLiveStats;
      }),

      // 7. Recent Activities (last 10)
      prisma.activity.findMany({
        where: {
          deletedAt: null,
          merchant: merchantFilter
        },
        include: {
          merchant: {
            select: { id: true, name: true }
          },
          createdBy: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),

      // 8. Overdue Actions
      prisma.pipeline.count({
        where: {
          merchant: merchantFilter,
          nextActionDate: { lt: new Date() },
          currentStage: { not: 'REJECTED' }
        }
      })
    ]);

    // Calculate key performance indicators
    const kpis = {
      totalMerchants: merchantStats.total,
      liveMerchants: merchantStats.live,
      newMerchants: merchantStats.new,
      liveConversionRate: merchantStats.total > 0 
        ? Math.round((merchantStats.live / merchantStats.total) * 100) 
        : 0,
      totalActivities: activityStats.total,
      totalPayouts: payoutStats.totalAmount,
      overdueActions,
      avgActivitiesPerMerchant: merchantStats.total > 0 
        ? Math.round((activityStats.total / merchantStats.total) * 10) / 10 
        : 0
    };

    const dashboardData = {
      kpis,
      pipeline: pipelineStats,
      onboarding: onboardingStats,
      activities: activityStats,
      payouts: payoutStats,
      categories: categoryStats,
      recentActivities: recentActivities.slice(0, 5), // Top 5 for dashboard
      alerts: {
        overdueActions
      }
    };

    logger.info('Dashboard analytics retrieved', {
      userId: user.id,
      userRole: user.role,
      dateFrom,
      dateTo,
      repId,
      merchantCount: merchantStats.total,
      activityCount: activityStats.total
    });

    res.json({
      success: true,
      data: dashboardData,
      meta: {
        period: { dateFrom, dateTo },
        userRole: user.role,
        repId: repId || (user.role === 'REP' ? user.id : null)
      }
    });
  })
);

/**
 * @route   GET /api/analytics/rep-performance
 * @desc    Get sales rep performance comparison
 * @access  Admin only
 */
router.get('/rep-performance',
  authenticate,
  validate({ query: analyticsSchemas.dateRange }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const { dateFrom, dateTo } = req.query;

    // Only admins can see rep performance comparison
    if (user.role !== 'ADMIN') {
      throw new AppError('Access denied. Admin privileges required.', 403);
    }

    // Date filter
    const dateFilter: any = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom as string);
    if (dateTo) dateFilter.lte = new Date(dateTo as string);

    // Get all active reps
    const reps = await prisma.user.findMany({
      where: {
        role: 'REP',
        status: 'ACTIVE'
      },
      select: { id: true, name: true, email: true, createdAt: true }
    });

    // Get performance data for each rep
    const repPerformance = await Promise.all(
      reps.map(async (rep) => {
        const [
          assignedMerchants,
          liveMerchants,
          activities,
          wonPayouts,
          livePayouts,
          wonMerchants
        ] = await Promise.all([
          // Assigned merchants
          prisma.merchant.count({
            where: { assignedRepId: rep.id, deletedAt: null }
          }),
          
          // Live merchants
          prisma.onboarding.count({
            where: {
              status: 'LIVE',
              merchant: { assignedRepId: rep.id, deletedAt: null }
            }
          }),

          // Activities in period
          prisma.activity.count({
            where: {
              createdById: rep.id,
              deletedAt: null,
              ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
            }
          }),

          // Won payouts
          prisma.payoutLedger.aggregate({
            where: {
              recipientId: rep.id,
              type: 'WON',
              ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
            },
            _sum: { amount: true },
            _count: { id: true }
          }),

          // Live payouts
          prisma.payoutLedger.aggregate({
            where: {
              recipientId: rep.id,
              type: 'LIVE',
              ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
            },
            _sum: { amount: true },
            _count: { id: true }
          }),

          // Won merchants count
          prisma.pipeline.count({
            where: {
              currentStage: 'WON',
              merchant: { assignedRepId: rep.id, deletedAt: null }
            }
          })
        ]);

        const totalEarnings = (wonPayouts._sum.amount || 0) + (livePayouts._sum.amount || 0);
        const conversionRate = assignedMerchants > 0 
          ? Math.round((liveMerchants / assignedMerchants) * 100) 
          : 0;
        const winRate = assignedMerchants > 0 
          ? Math.round((wonMerchants / assignedMerchants) * 100) 
          : 0;

        return {
          rep,
          metrics: {
            assignedMerchants,
            wonMerchants,
            liveMerchants,
            activities,
            winRate,
            conversionRate,
            totalEarnings,
            wonPayouts: wonPayouts._count.id,
            livePayouts: livePayouts._count.id,
            avgActivitiesPerMerchant: assignedMerchants > 0 
              ? Math.round((activities / assignedMerchants) * 10) / 10 
              : 0
          }
        };
      })
    );

    // Sort by total earnings
    repPerformance.sort((a, b) => b.metrics.totalEarnings - a.metrics.totalEarnings);

    // Calculate team totals
    const teamTotals = repPerformance.reduce((totals, rep) => ({
      assignedMerchants: totals.assignedMerchants + rep.metrics.assignedMerchants,
      wonMerchants: totals.wonMerchants + rep.metrics.wonMerchants,
      liveMerchants: totals.liveMerchants + rep.metrics.liveMerchants,
      activities: totals.activities + rep.metrics.activities,
      totalEarnings: totals.totalEarnings + rep.metrics.totalEarnings
    }), {
      assignedMerchants: 0,
      wonMerchants: 0,
      liveMerchants: 0,
      activities: 0,
      totalEarnings: 0
    });

    logger.info('Rep performance analytics retrieved', {
      userId: user.id,
      repCount: reps.length,
      dateFrom,
      dateTo,
      totalEarnings: teamTotals.totalEarnings
    });

    res.json({
      success: true,
      data: {
        individual: repPerformance,
        team: {
          ...teamTotals,
          avgConversionRate: teamTotals.assignedMerchants > 0 
            ? Math.round((teamTotals.liveMerchants / teamTotals.assignedMerchants) * 100) 
            : 0,
          avgWinRate: teamTotals.assignedMerchants > 0 
            ? Math.round((teamTotals.wonMerchants / teamTotals.assignedMerchants) * 100) 
            : 0
        }
      },
      meta: {
        period: { dateFrom, dateTo },
        repCount: reps.length
      }
    });
  })
);

/**
 * @route   GET /api/analytics/trends
 * @desc    Get trend analytics over time
 * @access  Private
 */
router.get('/trends',
  authenticate,
  validate({
    query: Joi.object({
      period: Joi.string().valid('daily', 'weekly', 'monthly').default('weekly'),
      days: Joi.number().integer().min(7).max(365).default(30),
      repId: Joi.string().uuid().optional()
    })
  }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const { period = 'weekly', days = 30, repId } = req.query;

    // Build filter
    const merchantFilter = buildAnalyticsFilter(user.role, user.id, repId as string);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date(Date.now() - (Number(days) * 24 * 60 * 60 * 1000));

    // Determine grouping interval
    const groupBy = period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month';

    // Get merchant creation trends
    const merchantTrends = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC(${groupBy}, "createdAt") as period,
        COUNT(*) as count
      FROM "Merchant"
      WHERE "createdAt" >= ${startDate}
        AND "createdAt" <= ${endDate}
        AND "deletedAt" IS NULL
        ${user.role === 'REP' ? prisma.$queryRaw`AND "assignedRepId" = ${user.id}` : prisma.$queryRaw``}
        ${repId && user.role === 'ADMIN' ? prisma.$queryRaw`AND "assignedRepId" = ${repId}` : prisma.$queryRaw``}
      GROUP BY DATE_TRUNC(${groupBy}, "createdAt")
      ORDER BY period
    ` as any[];

    // Get activity trends
    const activityTrends = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC(${groupBy}, a."createdAt") as period,
        COUNT(*) as count
      FROM "Activity" a
      JOIN "Merchant" m ON a."merchantId" = m.id
      WHERE a."createdAt" >= ${startDate}
        AND a."createdAt" <= ${endDate}
        AND a."deletedAt" IS NULL
        AND m."deletedAt" IS NULL
        ${user.role === 'REP' ? prisma.$queryRaw`AND m."assignedRepId" = ${user.id}` : prisma.$queryRaw``}
        ${repId && user.role === 'ADMIN' ? prisma.$queryRaw`AND m."assignedRepId" = ${repId}` : prisma.$queryRaw``}
      GROUP BY DATE_TRUNC(${groupBy}, a."createdAt")
      ORDER BY period
    ` as any[];

    // Get conversion trends (merchants going live)
    const conversionTrends = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC(${groupBy}, o."liveDate") as period,
        COUNT(*) as count
      FROM "Onboarding" o
      JOIN "Merchant" m ON o."merchantId" = m.id
      WHERE o."liveDate" >= ${startDate}
        AND o."liveDate" <= ${endDate}
        AND o.status = 'LIVE'
        AND m."deletedAt" IS NULL
        ${user.role === 'REP' ? prisma.$queryRaw`AND m."assignedRepId" = ${user.id}` : prisma.$queryRaw``}
        ${repId && user.role === 'ADMIN' ? prisma.$queryRaw`AND m."assignedRepId" = ${repId}` : prisma.$queryRaw``}
      GROUP BY DATE_TRUNC(${groupBy}, o."liveDate")
      ORDER BY period
    ` as any[];

    // Format trends data
    const formatTrends = (trends: any[]) => 
      trends.map(item => ({
        period: item.period.toISOString().split('T')[0],
        count: parseInt(item.count)
      }));

    const trendsData = {
      merchants: formatTrends(merchantTrends),
      activities: formatTrends(activityTrends),
      conversions: formatTrends(conversionTrends)
    };

    logger.info('Trend analytics retrieved', {
      userId: user.id,
      period,
      days: Number(days),
      repId,
      merchantTrendPoints: merchantTrends.length,
      activityTrendPoints: activityTrends.length
    });

    res.json({
      success: true,
      data: trendsData,
      meta: {
        period,
        days: Number(days),
        dateRange: { startDate, endDate },
        repId: repId || (user.role === 'REP' ? user.id : null)
      }
    });
  })
);

/**
 * @route   GET /api/analytics/export
 * @desc    Export analytics data to CSV format
 * @access  Private
 */
router.get('/export',
  authenticate,
  validate({
    query: Joi.object({
      type: Joi.string().valid(
        'merchants', 'activities', 'pipeline', 'onboarding', 'payouts'
      ).required(),
      dateFrom: Joi.date().optional(),
      dateTo: Joi.date().optional(),
      repId: Joi.string().uuid().optional()
    })
  }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const { type, dateFrom, dateTo, repId } = req.query;

    // Build filters
    const merchantFilter = buildAnalyticsFilter(user.role, user.id, repId as string);
    const dateFilter: any = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom as string);
    if (dateTo) dateFilter.lte = new Date(dateTo as string);

    let csvData: any[] = [];
    let filename = '';
    let headers: string[] = [];

    switch (type) {
      case 'merchants':
        const merchants = await prisma.merchant.findMany({
          where: {
            ...merchantFilter,
            ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
          },
          include: {
            pipeline: true,
            onboarding: true,
            assignedRep: { select: { name: true, email: true } },
            _count: { select: { activities: true } }
          }
        });

        headers = [
          'Name', 'Category', 'Contact Person', 'Phone', 'Email', 'Location',
          'Assigned Rep', 'Current Stage', 'Onboarding Status', 'Live Date',
          'Activities Count', 'Created Date'
        ];

        csvData = merchants.map(m => [
          m.name,
          m.category,
          m.contactPersonName,
          m.contactPhone,
          m.contactEmail || '',
          m.location,
          m.assignedRep?.name || '',
          m.pipeline?.currentStage || '',
          m.onboarding?.status || '',
          m.onboarding?.liveDate?.toISOString().split('T')[0] || '',
          m._count.activities,
          m.createdAt.toISOString().split('T')[0]
        ]);

        filename = 'merchants_export.csv';
        break;

      case 'payouts':
        const payouts = await prisma.payoutLedger.findMany({
          where: {
            merchant: merchantFilter,
            ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
          },
          include: {
            merchant: { select: { name: true } },
            recipient: { select: { name: true, email: true } }
          }
        });

        headers = [
          'Merchant', 'Recipient', 'Type', 'Amount', 'Status', 
          'Description', 'Created Date'
        ];

        csvData = payouts.map(p => [
          p.merchant.name,
          p.recipient.name,
          p.type,
          p.amount,
          p.status,
          p.description,
          p.createdAt.toISOString().split('T')[0]
        ]);

        filename = 'payouts_export.csv';
        break;

      default:
        throw new AppError('Invalid export type', 400);
    }

    // Convert to CSV format
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        row.map((cell: any) => 
          typeof cell === 'string' && cell.includes(',') 
            ? `"${cell}"` 
            : cell
        ).join(',')
      )
    ].join('\n');

    logger.info('Analytics data exported', {
      userId: user.id,
      type,
      rowCount: csvData.length,
      dateFrom,
      dateTo
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(csvContent);
  })
);

export default router;