import express from 'express';
import { PrismaClient, PipelineStage, PayoutType } from '@prisma/client';
import { authenticate, adminOrRep } from '../middleware/auth';
import { validate } from '../middleware/validation';
import Joi from 'joi';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';
import { logger, logAudit } from '../utils/logger';
import { getEnvVars } from '../utils/validateEnv';

const router = express.Router();
const prisma = new PrismaClient();
const env = getEnvVars();

/**
 * Pipeline stage transition rules and validation
 */
const STAGE_TRANSITIONS: Record<PipelineStage, PipelineStage[]> = {
  PENDING_FIRST_VISIT: ['FOLLOW_UP_NEEDED', 'REJECTED'],
  FOLLOW_UP_NEEDED: ['CONTRACT_SENT', 'REJECTED'],
  CONTRACT_SENT: ['WON', 'FOLLOW_UP_NEEDED', 'REJECTED'],
  WON: ['REJECTED'], // Can only be rejected from Won, Live is handled via onboarding
  REJECTED: [] // Terminal state
};

/**
 * Default next actions for each stage
 */
const DEFAULT_NEXT_ACTIONS: Record<PipelineStage, string> = {
  PENDING_FIRST_VISIT: 'Schedule and conduct first visit with merchant',
  FOLLOW_UP_NEEDED: 'Follow up on merchant interest and address concerns',
  CONTRACT_SENT: 'Follow up on contract status and get signature',
  WON: 'Begin onboarding process and complete requirements',
  REJECTED: 'No further action required'
};

/**
 * Validation schemas
 */
const pipelineSchemas = {
  stageUpdate: Joi.object({
    stage: Joi.string().valid(
      'PENDING_FIRST_VISIT', 'FOLLOW_UP_NEEDED', 'CONTRACT_SENT', 'WON', 'REJECTED'
    ).required(),
    notes: Joi.string().max(1000).optional(),
    nextActionDescription: Joi.string().max(500).optional(),
    nextActionDate: Joi.date().min('now').optional()
  }),

  nextActionUpdate: Joi.object({
    nextActionDescription: Joi.string().max(500).required(),
    nextActionDate: Joi.date().min('now').optional()
  }),

  params: Joi.object({
    merchantId: Joi.string().uuid().required()
  })
};

/**
 * Check if user can access merchant pipeline
 */
