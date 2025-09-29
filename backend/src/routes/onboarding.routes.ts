import express from 'express';
import { PrismaClient, OnboardingStatus } from '@prisma/client';
import { authenticate, adminOrRep } from '../middleware/auth';
import { validate } from '../middleware/validation';
import Joi from 'joi';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';
import { logger, logAudit } from '../utils/logger';
import { createLivePayout } from './pipeline.routes';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Onboarding requirement weights for completion calculation
 */
const REQUIREMENT_WEIGHTS = {
  surveyFilled: 0.25,      // 25%
  offersAdded: 0.25,       // 25%
  branchesCovered: 0.25,   // 25%
  assetsComplete: 0.25     // 25%
};

/**
 * Validation schemas
 */
const onboardingSchemas = {
  update: Joi.object({
    surveyFilled: Joi.boolean().optional(),
    offersAdded: Joi.boolean().optional(),
    branchesCovered: Joi.boolean().optional(),
    assetsComplete: Joi.boolean().optional(),
    qaApproved: Joi.boolean().optional(),
    qaNotes: Joi.string().max(1000).optional().allow(''),
    internalNotes: Joi.string().max(1000).optional().allow('')
  }).min(1),

  bulkUpdate: Joi.object({
    surveyFilled: Joi.boolean().optional(),
    offersAdded: Joi.boolean().optional(),
    branchesCovered: Joi.boolean().optional(),
    assetsComplete: Joi.boolean().optional(),
    qaApproved: Joi.boolean().optional(),
    qaNotes: Joi.string().max(1000).optional().allow(''),
    internalNotes: Joi.string().max(1000).optional().allow('')
  }),

  statusUpdate: Joi.object({
    status: Joi.string().valid('IN_PROGRESS', 'READY_FOR_QA', 'QA_FAILED', 'LIVE').required(),
    notes: Joi.string().max(1000).optional().allow('')
  }),

  params: Joi.object({
    merchantId: Joi.string().uuid().required()
  })
};

/**
 * Calculate completion percentage based on requirements
 */
const calculateCompletionPercentage = (requirements: {
  surveyFilled: boolean;
  offersAdded: boolean;
  branchesCovered: boolean;
  assetsComplete: boolean;
}): number => {
  let completedWeight = 0;

  if (requirements.surveyFilled) completedWeight += REQUIREMENT_WEIGHTS.surveyFilled;
  if (requirements.offersAdded) completedWeight += REQUIREMENT_WEIGHTS.offersAdded;
  if (requirements.branchesCovered) completedWeight += REQUIREMENT_WEIGHTS.branchesCovered;
  if (requirements.assetsComplete) completedWeight += REQUIREMENT_WEIGHTS.assetsComplete;

  return completedWeight;
};

/**
 * Check if all onboarding requirements are met
 */
const areAllRequirementsMet = (onboarding: any): boolean => {
  return (
    onboarding.surveyFilled &&
    onboarding.offersAdded &&
    onboarding.branchesCovered &&
    onboarding.assetsComplete
  );
};

/**
 * Determine onboarding status based on requirements and QA
 */
const determineStatus = (
  requirements: any,
  qaApproved: boolean | null,
  currentStatus: OnboardingStatus
): OnboardingStatus => {
  const allRequirementsMet = areAllRequirementsMet(requirements);

  if (!allRequirementsMet) {
    return 'IN_PROGRESS';
  }

  if (allRequirementsMet && qaApproved === null && currentStatus !== 'QA_FAILED') {
    return 'READY_FOR_QA';
  }

  if (allRequirementsMet && qaApproved === false) {
    return 'QA_FAILED';
  }

  if (allRequirementsMet && qaApproved === true) {
    return 'LIVE';
  }

  return currentStatus;
};

/**
 * Check if user can access merchant onboarding
 */
