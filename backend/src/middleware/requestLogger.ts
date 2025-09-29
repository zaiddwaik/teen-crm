import { Request, Response, NextFunction } from 'express';
import { logger, performanceLogger } from '../utils/logger';
import { AuthenticatedRequest } from '../types';

/**
 * Request logging middleware
 */
export const requestLogger = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();
  
  // Log incoming request
  logger.info('Incoming Request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    userId: req.user?.id
  });

  // Override res.end to log response
  const originalEnd = res.end;
  
  res.end = function(chunk?: any, encoding?: any, cb?: any) {
    const duration = Date.now() - startTime;
    
    // Log response
    logger.info('Request Completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
      userId: req.user?.id
    });

    // Log performance metrics
    performanceLogger.info('Request Performance', {
      method: req.method,
      route: req.route?.path || req.originalUrl,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    // Call original end method
    originalEnd.call(this, chunk, encoding, cb);
  };

  next();
};