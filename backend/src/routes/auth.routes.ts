import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticate, adminOnly, validateRefreshToken, authRateLimit } from '../middleware/auth';
import { validate, authSchemas } from '../middleware/validation';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest, TokenPayload, AuthTokens } from '../types';
import { logger, logAudit } from '../utils/logger';
import { getEnvVars } from '../utils/validateEnv';

const router = express.Router();
const prisma = new PrismaClient();
const env = getEnvVars();

/**
 * Generate JWT tokens
 */
const generateTokens = (userId: string, email: string, role: string): AuthTokens => {
  const payload: TokenPayload = { userId, email, role };
  
  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
  
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN
  });

  return { accessToken, refreshToken };
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT tokens
 * @access  Public
 */
router.post('/login', 
  authRateLimit,
  validate(authSchemas.login),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      logAudit('LOGIN_FAILED', 'user', email, undefined, { reason: 'User not found' });
      throw new AppError('Invalid email or password', 401);
    }

    if (user.status !== 'ACTIVE') {
      logAudit('LOGIN_FAILED', 'user', user.id, undefined, { reason: 'Account inactive' });
      throw new AppError('Account is inactive', 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      logAudit('LOGIN_FAILED', 'user', user.id, undefined, { reason: 'Invalid password' });
      throw new AppError('Invalid email or password', 401);
    }

    // Generate tokens
    const tokens = generateTokens(user.id, user.email, user.role);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Log successful login
    logAudit('LOGIN_SUCCESS', 'user', user.id, user.id);
    
    logger.info('User logged in', {
      userId: user.id,
      email: user.email,
      role: user.role,
      ip: req.ip
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          lastLoginAt: user.lastLoginAt
        },
        ...tokens
      },
      message: 'Login successful'
    });
  })
);

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (Admin only)
 * @access  Admin
 */
router.post('/register', 
  authenticate,
  adminOnly,
  validate(authSchemas.register),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { email, password, name, phone, role } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        phone,
        role: role || 'REP',
        passwordHash
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true
      }
    });

    // Log user creation
    logAudit('USER_CREATED', 'user', newUser.id, req.user!.id, {
      newUserEmail: newUser.email,
      newUserRole: newUser.role
    });

    logger.info('New user registered', {
      newUserId: newUser.id,
      newUserEmail: newUser.email,
      newUserRole: newUser.role,
      createdBy: req.user!.id
    });

    res.status(201).json({
      success: true,
      data: { user: newUser },
      message: 'User registered successfully'
    });
  })
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public (with valid refresh token)
 */
router.post('/refresh',
  validateRefreshToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    
    // Generate new tokens
    const tokens = generateTokens(user.id, user.email, user.role);

    logger.info('Token refreshed', {
      userId: user.id,
      email: user.email
    });

    res.json({
      success: true,
      data: tokens,
      message: 'Tokens refreshed successfully'
    });
  })
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Initiate password reset process
 * @access  Public
 */
router.post('/forgot-password',
  authRateLimit,
  validate(authSchemas.forgotPassword),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { email } = req.body;

    // Find user (don't reveal if user doesn't exist)
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

    if (user) {
      // TODO: Generate reset token and send email
      // For now, just log the attempt
      logAudit('PASSWORD_RESET_REQUESTED', 'user', user.id, undefined);
      
      logger.info('Password reset requested', {
        userId: user.id,
        email: user.email,
        ip: req.ip
      });
    }
  })
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using reset token
 * @access  Public (with valid reset token)
 */
router.post('/reset-password',
  authRateLimit,
  validate(authSchemas.resetPassword),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { token, newPassword } = req.body;

    // TODO: Implement reset token validation
    // For now, return not implemented
    throw new AppError('Password reset functionality not yet implemented', 501);
  })
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user information
 * @access  Private
 */
router.get('/me',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!;

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt
        }
      }
    });
  })
);

/**
 * @route   GET /api/auth/users
 * @desc    Get all users (Admin only)
 * @access  Admin
 */
router.get('/users',
  authenticate,
  adminOnly,
  validate({ query: authSchemas.pagination }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build where clause
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          lastLoginAt: true
        },
        orderBy: { [sortBy as string]: sortOrder },
        skip,
        take
      }),
      prisma.user.count({ where })
    ]);

    const totalPages = Math.ceil(total / take);

    res.json({
      success: true,
      data: users,
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
 * @route   PATCH /api/auth/users/:id/status
 * @desc    Update user status (Admin only)
 * @access  Admin
 */
router.patch('/users/:id/status',
  authenticate,
  adminOnly,
  validate({
    params: Joi.object({
      id: Joi.string().uuid().required()
    }),
    body: Joi.object({
      status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED').required()
    })
  }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { status } = req.body;

    // Prevent admin from deactivating themselves
    if (id === req.user!.id && status !== 'ACTIVE') {
      throw new AppError('Cannot deactivate your own account', 400);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        updatedAt: true
      }
    });

    // Log status change
    logAudit('USER_STATUS_CHANGED', 'user', id, req.user!.id, {
      newStatus: status,
      previousStatus: 'unknown' // We don't have the previous status here
    });

    logger.info('User status updated', {
      targetUserId: id,
      newStatus: status,
      updatedBy: req.user!.id
    });

    res.json({
      success: true,
      data: { user: updatedUser },
      message: 'User status updated successfully'
    });
  })
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (invalidate token on client side)
 * @access  Private
 */
router.post('/logout',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!;

    // Log logout
    logAudit('LOGOUT', 'user', user.id, user.id);
    
    logger.info('User logged out', {
      userId: user.id,
      email: user.email
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  })
);

/**
 * @route   PATCH /api/auth/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.patch('/profile',
  authenticate,
  validate({
    body: Joi.object({
      name: Joi.string().min(2).max(100).optional(),
      phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).max(20).optional()
    }).min(1)
  }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const { name, phone } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name && { name }),
        ...(phone && { phone })
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        updatedAt: true
      }
    });

    // Log profile update
    logAudit('PROFILE_UPDATED', 'user', user.id, user.id, {
      changes: { name, phone }
    });

    res.json({
      success: true,
      data: { user: updatedUser },
      message: 'Profile updated successfully'
    });
  })
);

/**
 * @route   PATCH /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.patch('/change-password',
  authenticate,
  validate({
    body: Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string().min(8).max(100).required()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .message('Password must contain at least one lowercase, one uppercase letter and one number')
    })
  }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const { currentPassword, newPassword } = req.body;

    // Get current user with password hash
    const userWithPassword = await prisma.user.findUnique({
      where: { id: user.id }
    });

    if (!userWithPassword) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, userWithPassword.passwordHash);
    if (!isValidPassword) {
      throw new AppError('Current password is incorrect', 400);
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash }
    });

    // Log password change
    logAudit('PASSWORD_CHANGED', 'user', user.id, user.id);

    logger.info('Password changed', {
      userId: user.id,
      email: user.email
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  })
);

/**
 * @route   GET /api/auth/verify-token
 * @desc    Verify if current token is valid
 * @access  Private
 */
router.get('/verify-token',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    res.json({
      success: true,
      data: {
        valid: true,
        user: {
          id: req.user!.id,
          email: req.user!.email,
          name: req.user!.name,
          role: req.user!.role
        }
      },
      message: 'Token is valid'
    });
  })
);

export default router;