import express from 'express';
import { PrismaClient, ActivityType } from '@prisma/client';
import { authenticate, adminOrRep } from '../middleware/auth';
import { validate } from '../middleware/validation';
import Joi from 'joi';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest, CreateActivityRequest, ActivityFilters } from '../types';
import { logger, logAudit } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Validation schemas
 */
const activitySchemas = {
  create: Joi.object({
    merchantId: Joi.string().uuid().required(),
    type: Joi.string().valid(
      'CALL', 'MEETING', 'WHATSAPP', 'EMAIL', 'TRAINING', 'OTHER'
    ).required(),
    summary: Joi.string().min(5).max(500).required(),
    description: Joi.string().max(2000).optional().allow(''),
    outcome: Joi.string().valid(
      'POSITIVE', 'NEUTRAL', 'NEGATIVE', 'FOLLOW_UP_NEEDED'
    ).optional(),
    duration: Joi.number().integer().min(1).max(480).optional(), // minutes, max 8 hours
    scheduledDate: Joi.date().optional(),
    completedDate: Joi.date().max('now').optional()
  }),

  update: Joi.object({
    type: Joi.string().valid(
      'CALL', 'MEETING', 'WHATSAPP', 'EMAIL', 'TRAINING', 'OTHER'
    ).optional(),
    summary: Joi.string().min(5).max(500).optional(),
    description: Joi.string().max(2000).optional().allow(''),
    outcome: Joi.string().valid(
      'POSITIVE', 'NEUTRAL', 'NEGATIVE', 'FOLLOW_UP_NEEDED'
    ).optional(),
    duration: Joi.number().integer().min(1).max(480).optional(),
    scheduledDate: Joi.date().optional().allow(null),
    completedDate: Joi.date().max('now').optional().allow(null)
  }).min(1),

  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    merchantId: Joi.string().uuid().optional(),
    type: Joi.string().valid(
      'CALL', 'MEETING', 'WHATSAPP', 'EMAIL', 'TRAINING', 'OTHER'
    ).optional(),
    outcome: Joi.string().valid(
      'POSITIVE', 'NEUTRAL', 'NEGATIVE', 'FOLLOW_UP_NEEDED'
    ).optional(),
    createdById: Joi.string().uuid().optional(),
    dateFrom: Joi.date().optional(),
    dateTo: Joi.date().optional(),
    search: Joi.string().max(255).optional(),
    sortBy: Joi.string().valid('createdAt', 'scheduledDate', 'completedDate', 'type', 'outcome').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  params: Joi.object({
    id: Joi.string().uuid().required(),
    merchantId: Joi.string().uuid().required()
  })
};

/**
 * Check if user can access merchant activities
 */
const canAccessMerchantActivities = async (userId: string, userRole: string, merchantId: string): Promise<boolean> => {
  if (userRole === 'ADMIN') {
    return true;
  }

  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: { assignedRepId: true }
  });

  return merchant?.assignedRepId === userId;
};

/**
 * Build activity query filters
 */
const buildActivityFilters = (filters: ActivityFilters, userRole: string, userId: string) => {
  const where: any = {
    merchant: { deletedAt: null }
  };

  // Role-based filtering
  if (userRole === 'REP') {
    where.merchant.assignedRepId = userId;
  }

  // Merchant filter
  if (filters.merchantId) {
    where.merchantId = filters.merchantId;
  }

  // Type filter
  if (filters.type) {
    where.type = filters.type;
  }

  // Outcome filter
  if (filters.outcome) {
    where.outcome = filters.outcome;
  }

  // Created by filter (admin only)
  if (filters.createdById && userRole === 'ADMIN') {
    where.createdById = filters.createdById;
  }

  // Date range filters
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) {
      where.createdAt.gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      where.createdAt.lte = new Date(filters.dateTo);
    }
  }

  // Search filter
  if (filters.search) {
    where.OR = [
      { summary: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  return where;
};

/**
 * @route   GET /api/activities
 * @desc    Get activities with pagination and filters
 * @access  Private (Admin: all activities, Rep: activities for assigned merchants)
 */
router.get('/',
  authenticate,
  validate({ query: activitySchemas.query }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const filters = req.query as ActivityFilters;
    
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = filters;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build where clause
    const where = buildActivityFilters(filters, user.role, user.id);

    // Get activities with related data
    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: {
          merchant: {
            select: {
              id: true,
              name: true,
              category: true,
              assignedRep: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          createdBy: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take
      }),
      prisma.activity.count({ where })
    ]);

    const totalPages = Math.ceil(total / take);

    logger.info('Activities retrieved', {
      userId: user.id,
      total,
      page,
      limit,
      filters: JSON.stringify(filters)
    });

    res.json({
      success: true,
      data: activities,
      meta: {
        page: Number(page),
        limit: take,
        total,
        totalPages,
        hasNext: Number(page) < totalPages,
        hasPrev: Number(page) > 1
      }
    });
  })
);