const canAccessMerchantOnboarding = async (userId: string, userRole: string, merchantId: string): Promise<boolean> => {
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
 * @route   GET /api/onboarding/:merchantId
 * @desc    Get merchant onboarding details
 * @access  Private (Admin: any merchant, Rep: assigned merchants only)
 */
router.get('/:merchantId',
  authenticate,
  validate({ params: onboardingSchemas.params }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { merchantId } = req.params;
    const user = req.user!;

    // Check access permissions
    const hasAccess = await canAccessMerchantOnboarding(user.id, user.role, merchantId);
    if (!hasAccess) {
      throw new AppError('Access denied to this merchant onboarding', 403);
    }

    const onboarding = await prisma.onboarding.findUnique({
      where: { merchantId },
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            category: true,
            assignedRepId: true,
            assignedRep: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        lastUpdatedBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!onboarding) {
      throw new AppError('Onboarding record not found', 404);
    }

    // Calculate requirement breakdown
    const requirementBreakdown = {
      surveyFilled: {
        completed: onboarding.surveyFilled,
        weight: REQUIREMENT_WEIGHTS.surveyFilled,
        description: 'Merchant survey completed with all required information'
      },
      offersAdded: {
        completed: onboarding.offersAdded,
        weight: REQUIREMENT_WEIGHTS.offersAdded,
        description: 'At least one offer/product added to the system'
      },
      branchesCovered: {
        completed: onboarding.branchesCovered,
        weight: REQUIREMENT_WEIGHTS.branchesCovered,
        description: 'All merchant branch locations covered and verified'
      },
      assetsComplete: {
        completed: onboarding.assetsComplete,
        weight: REQUIREMENT_WEIGHTS.assetsComplete,
        description: 'Logo, description, and location assets uploaded and verified'
      }
    };

    // Check if can go live
    const canGoLive = areAllRequirementsMet(onboarding) && onboarding.qaApproved;

    const response = {
      ...onboarding,
      requirementBreakdown,
      canGoLive,
      allRequirementsMet: areAllRequirementsMet(onboarding)
    };

    logger.info('Onboarding details retrieved', {
      merchantId,
      status: onboarding.status,
      completionPercentage: onboarding.completionPercentage,
      userId: user.id
    });

    res.json({
      success: true,
      data: response
    });
  })
);

/**
 * @route   PATCH /api/onboarding/:merchantId
 * @desc    Update merchant onboarding requirements
 * @access  Private (Admin: any merchant, Rep: assigned merchants only)
 */
router.patch('/:merchantId',
  authenticate,
  adminOrRep,
  validate({
    params: onboardingSchemas.params,
    body: onboardingSchemas.update
  }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { merchantId } = req.params;
    const updateData = req.body;
    const user = req.user!;

    // Check access permissions
    const hasAccess = await canAccessMerchantOnboarding(user.id, user.role, merchantId);
    if (!hasAccess) {
      throw new AppError('Access denied to this merchant onboarding', 403);
    }

    // Get current onboarding record
    const currentOnboarding = await prisma.onboarding.findUnique({
      where: { merchantId },
      include: {
        merchant: {
          select: { 
            id: true, 
            name: true, 
            assignedRepId: true,
            pipeline: { select: { currentStage: true } }
          }
        }
      }
    });

    if (!currentOnboarding) {
      throw new AppError('Onboarding record not found', 404);
    }

    // Check if merchant is in Won stage
    if (currentOnboarding.merchant.pipeline?.currentStage !== 'WON') {
      throw new AppError('Merchant must be in Won stage to update onboarding', 400);
    }

    // Merge current data with updates for calculation
    const updatedRequirements = {
      surveyFilled: updateData.surveyFilled ?? currentOnboarding.surveyFilled,
      offersAdded: updateData.offersAdded ?? currentOnboarding.offersAdded,
      branchesCovered: updateData.branchesCovered ?? currentOnboarding.branchesCovered,
      assetsComplete: updateData.assetsComplete ?? currentOnboarding.assetsComplete
    };

    // Calculate new completion percentage
    const newCompletionPercentage = calculateCompletionPercentage(updatedRequirements);

    // Handle QA approval updates (admin only)
    let qaApproved = updateData.qaApproved;
    if (qaApproved !== undefined && user.role !== 'ADMIN') {
      qaApproved = undefined; // Remove QA update if not admin
    }

    // Determine new status
    const newStatus = determineStatus(
      updatedRequirements,
      qaApproved ?? currentOnboarding.qaApproved,
      currentOnboarding.status
    );

    // Update onboarding in transaction (may trigger payout for LIVE status)
    const result = await prisma.$transaction(async (tx) => {
      const updatedOnboarding = await tx.onboarding.update({
        where: { merchantId },
        data: {
          ...updateData,
          status: newStatus,
          completionPercentage: newCompletionPercentage,
          ...(newStatus === 'LIVE' && { liveDate: new Date() }),
          lastUpdatedById: user.id,
          updatedAt: new Date()
        },
        include: {
          merchant: {
            select: {
              id: true,
              name: true,
              assignedRepId: true,
              assignedRep: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        }
      });

      // If went live and has assigned rep, create Live payout
      if (
        newStatus === 'LIVE' && 
        currentOnboarding.status !== 'LIVE' && 
        updatedOnboarding.merchant.assignedRepId
      ) {
        // Create Live payout asynchronously to avoid blocking
        setImmediate(() => {
          createLivePayout(merchantId, updatedOnboarding.merchant.assignedRepId!, user.id)
            .catch(error => {
              logger.error('Failed to create Live payout asynchronously', {
                error: error instanceof Error ? error.message : 'Unknown error',
                merchantId,
                repId: updatedOnboarding.merchant.assignedRepId!
              });
            });
        });
      }

      return updatedOnboarding;
    });

    // Log onboarding update
    logAudit('ONBOARDING_UPDATED', 'onboarding', result.id, user.id, {
      merchantId,
      merchantName: result.merchant.name,
      previousStatus: currentOnboarding.status,
      newStatus,
      changes: updateData,
      completionPercentage: newCompletionPercentage
    });

    logger.info('Onboarding updated', {
      merchantId,
      previousStatus: currentOnboarding.status,
      newStatus,
      completionPercentage: newCompletionPercentage,
      updatedBy: user.id,
      wentLive: newStatus === 'LIVE' && currentOnboarding.status !== 'LIVE'
    });

    res.json({
      success: true,
      data: result,
      message: newStatus === 'LIVE' && currentOnboarding.status !== 'LIVE'
        ? 'Merchant is now LIVE! Payout has been created.'
        : 'Onboarding updated successfully'
    });
  })
);

/**
 * @route   PATCH /api/onboarding/:merchantId/status
 * @desc    Manually update onboarding status (Admin only)
 * @access  Admin
 */
router.patch('/:merchantId/status',
  authenticate,
  validate({
    params: onboardingSchemas.params,
    body: onboardingSchemas.statusUpdate
  }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { merchantId } = req.params;
    const { status, notes } = req.body;
    const user = req.user!;

    // Only admins can manually change status
    if (user.role !== 'ADMIN') {
      throw new AppError('Only administrators can manually update onboarding status', 403);
    }

    const currentOnboarding = await prisma.onboarding.findUnique({
      where: { merchantId },
      include: {
        merchant: {
          select: { 
            name: true, 
            assignedRepId: true 
          }
        }
      }
    });

    if (!currentOnboarding) {
      throw new AppError('Onboarding record not found', 404);
    }

    // Validate status change
    const newStatus = status as OnboardingStatus;
    if (currentOnboarding.status === newStatus) {
      throw new AppError('Onboarding is already in this status', 400);
    }

    // Update onboarding status in transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatedOnboarding = await tx.onboarding.update({
        where: { merchantId },
        data: {
          status: newStatus,
          ...(newStatus === 'LIVE' && { liveDate: new Date() }),
          ...(notes && { internalNotes: notes }),
          lastUpdatedById: user.id,
          updatedAt: new Date()
        },
        include: {
          merchant: {
            select: {
              id: true,
              name: true,
              assignedRepId: true,
              assignedRep: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        }
      });

      // If went live and has assigned rep, create Live payout
      if (
        newStatus === 'LIVE' && 
        currentOnboarding.status !== 'LIVE' && 
        updatedOnboarding.merchant.assignedRepId
      ) {
        setImmediate(() => {
          createLivePayout(merchantId, updatedOnboarding.merchant.assignedRepId!, user.id)
            .catch(error => {
              logger.error('Failed to create Live payout asynchronously', {
                error: error instanceof Error ? error.message : 'Unknown error',
                merchantId,
                repId: updatedOnboarding.merchant.assignedRepId!
              });
            });
        });
      }

      return updatedOnboarding;
    });

    // Log status update
    logAudit('ONBOARDING_STATUS_CHANGED', 'onboarding', result.id, user.id, {
      merchantId,
      merchantName: result.merchant.name,
      previousStatus: currentOnboarding.status,
      newStatus,
      notes
    });

    logger.info('Onboarding status manually updated', {
      merchantId,
      previousStatus: currentOnboarding.status,
      newStatus,
      updatedBy: user.id,
      wentLive: newStatus === 'LIVE' && currentOnboarding.status !== 'LIVE'
    });

    res.json({
      success: true,
      data: result,
      message: newStatus === 'LIVE' && currentOnboarding.status !== 'LIVE'
        ? 'Merchant is now LIVE! Payout has been created.'
        : 'Onboarding status updated successfully'
    });
  })
);

