import { Request, Response } from 'express';
import { logger } from '../utils/logger';

/**
 * 404 Not Found handler middleware
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  // Log the 404 for monitoring
  logger.warn('404 Not Found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: {
      auth: '/api/auth',
      merchants: '/api/merchants',
      pipeline: '/api/pipeline',
      onboarding: '/api/onboarding',
      activities: '/api/activities',
      payouts: '/api/payouts',
      dashboard: '/api/dashboard',
      upload: '/api/upload',
      export: '/api/export',
      health: '/health'
    }
  });
};