import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ValidationError } from '../types';

/**
 * Validation middleware factory
 */
export const validate = (schema: {
  body?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: ValidationError[] = [];

    // Validate request body
    if (schema.body) {
      const { error } = schema.body.validate(req.body);
      if (error) {
        errors.push(...formatJoiErrors(error, 'body'));
      }
    }

    // Validate request params
    if (schema.params) {
      const { error } = schema.params.validate(req.params);
      if (error) {
        errors.push(...formatJoiErrors(error, 'params'));
      }
    }

    // Validate request query
    if (schema.query) {
      const { error } = schema.query.validate(req.query);
      if (error) {
        errors.push(...formatJoiErrors(error, 'query'));
      }
    }

    // If validation errors, return them
    if (errors.length > 0) {
      logger.warn('Validation failed', {
        method: req.method,
        url: req.originalUrl,
        errors,
        body: req.body,
        params: req.params,
        query: req.query
      });

      res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors
      });
      return;
    }

    next();
  };
};

/**
 * Format Joi validation errors
 */
function formatJoiErrors(error: Joi.ValidationError, source: string): ValidationError[] {
  return error.details.map(detail => ({
    field: `${source}.${detail.path.join('.')}`,
    message: detail.message,
    value: detail.context?.value
  }));
}

// Common validation schemas
export const commonSchemas = {
  // UUID validation
  uuid: Joi.string().uuid({ version: 'uuidv4' }),
  
  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().max(100).optional(),
    sortBy: Joi.string().max(50).optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  // Email validation
  email: Joi.string().email().max(255),
  
  // Phone validation (basic international format)
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).max(20),
  
  // URL validation
  url: Joi.string().uri().max(500),
  
  // Date validation
  date: Joi.date().iso(),
  
  // Currency amount
  currency: Joi.number().positive().precision(2),
  
  // Text fields
  shortText: Joi.string().max(255),
  mediumText: Joi.string().max(1000),
  longText: Joi.string().max(5000)
};

// Auth validation schemas
export const authSchemas = {
  login: {
    body: Joi.object({
      email: commonSchemas.email.required(),
      password: Joi.string().min(6).max(100).required()
    })
  },

  register: {
    body: Joi.object({
      email: commonSchemas.email.required(),
      password: Joi.string().min(8).max(100).required()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .message('Password must contain at least one lowercase, one uppercase letter and one number'),
      name: Joi.string().min(2).max(100).required(),
      phone: commonSchemas.phone.optional(),
      role: Joi.string().valid('ADMIN', 'REP', 'READ_ONLY').default('REP')
    })
  },

  refreshToken: {
    body: Joi.object({
      refreshToken: Joi.string().required()
    })
  },

  forgotPassword: {
    body: Joi.object({
      email: commonSchemas.email.required()
    })
  },

  resetPassword: {
    body: Joi.object({
      token: Joi.string().required(),
      newPassword: Joi.string().min(8).max(100).required()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .message('Password must contain at least one lowercase, one uppercase letter and one number')
    })
  }
};