/**
 * @route   GET /api/onboarding/stats/progress
 * @desc    Get onboarding progress statistics
 * @access  Private
 */
router.get('/stats/progress',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!;

    // Build filter based on user role
    const where: any = {
      merchant: { deletedAt: null }
    };

    if (user.role === 'REP') {
      where.merchant.assignedRepId = user.id;
    }

    // Get onboarding status distribution
    const statusStats = await prisma.onboarding.groupBy({
      by: ['status'],
      where,
      _count: {
        status: true
      },
      _avg: {
        completionPercentage: true
      }
    });

    // Get requirement completion stats
    const requirementStats = await prisma.onboarding.aggregate({
      where,
      _count: {
        surveyFilled: true,
        offersAdded: true,
        branchesCovered: true,
        assetsComplete: true
      },
      _sum: {
        surveyFilled: true,
        offersAdded: true,
        branchesCovered: true,
        assetsComplete: true
      }
    });

    // Calculate completion stats for each requirement
    const total = statusStats.reduce((sum, stat) => sum + stat._count.status, 0);

    const stats = {
      total,
      statusDistribution: statusStats.reduce((acc, stat) => {
        acc[stat.status] = {
          count: stat._count.status,
          percentage: total > 0 ? Math.round((stat._count.status / total) * 100) : 0,
          avgCompletion: stat._avg.completionPercentage 
            ? Math.round(stat._avg.completionPercentage * 100) 
            : 0
        };
        return acc;
      }, {} as Record<string, any>),
      requirementCompletion: {
        surveyFilled: {
          completed: requirementStats._sum.surveyFilled || 0,
          total: requirementStats._count.surveyFilled || 0,
          percentage: requirementStats._count.surveyFilled > 0 
            ? Math.round(((requirementStats._sum.surveyFilled || 0) / requirementStats._count.surveyFilled) * 100)
            : 0
        },
        offersAdded: {
          completed: requirementStats._sum.offersAdded || 0,
          total: requirementStats._count.offersAdded || 0,
          percentage: requirementStats._count.offersAdded > 0 
            ? Math.round(((requirementStats._sum.offersAdded || 0) / requirementStats._count.offersAdded) * 100)
            : 0
        },
        branchesCovered: {
          completed: requirementStats._sum.branchesCovered || 0,
          total: requirementStats._count.branchesCovered || 0,
          percentage: requirementStats._count.branchesCovered > 0 
            ? Math.round(((requirementStats._sum.branchesCovered || 0) / requirementStats._count.branchesCovered) * 100)
            : 0
        },
        assetsComplete: {
          completed: requirementStats._sum.assetsComplete || 0,
          total: requirementStats._count.assetsComplete || 0,
          percentage: requirementStats._count.assetsComplete > 0 
            ? Math.round(((requirementStats._sum.assetsComplete || 0) / requirementStats._count.assetsComplete) * 100)
            : 0
        }
      }
    };

    logger.info('Onboarding progress stats retrieved', {
      userId: user.id,
      total,
      liveCount: stats.statusDistribution.LIVE?.count || 0
    });

    res.json({
      success: true,
      data: stats
    });
  })
);

