import express from 'express';
import { PrismaClient, PipelineStage, MerchantCategory, UserRole } from '@prisma/client';
import { authenticate, adminOnly, adminOrRep } from '../middleware/auth';
import { validate } from '../middleware/validation';
import Joi from 'joi';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest, CreateMerchantRequest, UpdateMerchantRequest, MerchantFilters } from '../types';
import { logger, logAudit } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Validation Schemas
 */
const merchantSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    category: Joi.string().valid(
      'FOOD', 'BEAUTY', 'SPORTS', 'DESSERTS_COFFEE', 'ELECTRONICS', 
      'FASHION', 'SERVICES', 'RETAIL', 'OTHER'
    ).required(),
    contactPersonName: Joi.string().min(2).max(100).required(),
    contactPhone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).max(20).required(),
    contactEmail: Joi.string().email().max(255).optional(),
    location: Joi.string().min(5).max(200).required(),
    description: Joi.string().min(10).max(1000).optional(),
    assignedRepId: Joi.string().uuid().optional()
  }),
  
  update: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    category: Joi.string().valid(
      'FOOD', 'BEAUTY', 'SPORTS', 'DESSERTS_COFFEE', 'ELECTRONICS', 
      'FASHION', 'SERVICES', 'RETAIL', 'OTHER'
    ).optional(),
    contactPersonName: Joi.string().min(2).max(100).optional(),
    contactPhone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).max(20).optional(),
    contactEmail: Joi.string().email().max(255).optional().allow(''),
    location: Joi.string().min(5).max(200).optional(),
    description: Joi.string().min(10).max(1000).optional().allow(''),
    assignedRepId: Joi.string().uuid().optional().allow(null),
    logoUrl: Joi.string().uri().optional().allow(''),
    websiteUrl: Joi.string().uri().optional().allow(''),
    socialMediaLinks: Joi.object().optional()
  }).min(1),

  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().max(255).optional(),
    category: Joi.string().valid(
      'FOOD', 'BEAUTY', 'SPORTS', 'DESSERTS_COFFEE', 'ELECTRONICS', 
      'FASHION', 'SERVICES', 'RETAIL', 'OTHER'
    ).optional(),
    stage: Joi.string().valid(
      'PENDING_FIRST_VISIT', 'FOLLOW_UP_NEEDED', 'CONTRACT_SENT', 'WON', 'REJECTED'
    ).optional(),
    assignedRepId: Joi.string().uuid().optional(),
    sortBy: Joi.string().valid('name', 'category', 'createdAt', 'updatedAt', 'stage').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  params: Joi.object({
    id: Joi.string().uuid().required()
  })
};

/**
 * Check if user can access merchant
 */
const canAccessMerchant = async (userId: string, userRole: UserRole, merchantId: string): Promise<boolean> => {
  if (userRole === 'ADMIN') {
    return true;
  }

  // REPs can only access their assigned merchants
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: { assignedRepId: true }
  });

  return merchant?.assignedRepId === userId;
};

/**
 * Build merchant query filters
 */