/**
 * @route   GET /api/activities/:id
 * @desc    Get single activity by ID
 * @access  Private (Admin: any activity, Rep: activities for assigned merchants only)
 */
router.get('/:id',
  authenticate,
  validate({ params: { id: activitySchemas.params.extract('id') } }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const user = req.user!;

    const activity = await prisma.activity.findUnique({
      where: { id },
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            category: true,
            contactPersonName: true,
            contactPhone: true,
            assignedRepId: true,
            assignedRep: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!activity) {
      throw new AppError('Activity not found', 404);
    }

    // Check access permissions
    const hasAccess = await canAccessMerchantActivities(user.id, user.role, activity.merchantId);
    if (!hasAccess) {
      throw new AppError('Access denied to this activity', 403);
    }

    logger.info('Activity details retrieved', {
      activityId: id,
      merchantId: activity.merchantId,
      userId: user.id
    });

    res.json({
      success: true,
      data: activity
    });
  })
);

/**
 * @route   GET /api/activities/merchant/:merchantId
 * @desc    Get activities for specific merchant
 * @access  Private (Admin: any merchant, Rep: assigned merchants only)
 */
router.get('/merchant/:merchantId',
  authenticate,
  validate({
    params: { merchantId: activitySchemas.params.extract('merchantId') },
    query: activitySchemas.query
  }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { merchantId } = req.params;
    const user = req.user!;
    const filters = req.query as ActivityFilters;

    // Check access permissions
    const hasAccess = await canAccessMerchantActivities(user.id, user.role, merchantId);
    if (!hasAccess) {
      throw new AppError('Access denied to this merchant activities', 403);
    }

    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = filters;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build where clause with merchant filter
    const where = buildActivityFilters({ ...filters, merchantId }, user.role, user.id);

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: {
          createdBy: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take
      }),
      prisma.activity.count({ where })
    ]);

    const totalPages = Math.ceil(total / take);

    logger.info('Merchant activities retrieved', {
      merchantId,
      userId: user.id,
      total,
      page
    });

    res.json({
      success: true,
      data: activities,
      meta: {
        page: Number(page),
        limit: take,
        total,
        totalPages,
        hasNext: Number(page) < totalPages,
        hasPrev: Number(page) > 1
      }
    });
  })
);

/**
 * @route   POST /api/activities
 * @desc    Create new activity
 * @access  Private (Admin and Rep)
 */