// Merchant validation schemas
export const merchantSchemas = {
  create: {
    body: Joi.object({
      merchantName: Joi.string().min(1).max(255).required(),
      legalName: commonSchemas.shortText.optional(),
      brandAliases: Joi.array().items(Joi.string().max(100)).optional(),
      category: Joi.string().valid(
        'FOOD', 'DESSERTS_COFFEE', 'BEAUTY', 'CLOTHING', 'SERVICES',
        'SPORTS', 'ENTERTAINMENT', 'TOURISM', 'HEALTH', 'ELECTRONICS',
        'EDUCATION', 'APPLICATION'
      ).required(),
      genre: commonSchemas.shortText.optional(),
      pricingTier: Joi.string().valid('BUDGET', 'MID', 'PREMIUM', 'LUXURY').default('MID'),
      studentFit: Joi.string().valid('STRONG', 'MEDIUM', 'WEAK').default('MEDIUM'),
      city: Joi.string().min(1).max(100).required(),
      neighborhood: commonSchemas.shortText.optional(),
      exactAddress: commonSchemas.mediumText.optional(),
      googleMapsLink: commonSchemas.url.optional(),
      lat: Joi.number().min(-90).max(90).optional(),
      lng: Joi.number().min(-180).max(180).optional(),
      numBranches: Joi.number().integer().min(1).default(1),
      deliveryAvailable: Joi.boolean().default(false),
      dineIn: Joi.boolean().default(false),
      takeAway: Joi.boolean().default(false),
      openingHours: commonSchemas.shortText.optional(),
      busyHours: commonSchemas.shortText.optional(),
      ownerPartner: commonSchemas.shortText.optional(),
      website: commonSchemas.url.optional(),
      instagram: Joi.string().max(100).optional(),
      tiktok: Joi.string().max(100).optional(),
      phoneMain: commonSchemas.phone.optional(),
      whatsappBusiness: commonSchemas.phone.optional(),
      emailMain: commonSchemas.email.optional(),
      registerNumber: commonSchemas.shortText.optional(),
      taxNumber: commonSchemas.shortText.optional(),
      kycStatus: Joi.string().valid('NOT_NEEDED', 'PENDING', 'VERIFIED', 'REJECTED').default('NOT_NEEDED'),
      riskLevel: Joi.string().valid('LOW', 'MEDIUM', 'HIGH').default('LOW'),
      contractRequired: Joi.boolean().default(false),
      contractVersion: commonSchemas.shortText.optional()
    })
  },

  update: {
    body: Joi.object({
      merchantName: Joi.string().min(1).max(255).optional(),
      legalName: commonSchemas.shortText.optional(),
      brandAliases: Joi.array().items(Joi.string().max(100)).optional(),
      category: Joi.string().valid(
        'FOOD', 'DESSERTS_COFFEE', 'BEAUTY', 'CLOTHING', 'SERVICES',
        'SPORTS', 'ENTERTAINMENT', 'TOURISM', 'HEALTH', 'ELECTRONICS',
        'EDUCATION', 'APPLICATION'
      ).optional(),
      genre: commonSchemas.shortText.optional(),
      pricingTier: Joi.string().valid('BUDGET', 'MID', 'PREMIUM', 'LUXURY').optional(),
      studentFit: Joi.string().valid('STRONG', 'MEDIUM', 'WEAK').optional(),
      city: Joi.string().min(1).max(100).optional(),
      neighborhood: commonSchemas.shortText.optional(),
      exactAddress: commonSchemas.mediumText.optional(),
      googleMapsLink: commonSchemas.url.optional(),
      lat: Joi.number().min(-90).max(90).optional(),
      lng: Joi.number().min(-180).max(180).optional(),
      numBranches: Joi.number().integer().min(1).optional(),
      deliveryAvailable: Joi.boolean().optional(),
      dineIn: Joi.boolean().optional(),
      takeAway: Joi.boolean().optional(),
      openingHours: commonSchemas.shortText.optional(),
      busyHours: commonSchemas.shortText.optional(),
      ownerPartner: commonSchemas.shortText.optional(),
      website: commonSchemas.url.optional(),
      instagram: Joi.string().max(100).optional(),
      tiktok: Joi.string().max(100).optional(),
      phoneMain: commonSchemas.phone.optional(),
      whatsappBusiness: commonSchemas.phone.optional(),
      emailMain: commonSchemas.email.optional(),
      registerNumber: commonSchemas.shortText.optional(),
      taxNumber: commonSchemas.shortText.optional(),
      kycStatus: Joi.string().valid('NOT_NEEDED', 'PENDING', 'VERIFIED', 'REJECTED').optional(),
      riskLevel: Joi.string().valid('LOW', 'MEDIUM', 'HIGH').optional(),
      contractRequired: Joi.boolean().optional(),
      contractVersion: commonSchemas.shortText.optional()
    }).min(1) // At least one field must be provided for update
  },

  params: {
    params: Joi.object({
      id: commonSchemas.uuid.required()
    })
  },

  query: {
    query: commonSchemas.pagination.keys({
      category: Joi.string().optional(),
      stage: Joi.string().optional(),
      city: Joi.string().optional(),
      studentFit: Joi.string().optional(),
      pricingTier: Joi.string().optional(),
      rep: commonSchemas.uuid.optional(),
      isLive: Joi.boolean().optional()
    })
  }
};