const buildMerchantFilters = (filters: MerchantFilters, userRole: UserRole, userId: string) => {
  const where: any = {};

  // Role-based filtering
  if (userRole === 'REP') {
    where.assignedRepId = userId;
  }

  // Search filter
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { contactPersonName: { contains: filters.search, mode: 'insensitive' } },
      { contactPhone: { contains: filters.search } },
      { location: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  // Category filter
  if (filters.category) {
    where.category = filters.category;
  }

  // Stage filter (from pipeline)
  if (filters.stage) {
    where.pipeline = {
      currentStage: filters.stage
    };
  }

  // Assigned rep filter (admin only)
  if (filters.assignedRepId && userRole === 'ADMIN') {
    where.assignedRepId = filters.assignedRepId;
  }

  return where;
};

/**
 * @route   GET /api/merchants
 * @desc    Get all merchants with pagination and filters
 * @access  Private (Admin: all merchants, Rep: assigned merchants only)
 */
router.get('/',
  authenticate,
  validate({ query: merchantSchemas.query }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const filters = req.query as MerchantFilters;
    
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = filters;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build where clause
    const where = buildMerchantFilters(filters, user.role as UserRole, user.id);

    // Get merchants with related data
    const [merchants, total] = await Promise.all([
      prisma.merchant.findMany({
        where,
        include: {
          pipeline: true,
          onboarding: true,
          assignedRep: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              activities: true
            }
          }
        },
        orderBy: sortBy === 'stage' 
          ? { pipeline: { currentStage: sortOrder } }
          : { [sortBy]: sortOrder },
        skip,
        take
      }),
      prisma.merchant.count({ where })
    ]);

    const totalPages = Math.ceil(total / take);

    // Transform data for response
    const transformedMerchants = merchants.map(merchant => ({
      id: merchant.id,
      name: merchant.name,
      category: merchant.category,
      contactPersonName: merchant.contactPersonName,
      contactPhone: merchant.contactPhone,
      contactEmail: merchant.contactEmail,
      location: merchant.location,
      description: merchant.description,
      logoUrl: merchant.logoUrl,
      websiteUrl: merchant.websiteUrl,
      socialMediaLinks: merchant.socialMediaLinks,
      assignedRepId: merchant.assignedRepId,
      assignedRep: merchant.assignedRep,
      currentStage: merchant.pipeline?.currentStage || 'PENDING_FIRST_VISIT',
      nextActionDate: merchant.pipeline?.nextActionDate,
      nextActionDescription: merchant.pipeline?.nextActionDescription,
      onboardingStatus: merchant.onboarding?.status,
      onboardingProgress: merchant.onboarding ? 
        Math.round((merchant.onboarding.completionPercentage || 0) * 100) : 0,
      isLive: merchant.onboarding?.status === 'LIVE',
      totalActivities: merchant._count.activities,
      createdAt: merchant.createdAt,
      updatedAt: merchant.updatedAt
    }));

    logger.info('Merchants retrieved', {
      userId: user.id,
      total,
      page,
      limit,
      filters: JSON.stringify(filters)
    });

    res.json({
      success: true,
      data: transformedMerchants,
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
 * @route   GET /api/merchants/:id
 * @desc    Get single merchant by ID
 * @access  Private (Admin: any merchant, Rep: assigned merchants only)
 */
router.get('/:id',
  authenticate,
  validate({ params: merchantSchemas.params }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const user = req.user!;

    // Check access permissions
    const hasAccess = await canAccessMerchant(user.id, user.role as UserRole, id);
    if (!hasAccess) {
      throw new AppError('Access denied to this merchant', 403);
    }

    const merchant = await prisma.merchant.findUnique({
      where: { id },
      include: {
        pipeline: {
          include: {
            stageHistory: {
              orderBy: { createdAt: 'desc' },
              take: 10,
              include: {
                changedBy: {
                  select: { id: true, name: true, email: true }
                }
              }
            }
          }
        },
        onboarding: true,
        assignedRep: {
          select: { id: true, name: true, email: true, phone: true }
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        payouts: {
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    if (!merchant) {
      throw new AppError('Merchant not found', 404);
    }

    // Transform response
    const response = {
      id: merchant.id,
      name: merchant.name,
      category: merchant.category,
      contactPersonName: merchant.contactPersonName,
      contactPhone: merchant.contactPhone,
      contactEmail: merchant.contactEmail,
      location: merchant.location,
      description: merchant.description,
      logoUrl: merchant.logoUrl,
      websiteUrl: merchant.websiteUrl,
      socialMediaLinks: merchant.socialMediaLinks,
      assignedRepId: merchant.assignedRepId,
      assignedRep: merchant.assignedRep,
      currentStage: merchant.pipeline?.currentStage || 'PENDING_FIRST_VISIT',
      nextActionDate: merchant.pipeline?.nextActionDate,
      nextActionDescription: merchant.pipeline?.nextActionDescription,
      stageHistory: merchant.pipeline?.stageHistory || [],
      onboarding: merchant.onboarding,
      recentActivities: merchant.activities,
      payouts: merchant.payouts,
      totalPayout: merchant.payouts.reduce((sum, payout) => sum + payout.amount, 0),
      createdAt: merchant.createdAt,
      updatedAt: merchant.updatedAt
    };

    logger.info('Merchant details retrieved', {
      merchantId: id,
      userId: user.id
    });

    res.json({
      success: true,
      data: response
    });
  })
);

/**
 * @route   POST /api/merchants
 * @desc    Create new merchant
 * @access  Private (Admin and Rep)
 */
router.post('/',
  authenticate,
  adminOrRep,
  validate({ body: merchantSchemas.create }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const merchantData = req.body as CreateMerchantRequest;

    // For reps, automatically assign to themselves unless admin specifies otherwise
    if (user.role === 'REP') {
      merchantData.assignedRepId = user.id;
    } else if (!merchantData.assignedRepId) {
      // Admin can leave unassigned
      merchantData.assignedRepId = undefined;
    }

    // Validate assigned rep exists if specified
    if (merchantData.assignedRepId) {
      const assignedRep = await prisma.user.findFirst({
        where: {
          id: merchantData.assignedRepId,
          role: { in: ['REP', 'ADMIN'] },
          status: 'ACTIVE'
        }
      });

      if (!assignedRep) {
        throw new AppError('Invalid assigned representative', 400);
      }
    }

    // Create merchant and initial pipeline in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create merchant
      const merchant = await tx.merchant.create({
        data: {
          name: merchantData.name,
          category: merchantData.category as MerchantCategory,
          contactPersonName: merchantData.contactPersonName,
          contactPhone: merchantData.contactPhone,
          contactEmail: merchantData.contactEmail || null,
          location: merchantData.location,
          description: merchantData.description || null,
          assignedRepId: merchantData.assignedRepId || null,
          createdById: user.id
        }
      });

      // Create initial pipeline entry
      const pipeline = await tx.pipeline.create({
        data: {
          merchantId: merchant.id,
          currentStage: 'PENDING_FIRST_VISIT',
          nextActionDescription: 'Schedule first visit with merchant',
          nextActionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          lastUpdatedById: user.id
        }
      });

      // Create stage history entry
      await tx.pipelineStageHistory.create({
        data: {
          pipelineId: pipeline.id,
          stage: 'PENDING_FIRST_VISIT',
          changedById: user.id,
          notes: 'Initial merchant registration'
        }
      });

      return merchant;
    });

    // Log merchant creation
    logAudit('MERCHANT_CREATED', 'merchant', result.id, user.id, {
      merchantName: result.name,
      category: result.category,
      assignedRepId: result.assignedRepId
    });

    logger.info('Merchant created', {
      merchantId: result.id,
      merchantName: result.name,
      createdBy: user.id,
      assignedRepId: result.assignedRepId
    });

    // Fetch complete merchant data for response
    const merchantWithDetails = await prisma.merchant.findUnique({
      where: { id: result.id },
      include: {
        pipeline: true,
        assignedRep: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: merchantWithDetails,
      message: 'Merchant created successfully'
    });
  })
);

/**
 * @route   PUT /api/merchants/:id
 * @desc    Update merchant
 * @access  Private (Admin: any merchant, Rep: assigned merchants only)
 */
router.put('/:id',
  authenticate,
  validate({ 
    params: merchantSchemas.params,
    body: merchantSchemas.update 
  }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const user = req.user!;
    const updateData = req.body as UpdateMerchantRequest;

    // Check access permissions
    const hasAccess = await canAccessMerchant(user.id, user.role as UserRole, id);
    if (!hasAccess) {
      throw new AppError('Access denied to this merchant', 403);
    }

    // Validate assigned rep if being changed
    if (updateData.assignedRepId !== undefined) {
      if (updateData.assignedRepId) {
        const assignedRep = await prisma.user.findFirst({
          where: {
            id: updateData.assignedRepId,
            role: { in: ['REP', 'ADMIN'] },
            status: 'ACTIVE'
          }
        });

        if (!assignedRep) {
          throw new AppError('Invalid assigned representative', 400);
        }
      }

      // Only admins can change rep assignments
      if (user.role === 'REP') {
        delete updateData.assignedRepId;
      }
    }

    const updatedMerchant = await prisma.merchant.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        pipeline: true,
        assignedRep: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Log merchant update
    logAudit('MERCHANT_UPDATED', 'merchant', id, user.id, {
      changes: updateData
    });

    logger.info('Merchant updated', {
      merchantId: id,
      updatedBy: user.id,
      changes: Object.keys(updateData)
    });

    res.json({
      success: true,
      data: updatedMerchant,
      message: 'Merchant updated successfully'
    });
  })
);

/**
 * @route   DELETE /api/merchants/:id
 * @desc    Delete merchant (soft delete)
 * @access  Admin only
 */
router.delete('/:id',
  authenticate,
  adminOnly,
  validate({ params: merchantSchemas.params }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const user = req.user!;

    // Check if merchant exists
    const merchant = await prisma.merchant.findUnique({
      where: { id },
      select: { name: true, assignedRepId: true }
    });

    if (!merchant) {
      throw new AppError('Merchant not found', 404);
    }

    // Soft delete by setting deleted flag and updating timestamps
    await prisma.merchant.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        // Optionally clear sensitive data
        contactEmail: null,
        description: null
      }
    });

    // Log merchant deletion
    logAudit('MERCHANT_DELETED', 'merchant', id, user.id, {
      merchantName: merchant.name,
      wasAssignedTo: merchant.assignedRepId
    });

    logger.info('Merchant deleted', {
      merchantId: id,
      merchantName: merchant.name,
      deletedBy: user.id
    });

    res.json({
      success: true,
      message: 'Merchant deleted successfully'
    });
  })
);