router.post('/',
  authenticate,
  adminOrRep,
  validate({ body: activitySchemas.create }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const activityData = req.body as CreateActivityRequest;

    // Check access permissions for the merchant
    const hasAccess = await canAccessMerchantActivities(user.id, user.role, activityData.merchantId);
    if (!hasAccess) {
      throw new AppError('Access denied to create activities for this merchant', 403);
    }

    // Validate merchant exists and is not deleted
    const merchant = await prisma.merchant.findFirst({
      where: {
        id: activityData.merchantId,
        deletedAt: null
      },
      select: { id: true, name: true, assignedRepId: true }
    });

    if (!merchant) {
      throw new AppError('Merchant not found or has been deleted', 404);
    }

    // Set completed date to now if not provided and no scheduled date
    const completedDate = activityData.completedDate || 
      (!activityData.scheduledDate ? new Date() : null);

    const activity = await prisma.activity.create({
      data: {
        merchantId: activityData.merchantId,
        type: activityData.type as ActivityType,
        summary: activityData.summary,
        description: activityData.description || null,
        outcome: activityData.outcome || null,
        duration: activityData.duration || null,
        scheduledDate: activityData.scheduledDate || null,
        completedDate,
        createdById: user.id
      },
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            category: true,
            assignedRep: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Log activity creation
    logAudit('ACTIVITY_CREATED', 'activity', activity.id, user.id, {
      merchantId: activityData.merchantId,
      merchantName: merchant.name,
      activityType: activityData.type,
      summary: activityData.summary
    });

    logger.info('Activity created', {
      activityId: activity.id,
      merchantId: activityData.merchantId,
      type: activityData.type,
      createdBy: user.id
    });

    res.status(201).json({
      success: true,
      data: activity,
      message: 'Activity created successfully'
    });
  })
);

/**
 * @route   PUT /api/activities/:id
 * @desc    Update activity
 * @access  Private (Admin: any activity, Rep: own activities for assigned merchants)
 */
router.put('/:id',
  authenticate,
  validate({
    params: { id: activitySchemas.params.extract('id') },
    body: activitySchemas.update
  }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const user = req.user!;
    const updateData = req.body;

    const activity = await prisma.activity.findUnique({
      where: { id },
      include: {
        merchant: {
          select: { assignedRepId: true, name: true }
        }
      }
    });

    if (!activity) {
      throw new AppError('Activity not found', 404);
    }

    // Check permissions: Admin can update any, Rep can update own activities for assigned merchants
    const canUpdate = user.role === 'ADMIN' || 
      (activity.createdById === user.id && activity.merchant.assignedRepId === user.id);

    if (!canUpdate) {
      throw new AppError('Access denied to update this activity', 403);
    }

    const updatedActivity = await prisma.activity.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            category: true,
            assignedRep: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Log activity update
    logAudit('ACTIVITY_UPDATED', 'activity', id, user.id, {
      merchantId: activity.merchantId,
      merchantName: activity.merchant.name,
      changes: updateData
    });

    logger.info('Activity updated', {
      activityId: id,
      merchantId: activity.merchantId,
      updatedBy: user.id,
      changes: Object.keys(updateData)
    });

    res.json({
      success: true,
      data: updatedActivity,
      message: 'Activity updated successfully'
    });
  })
);

/**
 * @route   DELETE /api/activities/:id
 * @desc    Delete activity (soft delete)
 * @access  Private (Admin: any activity, Rep: own activities for assigned merchants)
 */
router.delete('/:id',
  authenticate,
  validate({ params: { id: activitySchemas.params.extract('id') } }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const user = req.user!;

    const activity = await prisma.activity.findUnique({
      where: { id },
      include: {
        merchant: {
          select: { assignedRepId: true, name: true }
        }
      }
    });

    if (!activity) {
      throw new AppError('Activity not found', 404);
    }

    // Check permissions: Admin can delete any, Rep can delete own activities for assigned merchants
    const canDelete = user.role === 'ADMIN' || 
      (activity.createdById === user.id && activity.merchant.assignedRepId === user.id);

    if (!canDelete) {
      throw new AppError('Access denied to delete this activity', 403);
    }

    // Soft delete
    await prisma.activity.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        // Clear sensitive data
        description: null
      }
    });

    // Log activity deletion
    logAudit('ACTIVITY_DELETED', 'activity', id, user.id, {
      merchantId: activity.merchantId,
      merchantName: activity.merchant.name,
      activityType: activity.type,
      summary: activity.summary
    });

    logger.info('Activity deleted', {
      activityId: id,
      merchantId: activity.merchantId,
      deletedBy: user.id
    });

    res.json({
      success: true,
      message: 'Activity deleted successfully'
    });
  })
);

/**
 * @route   GET /api/activities/stats/summary
 * @desc    Get activity statistics summary
 * @access  Private
 */