// Pipeline validation schemas
export const pipelineSchemas = {
  transition: {
    params: Joi.object({
      merchantId: commonSchemas.uuid.required()
    }),
    body: Joi.object({
      newStage: Joi.string().valid(
        'PENDING_FIRST_VISIT', 'FOLLOW_UP_NEEDED', 'CONTRACT_SENT', 'WON', 'REJECTED'
      ).required(),
      lostReason: Joi.when('newStage', {
        is: 'REJECTED',
        then: Joi.string().min(1).max(500).required(),
        otherwise: Joi.optional()
      }),
      nextAction: commonSchemas.mediumText.optional(),
      nextActionDue: commonSchemas.date.optional()
    })
  },

  update: {
    params: Joi.object({
      merchantId: commonSchemas.uuid.required()
    }),
    body: Joi.object({
      nextAction: commonSchemas.mediumText.optional(),
      nextActionDue: commonSchemas.date.optional(),
      responsibleRepId: commonSchemas.uuid.optional()
    }).min(1)
  }
};

// Activity validation schemas
export const activitySchemas = {
  create: {
    body: Joi.object({
      merchantId: commonSchemas.uuid.required(),
      type: Joi.string().valid('CALL', 'MEETING', 'WHATSAPP', 'EMAIL', 'TRAINING', 'OTHER').required(),
      summary: Joi.string().min(1).max(2000).required(),
      occurredAt: commonSchemas.date.default(new Date()),
      attachmentUrl: commonSchemas.url.optional()
    })
  },

  update: {
    params: Joi.object({
      id: commonSchemas.uuid.required()
    }),
    body: Joi.object({
      type: Joi.string().valid('CALL', 'MEETING', 'WHATSAPP', 'EMAIL', 'TRAINING', 'OTHER').optional(),
      summary: Joi.string().min(1).max(2000).optional(),
      occurredAt: commonSchemas.date.optional(),
      attachmentUrl: commonSchemas.url.optional()
    }).min(1)
  },

  query: {
    query: commonSchemas.pagination.keys({
      merchantId: commonSchemas.uuid.optional(),
      type: Joi.string().optional(),
      repId: commonSchemas.uuid.optional(),
      fromDate: commonSchemas.date.optional(),
      toDate: commonSchemas.date.optional()
    })
  }
};

// Onboarding validation schemas
export const onboardingSchemas = {
  update: {
    params: Joi.object({
      merchantId: commonSchemas.uuid.required()
    }),
    body: Joi.object({
      contactName: commonSchemas.shortText.optional(),
      contactNumber: commonSchemas.phone.optional(),
      locationLabel: commonSchemas.shortText.optional(),
      surveyFilled: Joi.boolean().optional(),
      teenStaffInstalled: Joi.boolean().optional(),
      credentialsSent: Joi.boolean().optional(),
      trainingDone: Joi.boolean().optional(),
      offersAdded: Joi.boolean().optional(),
      offersCount: Joi.number().integer().min(0).optional(),
      branchesCovered: Joi.boolean().optional(),
      assetsComplete: Joi.boolean().optional(),
      readyForQa: Joi.boolean().optional(),
      qaNotes: commonSchemas.mediumText.optional()
    }).min(1)
  }
};

