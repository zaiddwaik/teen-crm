import jwt from 'jsonwebtoken';
import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, TokenPayload } from '../types';
import { logger, logAudit } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * JWT Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access denied. Invalid token format.'
      });
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
      
      // Fetch user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          lastLoginAt: true
        }
      });

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Access denied. User not found.'
        });
        return;
      }

      if (user.status !== 'ACTIVE') {
        res.status(401).json({
          success: false,
          error: 'Access denied. Account is inactive.'
        });
        return;
      }

      // Attach user to request
      req.user = user;

      // Update last login timestamp
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      next();
    } catch (jwtError) {
      logger.warn('JWT verification failed', {
        error: jwtError instanceof Error ? jwtError.message : 'Unknown JWT error',
        token: token.substring(0, 20) + '...' // Log partial token for debugging
      });
      
      res.status(401).json({
        success: false,
        error: 'Access denied. Invalid or expired token.'
      });
      return;
    }
  } catch (error) {
    logger.error('Authentication middleware error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    res.status(500).json({
      success: false,
      error: 'Internal server error during authentication.'
    });
  }
};

/**
 * Admin-only access middleware
 */
export const adminOnly = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required.'
    });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    logAudit('ACCESS_DENIED', 'admin_endpoint', req.path, req.user.id);
    
    res.status(403).json({
      success: false,
      error: 'Access denied. Admin privileges required.'
    });
    return;
  }

  next();
};

/**
 * Admin or Rep access middleware
 */
export const adminOrRep = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required.'
    });
    return;
  }

  if (!['ADMIN', 'REP'].includes(req.user.role)) {
    logAudit('ACCESS_DENIED', 'rep_endpoint', req.path, req.user.id);
    
    res.status(403).json({
      success: false,
      error: 'Access denied. Admin or Rep privileges required.'
    });
    return;
  }

  next();
};

/**
 * Merchant access control middleware
 * Ensures reps can only access their assigned merchants
 */
export const merchantAccess = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required.'
    });
    return;
  }

  // Admins have access to all merchants
  if (req.user.role === 'ADMIN') {
    next();
    return;
  }

  const merchantId = req.params.merchantId || req.params.id || req.body.merchantId;
  
  if (!merchantId) {
    res.status(400).json({
      success: false,
      error: 'Merchant ID is required.'
    });
    return;
  }

  try {
    // Check if rep has access to this merchant
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: {
        pipeline: true,
        onboarding: true
      }
    });

    if (!merchant) {
      res.status(404).json({
        success: false,
        error: 'Merchant not found.'
      });
      return;
    }

    // Reps can access merchants they:
    // 1. Created
    // 2. Are assigned to in pipeline
    // 3. Are assigned to in onboarding
    const hasAccess = 
      merchant.createdById === req.user.id ||
      merchant.pipeline?.responsibleRepId === req.user.id ||
      merchant.onboarding?.assignedRepId === req.user.id;

    if (!hasAccess) {
      logAudit('ACCESS_DENIED', 'merchant', merchantId, req.user.id, {
        reason: 'Not assigned to merchant'
      });
      
      res.status(403).json({
        success: false,
        error: 'Access denied. You are not assigned to this merchant.'
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Merchant access middleware error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      merchantId,
      userId: req.user.id
    });
    
    res.status(500).json({
      success: false,
      error: 'Internal server error during access control.'
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is present but doesn't require it
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true
      }
    });

    if (user && user.status === 'ACTIVE') {
      req.user = user;
    }
  } catch (error) {
    // Ignore JWT errors in optional auth
    logger.debug('Optional auth failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  next();
};

/**
 * Rate limiting for authentication endpoints
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs for auth endpoints
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: 15 * 60 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Validate refresh token middleware
 */
export const validateRefreshToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const refreshToken = req.headers['x-refresh-token'] as string || req.body.refreshToken;
    
    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: 'Refresh token is required.'
      });
      return;
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as TokenPayload;
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user || user.status !== 'ACTIVE') {
        res.status(401).json({
          success: false,
          error: 'Invalid refresh token or inactive user.'
        });
        return;
      }

      req.user = user;
      next();
    } catch (jwtError) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token.'
      });
      return;
    }
  } catch (error) {
    logger.error('Refresh token validation error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    res.status(500).json({
      success: false,
      error: 'Internal server error during token validation.'
    });
  }
};