router.get('/stats/summary',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!;

    // Build filter based on user role
    const where: any = {
      deletedAt: null,
      merchant: { deletedAt: null }
    };

    if (user.role === 'REP') {
      where.merchant.assignedRepId = user.id;
    }

    // Get activity type distribution
    const typeStats = await prisma.activity.groupBy({
      by: ['type'],
      where,
      _count: { type: true }
    });

    // Get outcome distribution
    const outcomeStats = await prisma.activity.groupBy({
      by: ['outcome'],
      where: {
        ...where,
        outcome: { not: null }
      },
      _count: { outcome: true }
    });

    // Get recent activity count (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentActivities = await prisma.activity.count({
      where: {
        ...where,
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    // Get total activities
    const totalActivities = await prisma.activity.count({ where });

    // Get average activities per merchant
    const merchantsWithActivities = await prisma.merchant.count({
      where: {
        deletedAt: null,
        activities: { some: { deletedAt: null } },
        ...(user.role === 'REP' && { assignedRepId: user.id })
      }
    });

    const stats = {
      totalActivities,
      recentActivities,
      avgActivitiesPerMerchant: merchantsWithActivities > 0 
        ? Math.round(totalActivities / merchantsWithActivities * 10) / 10 
        : 0,
      typeDistribution: typeStats.reduce((acc, stat) => {
        acc[stat.type] = stat._count.type;
        return acc;
      }, {} as Record<string, number>),
      outcomeDistribution: outcomeStats.reduce((acc, stat) => {
        if (stat.outcome) {
          acc[stat.outcome] = stat._count.outcome;
        }
        return acc;
      }, {} as Record<string, number>)
    };

    logger.info('Activity stats retrieved', {
      userId: user.id,
      totalActivities,
      recentActivities
    });

    res.json({
      success: true,
      data: stats
    });
  })
);

/**
 * @route   GET /api/activities/rep/:repId/performance
 * @desc    Get rep activity performance metrics (Admin only)
 * @access  Admin
 */
router.get('/rep/:repId/performance',
  authenticate,
  validate({
    params: Joi.object({
      repId: Joi.string().uuid().required()
    }),
    query: Joi.object({
      dateFrom: Joi.date().optional(),
      dateTo: Joi.date().optional()
    })
  }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { repId } = req.params;
    const { dateFrom, dateTo } = req.query;
    const user = req.user!;

    // Only admins can view rep performance
    if (user.role !== 'ADMIN') {
      throw new AppError('Access denied. Admin privileges required.', 403);
    }

    // Validate rep exists
    const rep = await prisma.user.findFirst({
      where: {
        id: repId,
        role: 'REP',
        status: 'ACTIVE'
      },
      select: { id: true, name: true, email: true }
    });

    if (!rep) {
      throw new AppError('Sales representative not found', 404);
    }

    // Build date filter
    const dateFilter: any = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom as string);
    if (dateTo) dateFilter.lte = new Date(dateTo as string);

    const where: any = {
      createdById: repId,
      deletedAt: null
    };

    if (Object.keys(dateFilter).length > 0) {
      where.createdAt = dateFilter;
    }

    // Get rep's activity performance
    const [totalActivities, typeBreakdown, outcomeBreakdown] = await Promise.all([
      prisma.activity.count({ where }),
      prisma.activity.groupBy({
        by: ['type'],
        where,
        _count: { type: true }
      }),
      prisma.activity.groupBy({
        by: ['outcome'],
        where: {
          ...where,
          outcome: { not: null }
        },
        _count: { outcome: true }
      })
    ]);

    // Get assigned merchants count
    const assignedMerchants = await prisma.merchant.count({
      where: {
        assignedRepId: repId,
        deletedAt: null
      }
    });

    const performance = {
      rep,
      period: { dateFrom, dateTo },
      metrics: {
        totalActivities,
        assignedMerchants,
        avgActivitiesPerMerchant: assignedMerchants > 0 
          ? Math.round(totalActivities / assignedMerchants * 10) / 10 
          : 0
      },
      breakdown: {
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
      }
    };

    logger.info('Rep activity performance retrieved', {
      repId,
      requestedBy: user.id,
      totalActivities,
      assignedMerchants
    });

    res.json({
      success: true,
      data: performance
    });
  })
);

export default router;