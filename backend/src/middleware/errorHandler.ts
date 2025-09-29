import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { logger, logError } from '../utils/logger';
import { AppError } from '../types';

/**
 * Global error handler middleware
 */
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error
  logError(error, `${req.method} ${req.path}`, {
    body: req.body,
    params: req.params,
    query: req.query,
    user: (req as any).user?.id
  });

  // Set default values
  let statusCode = 500;
  let message = 'Internal server error';
  let details: any = undefined;

  // Handle specific error types
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    ({ statusCode, message, details } = handlePrismaError(error));
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Database validation error';
    details = process.env.NODE_ENV === 'development' ? error.message : undefined;
  } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = 500;
    message = 'Database connection error';
    details = process.env.NODE_ENV === 'development' ? error.message : undefined;
  } else if ((error as AppError).statusCode) {
    // Custom application errors
    statusCode = (error as AppError).statusCode!;
    message = error.message;
    details = (error as AppError).details;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    details = error.message;
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (error.name === 'MulterError') {
    ({ statusCode, message, details } = handleMulterError(error as any));
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Something went wrong';
    details = undefined;
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack
    })
  });
};

/**
 * Handle Prisma database errors
 */
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): {
  statusCode: number;
  message: string;
  details?: any;
} {
  switch (error.code) {
    case 'P2000':
      return {
        statusCode: 400,
        message: 'Input value too long for field',
        details: error.meta
      };

    case 'P2001':
      return {
        statusCode: 404,
        message: 'Record not found',
        details: error.meta
      };

    case 'P2002':
      return {
        statusCode: 409,
        message: 'Unique constraint violation',
        details: {
          field: error.meta?.target,
          message: 'A record with this value already exists'
        }
      };

    case 'P2003':
      return {
        statusCode: 400,
        message: 'Foreign key constraint violation',
        details: error.meta
      };

    case 'P2004':
      return {
        statusCode: 400,
        message: 'Constraint violation on database',
        details: error.meta
      };

    case 'P2005':
      return {
        statusCode: 400,
        message: 'Invalid value stored in database',
        details: error.meta
      };

    case 'P2006':
      return {
        statusCode: 400,
        message: 'Invalid value provided for field',
        details: error.meta
      };

    case 'P2007':
      return {
        statusCode: 400,
        message: 'Data validation error',
        details: error.meta
      };

    case 'P2008':
      return {
        statusCode: 400,
        message: 'Failed to parse query',
        details: error.meta
      };

    case 'P2009':
      return {
        statusCode: 400,
        message: 'Failed to validate query',
        details: error.meta
      };

    case 'P2010':
      return {
        statusCode: 500,
        message: 'Raw query failed',
        details: process.env.NODE_ENV === 'development' ? error.meta : undefined
      };

    case 'P2011':
      return {
        statusCode: 400,
        message: 'Null constraint violation',
        details: error.meta
      };

    case 'P2012':
      return {
        statusCode: 400,
        message: 'Missing required value',
        details: error.meta
      };

    case 'P2013':
      return {
        statusCode: 400,
        message: 'Missing required argument',
        details: error.meta
      };

    case 'P2014':
      return {
        statusCode: 400,
        message: 'Required relation missing',
        details: error.meta
      };

    case 'P2015':
      return {
        statusCode: 404,
        message: 'Related record not found',
        details: error.meta
      };

    case 'P2016':
      return {
        statusCode: 400,
        message: 'Query interpretation error',
        details: error.meta
      };

    case 'P2017':
      return {
        statusCode: 400,
        message: 'Records for relation not connected',
        details: error.meta
      };

    case 'P2018':
      return {
        statusCode: 404,
        message: 'Required connected records not found',
        details: error.meta
      };

    case 'P2019':
      return {
        statusCode: 400,
        message: 'Input error',
        details: error.meta
      };

    case 'P2020':
      return {
        statusCode: 400,
        message: 'Value out of range',
        details: error.meta
      };

    case 'P2021':
      return {
        statusCode: 404,
        message: 'Table does not exist',
        details: error.meta
      };

    case 'P2022':
      return {
        statusCode: 404,
        message: 'Column does not exist',
        details: error.meta
      };

    case 'P2025':
      return {
        statusCode: 400,
        message: 'Dependent records exist',
        details: error.meta
      };

    default:
      return {
        statusCode: 500,
        message: 'Database error',
        details: process.env.NODE_ENV === 'development' ? {
          code: error.code,
          meta: error.meta
        } : undefined
      };
  }
}

/**
 * Handle Multer file upload errors
 */
function handleMulterError(error: any): {
  statusCode: number;
  message: string;
  details?: any;
} {
  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      return {
        statusCode: 413,
        message: 'File too large',
        details: {
          maxSize: error.limit,
          message: 'The uploaded file exceeds the maximum allowed size'
        }
      };

    case 'LIMIT_FILE_COUNT':
      return {
        statusCode: 400,
        message: 'Too many files',
        details: {
          maxCount: error.limit,
          message: 'Too many files uploaded'
        }
      };

    case 'LIMIT_FIELD_KEY':
      return {
        statusCode: 400,
        message: 'Field name too long',
        details: error.message
      };

    case 'LIMIT_FIELD_VALUE':
      return {
        statusCode: 400,
        message: 'Field value too long',
        details: error.message
      };

    case 'LIMIT_FIELD_COUNT':
      return {
        statusCode: 400,
        message: 'Too many fields',
        details: error.message
      };

    case 'LIMIT_UNEXPECTED_FILE':
      return {
        statusCode: 400,
        message: 'Unexpected file field',
        details: error.message
      };

    default:
      return {
        statusCode: 400,
        message: 'File upload error',
        details: error.message
      };
  }
}

/**
 * Create custom application error
 */
export class AppError extends Error implements AppError {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    
    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
    
    // Set the prototype explicitly
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Async error wrapper
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Not found error creator
 */
export const createNotFoundError = (resource: string, id?: string) => {
  const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
  return new AppError(message, 404);
};

/**
 * Validation error creator
 */
export const createValidationError = (message: string, details?: any) => {
  return new AppError(message, 400, true, details);
};

/**
 * Authorization error creator
 */
export const createAuthError = (message: string = 'Access denied') => {
  return new AppError(message, 403);
};

/**
 * Conflict error creator
 */
export const createConflictError = (message: string, details?: any) => {
  return new AppError(message, 409, true, details);
};