// Contact validation schemas
export const contactSchemas = {
  create: {
    body: Joi.object({
      merchantId: commonSchemas.uuid.required(),
      name: Joi.string().min(1).max(100).required(),
      role: Joi.string().valid('OWNER', 'MANAGER', 'MARKETING', 'FINANCE', 'OTHER').default('OWNER'),
      phone: commonSchemas.phone.optional(),
      whatsapp: commonSchemas.phone.optional(),
      email: commonSchemas.email.optional(),
      preferredChannel: Joi.string().valid('WHATSAPP', 'CALL', 'EMAIL', 'SMS').default('WHATSAPP'),
      notes: commonSchemas.mediumText.optional()
    })
  },

  update: {
    params: Joi.object({
      id: commonSchemas.uuid.required()
    }),
    body: Joi.object({
      name: Joi.string().min(1).max(100).optional(),
      role: Joi.string().valid('OWNER', 'MANAGER', 'MARKETING', 'FINANCE', 'OTHER').optional(),
      phone: commonSchemas.phone.optional(),
      whatsapp: commonSchemas.phone.optional(),
      email: commonSchemas.email.optional(),
      preferredChannel: Joi.string().valid('WHATSAPP', 'CALL', 'EMAIL', 'SMS').optional(),
      notes: commonSchemas.mediumText.optional()
    }).min(1)
  }
};

// Asset validation schemas
export const assetSchemas = {
  update: {
    params: Joi.object({
      merchantId: commonSchemas.uuid.required()
    }),
    body: Joi.object({
      logoUrl: commonSchemas.url.optional(),
      bannerUrl: commonSchemas.url.optional(),
      descriptionText: commonSchemas.longText.optional(),
      appCategoryTags: Joi.array().items(Joi.string().max(50)).optional(),
      mapAddress: commonSchemas.mediumText.optional(),
      mapLink: commonSchemas.url.optional()
    }).min(1)
  }
};

// Offer validation schemas
export const offerSchemas = {
  create: {
    body: Joi.object({
      merchantId: commonSchemas.uuid.required(),
      title: Joi.string().min(1).max(200).required(),
      offerType: Joi.string().valid('TYPE1', 'TYPE2', 'TYPE3').required(),
      status: Joi.string().valid('DRAFT', 'LIVE', 'PAUSED', 'EXPIRED').default('DRAFT')
    })
  },

  update: {
    params: Joi.object({
      id: commonSchemas.uuid.required()
    }),
    body: Joi.object({
      title: Joi.string().min(1).max(200).optional(),
      offerType: Joi.string().valid('TYPE1', 'TYPE2', 'TYPE3').optional(),
      status: Joi.string().valid('DRAFT', 'LIVE', 'PAUSED', 'EXPIRED').optional()
    }).min(1)
  }
};

// Dashboard validation schemas
export const dashboardSchemas = {
  query: {
    query: Joi.object({
      period: Joi.string().valid('week', 'month', 'quarter', 'year').default('month'),
      repId: commonSchemas.uuid.optional(),
      category: Joi.string().optional(),
      fromDate: commonSchemas.date.optional(),
      toDate: commonSchemas.date.optional()
    })
  }
};

// Export validation schemas
export const exportSchemas = {
  query: {
    query: Joi.object({
      type: Joi.string().valid('merchants', 'pipeline', 'activities', 'payouts', 'onboarding').required(),
      format: Joi.string().valid('csv', 'json').default('csv'),
      fromDate: commonSchemas.date.optional(),
      toDate: commonSchemas.date.optional(),
      repId: commonSchemas.uuid.optional(),
      stage: Joi.string().optional(),
      category: Joi.string().optional()
    })
  }
};

// File upload validation schemas
export const uploadSchemas = {
  params: {
    params: Joi.object({
      merchantId: commonSchemas.uuid.required(),
      type: Joi.string().valid('logo', 'banner', 'document').required()
    })
  }
};