/**
 * @route   GET /api/merchants/stats/overview
 * @desc    Get merchant statistics overview
 * @access  Private
 */
router.get('/stats/overview',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!;

    // Build filter based on user role
    const where: any = { deletedAt: null };
    if (user.role === 'REP') {
      where.assignedRepId = user.id;
    }

    // Get merchant counts by stage
    const stageStats = await prisma.pipeline.groupBy({
      by: ['currentStage'],
      where: {
        merchant: where
      },
      _count: {
        currentStage: true
      }
    });

    // Get category distribution
    const categoryStats = await prisma.merchant.groupBy({
      by: ['category'],
      where,
      _count: {
        category: true
      }
    });

    // Get live merchants count
    const liveCount = await prisma.onboarding.count({
      where: {
        status: 'LIVE',
        merchant: where
      }
    });

    // Calculate total merchants
    const totalMerchants = await prisma.merchant.count({ where });

    // Calculate conversion rates
    const pipelineDistribution = stageStats.reduce((acc, stage) => {
      acc[stage.currentStage] = stage._count.currentStage;
      return acc;
    }, {} as Record<string, number>);

    const stats = {
      totalMerchants,
      liveCount,
      conversionRate: totalMerchants > 0 ? Math.round((liveCount / totalMerchants) * 100) : 0,
      pipelineDistribution,
      categoryDistribution: categoryStats.reduce((acc, cat) => {
        acc[cat.category] = cat._count.category;
        return acc;
      }, {} as Record<string, number>)
    };

    logger.info('Merchant stats retrieved', {
      userId: user.id,
      totalMerchants,
      liveCount
    });

    res.json({
      success: true,
      data: stats
    });
  })
);

export default router;