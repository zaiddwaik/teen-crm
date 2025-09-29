import winston from 'winston';
import path from 'path';

// Create logs directory if it doesn't exist
const logDir = path.join(process.cwd(), 'logs');

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'teen-crm-backend' },
  transports: [
    // Write all logs with level `error` and below to `error.log`
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Write all logs with level `info` and below to `combined.log`
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      tailable: true
    }),
    
    // Write all logs with level `info` and below to console if not in production
    ...(process.env.NODE_ENV !== 'production' ? [
      new winston.transports.Console({
        format: consoleFormat
      })
    ] : [])
  ],
  
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'exceptions.log') 
    })
  ],
  
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'rejections.log') 
    })
  ]
});

// Create audit logger for business events
export const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'audit.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 50, // Keep more audit logs
      tailable: true
    })
  ]
});

// Create performance logger for monitoring
export const performanceLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'performance.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    })
  ]
});

// Utility functions for structured logging
export const logError = (error: Error, context: string = '', metadata: any = {}) => {
  logger.error('Application Error', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    context,
    metadata,
    timestamp: new Date().toISOString()
  });
};

export const logAudit = (action: string, entityType: string, entityId: string, userId?: string, changes?: any) => {
  auditLogger.info('Audit Event', {
    action,
    entityType,
    entityId,
    userId,
    changes,
    timestamp: new Date().toISOString()
  });
};

export const logPerformance = (operation: string, duration: number, metadata: any = {}) => {
  performanceLogger.info('Performance Metric', {
    operation,
    duration,
    metadata,
    timestamp: new Date().toISOString()
  });
};

// Database query logger
export const logQuery = (query: string, duration: number, params?: any) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Database Query', {
      query,
      duration,
      params,
      timestamp: new Date().toISOString()
    });
  }
};

export default logger;