import Joi from 'joi';
import { logger } from './logger';

// Environment validation schema
const envSchema = Joi.object({
  // Database
  DATABASE_URL: Joi.string().required(),
  
  // JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  
  // Server
  PORT: Joi.number().port().default(3001),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  
  // File upload
  CLOUDINARY_CLOUD_NAME: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  CLOUDINARY_API_KEY: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  CLOUDINARY_API_SECRET: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  MAX_FILE_SIZE: Joi.number().default(5242880), // 5MB
  
  // Email (at least one method required in production)
  SENDGRID_API_KEY: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.optional(),
    otherwise: Joi.optional()
  }),
  FROM_EMAIL: Joi.string().email().default('noreply@teen-crm.com'),
  FROM_NAME: Joi.string().default('Teen CRM'),
  
  // SMTP (alternative to SendGrid)
  SMTP_HOST: Joi.string().when('SENDGRID_API_KEY', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.when('NODE_ENV', {
      is: 'production',
      then: Joi.optional(),
      otherwise: Joi.optional()
    })
  }),
  SMTP_PORT: Joi.number().port().default(587),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_USER: Joi.string().when('SMTP_HOST', {
    is: Joi.exist(),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  SMTP_PASS: Joi.string().when('SMTP_HOST', {
    is: Joi.exist(),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  
  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  LOG_FILE: Joi.string().default('logs/app.log'),
  
  // Security
  BCRYPT_ROUNDS: Joi.number().min(10).max(15).default(12),
  SESSION_SECRET: Joi.string().min(32).when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  
  // Business configuration
  WON_BONUS_AMOUNT: Joi.number().default(9),
  LIVE_BONUS_AMOUNT: Joi.number().default(7),
  DEFAULT_CURRENCY: Joi.string().default('JOD'),
  
  // Pagination
  DEFAULT_PAGE_SIZE: Joi.number().min(1).max(100).default(20),
  MAX_PAGE_SIZE: Joi.number().min(10).max(1000).default(100),
  
  // Optional services
  REDIS_URL: Joi.string().optional(),
  SENTRY_DSN: Joi.string().optional(),
  NEW_RELIC_LICENSE_KEY: Joi.string().optional(),
  GOOGLE_MAPS_API_KEY: Joi.string().optional(),
  WHATSAPP_API_URL: Joi.string().optional(),
  WHATSAPP_ACCESS_TOKEN: Joi.string().optional(),
  
  // Development
  SWAGGER_ENABLED: Joi.boolean().default(true),
  DEBUG_MODE: Joi.boolean().default(false)
}).unknown(); // Allow unknown environment variables

export function validateEnv(): void {
  const { error, value: envVars } = envSchema.validate(process.env);

  if (error) {
    logger.error('Environment validation failed:', {
      details: error.details.map(detail => ({
        message: detail.message,
        path: detail.path,
        type: detail.type
      }))
    });
    
    throw new Error(`Environment validation failed: ${error.message}`);
  }

  // Log successful validation
  logger.info('Environment validation passed', {
    nodeEnv: envVars.NODE_ENV,
    port: envVars.PORT,
    logLevel: envVars.LOG_LEVEL,
    corsOrigin: envVars.CORS_ORIGIN
  });

  // Warn about missing optional services in production
  if (envVars.NODE_ENV === 'production') {
    const warnings = [];
    
    if (!envVars.SENDGRID_API_KEY && !envVars.SMTP_HOST) {
      warnings.push('No email service configured - email functionality will be limited');
    }
    
    if (!envVars.CLOUDINARY_CLOUD_NAME) {
      warnings.push('No Cloudinary configured - file uploads will use local storage');
    }
    
    if (!envVars.REDIS_URL) {
      warnings.push('No Redis configured - caching will be limited');
    }
    
    if (warnings.length > 0) {
      logger.warn('Production configuration warnings:', { warnings });
    }
  }
}

// Type-safe environment variables
export interface EnvVars {
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  CORS_ORIGIN: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
  MAX_FILE_SIZE: number;
  SENDGRID_API_KEY?: string;
  FROM_EMAIL: string;
  FROM_NAME: string;
  SMTP_HOST?: string;
  SMTP_PORT: number;
  SMTP_SECURE: boolean;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  LOG_LEVEL: string;
  BCRYPT_ROUNDS: number;
  WON_BONUS_AMOUNT: number;
  LIVE_BONUS_AMOUNT: number;
  DEFAULT_CURRENCY: string;
  DEFAULT_PAGE_SIZE: number;
  MAX_PAGE_SIZE: number;
}

// Get typed environment variables
export function getEnvVars(): EnvVars {
  const { value } = envSchema.validate(process.env);
  return value as EnvVars;
}