/**
 * @route   GET /api/onboarding/pending-qa
 * @desc    Get merchants pending QA approval
 * @access  Admin only
 */
router.get('/pending-qa',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!;

    // Only admins can see QA pending items
    if (user.role !== 'ADMIN') {
      throw new AppError('Access denied. Admin privileges required.', 403);
    }

    const pendingQA = await prisma.onboarding.findMany({
      where: {
        status: 'READY_FOR_QA',
        merchant: { deletedAt: null }
      },
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            category: true,
            contactPersonName: true,
            assignedRep: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'asc' // Oldest first
      }
    });

    const pendingData = pendingQA.map(onboarding => ({
      merchantId: onboarding.merchantId,
      merchant: onboarding.merchant,
      completionPercentage: Math.round(onboarding.completionPercentage * 100),
      surveyFilled: onboarding.surveyFilled,
      offersAdded: onboarding.offersAdded,
      branchesCovered: onboarding.branchesCovered,
      assetsComplete: onboarding.assetsComplete,
      readyForQADate: onboarding.updatedAt,
      daysPending: Math.ceil((Date.now() - onboarding.updatedAt.getTime()) / (1000 * 60 * 60 * 24))
    }));

    logger.info('Pending QA items retrieved', {
      userId: user.id,
      pendingCount: pendingData.length
    });

    res.json({
      success: true,
      data: pendingData,
      meta: {
        total: pendingData.length
      }
    });
  })
);

export default router;