const canAccessMerchantPipeline = async (userId: string, userRole: string, merchantId: string): Promise<boolean> => {
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
 * Create automated payout when merchant reaches Won stage
 */
const createWonPayout = async (merchantId: string, repId: string, changedById: string) => {
  try {
    // Check if Won payout already exists for this merchant
    const existingPayout = await prisma.payoutLedger.findFirst({
      where: {
        merchantId,
        type: 'WON',
        recipientId: repId
      }
    });

    if (existingPayout) {
      logger.info('Won payout already exists', { merchantId, repId });
      return existingPayout;
    }

    // Create Won payout
    const payout = await prisma.payoutLedger.create({
      data: {
        merchantId,
        recipientId: repId,
        type: 'WON',
        amount: env.WON_PAYOUT_AMOUNT,
        description: 'Bonus for merchant reaching Won stage',
        status: 'PENDING',
        createdById: changedById
      }
    });

    // Log payout creation
    logAudit('PAYOUT_CREATED', 'payout', payout.id, changedById, {
      type: 'WON',
      amount: env.WON_PAYOUT_AMOUNT,
      merchantId,
      recipientId: repId
    });

    logger.info('Won payout created', {
      payoutId: payout.id,
      merchantId,
      recipientId: repId,
      amount: env.WON_PAYOUT_AMOUNT,
      createdBy: changedById
    });

    return payout;
  } catch (error) {
    logger.error('Failed to create Won payout', {
      error: error instanceof Error ? error.message : 'Unknown error',
      merchantId,
      repId
    });
    throw error;
  }
};

/**
 * Create automated payout when merchant goes Live
 */
const createLivePayout = async (merchantId: string, repId: string, changedById: string) => {
  try {
    // Check if Live payout already exists for this merchant
    const existingPayout = await prisma.payoutLedger.findFirst({
      where: {
        merchantId,
        type: 'LIVE',
        recipientId: repId
      }
    });

    if (existingPayout) {
      logger.info('Live payout already exists', { merchantId, repId });
      return existingPayout;
    }

    // Create Live payout
    const payout = await prisma.payoutLedger.create({
      data: {
        merchantId,
        recipientId: repId,
        type: 'LIVE',
        amount: env.LIVE_PAYOUT_AMOUNT,
        description: 'Bonus for merchant going Live',
        status: 'PENDING',
        createdById: changedById
      }
    });

    // Log payout creation
    logAudit('PAYOUT_CREATED', 'payout', payout.id, changedById, {
      type: 'LIVE',
      amount: env.LIVE_PAYOUT_AMOUNT,
      merchantId,
      recipientId: repId
    });

    logger.info('Live payout created', {
      payoutId: payout.id,
      merchantId,
      recipientId: repId,
      amount: env.LIVE_PAYOUT_AMOUNT,
      createdBy: changedById
    });

    return payout;
  } catch (error) {
    logger.error('Failed to create Live payout', {
      error: error instanceof Error ? error.message : 'Unknown error',
      merchantId,
      repId
    });
    throw error;
  }
};

/**
 * @route   GET /api/pipeline/:merchantId
 * @desc    Get merchant pipeline details
 * @access  Private (Admin: any merchant, Rep: assigned merchants only)
 */
router.get('/:merchantId',
  authenticate,
  validate({ params: pipelineSchemas.params }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { merchantId } = req.params;
    const user = req.user!;

    // Check access permissions
    const hasAccess = await canAccessMerchantPipeline(user.id, user.role, merchantId);
    if (!hasAccess) {
      throw new AppError('Access denied to this merchant pipeline', 403);
    }

    const pipeline = await prisma.pipeline.findUnique({
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
        stageHistory: {
          orderBy: { createdAt: 'desc' },
          include: {
            changedBy: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        lastUpdatedBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!pipeline) {
      throw new AppError('Pipeline not found', 404);
    }

    // Check if next action is overdue
    const isOverdue = pipeline.nextActionDate && pipeline.nextActionDate < new Date();

    // Get possible next stages
    const possibleStages = STAGE_TRANSITIONS[pipeline.currentStage] || [];

    const response = {
      ...pipeline,
      isOverdue,
      possibleStages,
      stageTransitions: STAGE_TRANSITIONS
    };

    logger.info('Pipeline details retrieved', {
      merchantId,
      currentStage: pipeline.currentStage,
      userId: user.id
    });

    res.json({
      success: true,
      data: response
    });
  })
);

/**
 * @route   PATCH /api/pipeline/:merchantId/stage
 * @desc    Update merchant pipeline stage
 * @access  Private (Admin: any merchant, Rep: assigned merchants only)
 */
router.patch('/:merchantId/stage',
  authenticate,
  adminOrRep,
  validate({
    params: pipelineSchemas.params,
    body: pipelineSchemas.stageUpdate
  }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { merchantId } = req.params;
    const { stage, notes, nextActionDescription, nextActionDate } = req.body;
    const user = req.user!;

    // Check access permissions
    const hasAccess = await canAccessMerchantPipeline(user.id, user.role, merchantId);
    if (!hasAccess) {
      throw new AppError('Access denied to this merchant pipeline', 403);
    }

    // Get current pipeline and merchant details
    const currentPipeline = await prisma.pipeline.findUnique({
      where: { merchantId },
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            assignedRepId: true,
            assignedRep: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    if (!currentPipeline) {
      throw new AppError('Pipeline not found', 404);
    }

    const currentStage = currentPipeline.currentStage;
    const newStage = stage as PipelineStage;

    // Validate stage transition
    if (currentStage === newStage) {
      throw new AppError('Merchant is already in this stage', 400);
    }

    const allowedTransitions = STAGE_TRANSITIONS[currentStage] || [];
    if (!allowedTransitions.includes(newStage)) {
      throw new AppError(
        `Invalid stage transition from ${currentStage} to ${newStage}. Allowed: ${allowedTransitions.join(', ')}`, 
        400
      );
    }

    // Determine next action if not provided
    const finalNextActionDescription = nextActionDescription || DEFAULT_NEXT_ACTIONS[newStage];
    const finalNextActionDate = nextActionDate || (
      newStage === 'REJECTED' ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    );

    // Execute stage update and related actions in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update pipeline
      const updatedPipeline = await tx.pipeline.update({
        where: { merchantId },
        data: {
          currentStage: newStage,
          nextActionDescription: finalNextActionDescription,
          nextActionDate: finalNextActionDate,
          lastUpdatedById: user.id,
          updatedAt: new Date()
        }
      });

      // Create stage history entry
      await tx.pipelineStageHistory.create({
        data: {
          pipelineId: updatedPipeline.id,
          stage: newStage,
          previousStage: currentStage,
          changedById: user.id,
          notes: notes || `Stage changed from ${currentStage} to ${newStage}`
        }
      });

      // Handle Won stage - create onboarding record and payout
      if (newStage === 'WON' && currentPipeline.merchant.assignedRepId) {
        // Create onboarding record if it doesn't exist
        const existingOnboarding = await tx.onboarding.findUnique({
          where: { merchantId }
        });

        if (!existingOnboarding) {
          await tx.onboarding.create({
            data: {
              merchantId,
              status: 'IN_PROGRESS',
              surveyFilled: false,
              offersAdded: false,
              branchesCovered: false,
              assetsComplete: false,
              completionPercentage: 0.0,
              createdById: user.id
            }
          });
        }

        // Create Won payout (outside transaction to avoid blocking)
        setImmediate(() => {
          createWonPayout(merchantId, currentPipeline.merchant.assignedRepId!, user.id)
            .catch(error => {
              logger.error('Failed to create Won payout asynchronously', {
                error: error instanceof Error ? error.message : 'Unknown error',
                merchantId,
                repId: currentPipeline.merchant.assignedRepId!
              });
            });
        });
      }

      return updatedPipeline;
    });

    // Log stage change
    logAudit('PIPELINE_STAGE_CHANGED', 'pipeline', result.id, user.id, {
      merchantId,
      previousStage: currentStage,
      newStage,
      merchantName: currentPipeline.merchant.name
    });

    logger.info('Pipeline stage updated', {
      merchantId,
      previousStage: currentStage,
      newStage,
      updatedBy: user.id,
      merchantName: currentPipeline.merchant.name
    });

    // Fetch updated pipeline for response
    const updatedPipelineWithDetails = await prisma.pipeline.findUnique({
      where: { merchantId },
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
        stageHistory: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            changedBy: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedPipelineWithDetails,
      message: `Merchant moved to ${newStage} stage successfully`
    });
  })
);

/**
 * @route   PATCH /api/pipeline/:merchantId/next-action
 * @desc    Update next action for merchant pipeline
 * @access  Private (Admin: any merchant, Rep: assigned merchants only)
 */
router.patch('/:merchantId/next-action',
  authenticate,
  adminOrRep,
  validate({
    params: pipelineSchemas.params,
    body: pipelineSchemas.nextActionUpdate
  }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { merchantId } = req.params;
    const { nextActionDescription, nextActionDate } = req.body;
    const user = req.user!;

    // Check access permissions
    const hasAccess = await canAccessMerchantPipeline(user.id, user.role, merchantId);
    if (!hasAccess) {
      throw new AppError('Access denied to this merchant pipeline', 403);
    }

    const updatedPipeline = await prisma.pipeline.update({
      where: { merchantId },
      data: {
        nextActionDescription,
        nextActionDate: nextActionDate || null,
        lastUpdatedById: user.id,
        updatedAt: new Date()
      },
      include: {
        merchant: {
          select: { id: true, name: true, category: true }
        },
        lastUpdatedBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Log next action update
    logAudit('PIPELINE_NEXT_ACTION_UPDATED', 'pipeline', updatedPipeline.id, user.id, {
      merchantId,
      nextActionDescription,
      nextActionDate
    });

    logger.info('Pipeline next action updated', {
      merchantId,
      nextActionDescription,
      nextActionDate,
      updatedBy: user.id
    });

    res.json({
      success: true,
      data: updatedPipeline,
      message: 'Next action updated successfully'
    });
  })
);

/**
 * @route   GET /api/pipeline/overdue
 * @desc    Get merchants with overdue actions
 * @access  Private
 */
router.get('/overdue',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!;

    // Build filter based on user role
    const where: any = {
      nextActionDate: {
        lt: new Date()
      },
      currentStage: {
        not: 'REJECTED'
      },
      merchant: {
        deletedAt: null
      }
    };

    if (user.role === 'REP') {
      where.merchant.assignedRepId = user.id;
    }

    const overduePipelines = await prisma.pipeline.findMany({
      where,
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            category: true,
            contactPersonName: true,
            contactPhone: true,
            assignedRep: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      },
      orderBy: {
        nextActionDate: 'asc'
      }
    });

    const overdueData = overduePipelines.map(pipeline => ({
      merchantId: pipeline.merchantId,
      merchant: pipeline.merchant,
      currentStage: pipeline.currentStage,
      nextActionDescription: pipeline.nextActionDescription,
      nextActionDate: pipeline.nextActionDate,
      daysPastDue: pipeline.nextActionDate 
        ? Math.ceil((Date.now() - pipeline.nextActionDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0
    }));

    logger.info('Overdue actions retrieved', {
      userId: user.id,
      overdueCount: overdueData.length
    });

    res.json({
      success: true,
      data: overdueData,
      meta: {
        total: overdueData.length
      }
    });
  })
);

/**
 * @route   GET /api/pipeline/stats/conversion
 * @desc    Get pipeline conversion statistics
 * @access  Private
 */
router.get('/stats/conversion',
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

    // Get stage distribution
    const stageStats = await prisma.pipeline.groupBy({
      by: ['currentStage'],
      where,
      _count: {
        currentStage: true
      }
    });

    // Get Won merchants count
    const wonCount = await prisma.pipeline.count({
      where: {
        ...where,
        currentStage: 'WON'
      }
    });

    // Get Live merchants count
    const liveCount = await prisma.onboarding.count({
      where: {
        status: 'LIVE',
        merchant: user.role === 'REP' 
          ? { assignedRepId: user.id, deletedAt: null }
          : { deletedAt: null }
      }
    });

    // Calculate conversion rates
    const totalMerchants = stageStats.reduce((sum, stage) => sum + stage._count.currentStage, 0);
    const rejectedCount = stageStats.find(s => s.currentStage === 'REJECTED')?._count.currentStage || 0;
    const activeMerchants = totalMerchants - rejectedCount;

    const stats = {
      totalMerchants,
      activeMerchants,
      wonCount,
      liveCount,
      rejectedCount,
      conversionRates: {
        wonRate: activeMerchants > 0 ? Math.round((wonCount / activeMerchants) * 100) : 0,
        liveRate: wonCount > 0 ? Math.round((liveCount / wonCount) * 100) : 0,
        overallRate: totalMerchants > 0 ? Math.round((liveCount / totalMerchants) * 100) : 0
      },
      stageDistribution: stageStats.reduce((acc, stage) => {
        acc[stage.currentStage] = {
          count: stage._count.currentStage,
          percentage: totalMerchants > 0 ? Math.round((stage._count.currentStage / totalMerchants) * 100) : 0
        };
        return acc;
      }, {} as Record<string, { count: number; percentage: number }>)
    };

    logger.info('Pipeline conversion stats retrieved', {
      userId: user.id,
      totalMerchants,
      wonCount,
      liveCount
    });

    res.json({
      success: true,
      data: stats
    });
  })
);

// Export the payout creation functions for use in onboarding routes
export { createWonPayout, createLivePayout };

export default router;