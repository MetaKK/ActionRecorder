/**
 * Authentication Controller
 * 处理用户认证相关逻辑
 */

import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { getPrismaClient } from '../utils/database'
import { generateToken } from '../middleware/auth.middleware'
import { ApiError, ValidationError } from '../utils/errors'
import { logger } from '../utils/logger'

const prisma = getPrismaClient()

// ============================================
// Validation Schemas
// ============================================

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z.string().min(2).max(100).optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

const updateProfileSchema = z.object({
  username: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
})

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

// ============================================
// Handlers
// ============================================

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Validate input
    const { email, password, username } = registerSchema.parse(req.body)

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new ValidationError('Email already registered')
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        username,
      },
    })

    // Generate token
    const token = generateToken(user.id, user.email, user.tier)

    logger.info(`New user registered: ${user.email}`)

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          tier: user.tier,
          createdAt: user.createdAt,
        },
        token,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Validate input
    const { email, password } = loginSchema.parse(req.body)

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user || !user.passwordHash) {
      throw new ApiError(401, 'Invalid email or password')
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid email or password')
    }

    // Generate token
    const token = generateToken(user.id, user.email, user.tier)

    logger.info(`User logged in: ${user.email}`)

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          tier: user.tier,
        },
        token,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Logout user
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // JWT 是无状态的，客户端删除 token 即可
    // 如果需要服务端黑名单，可以使用 Redis

    res.json({
      success: true,
      message: 'Logged out successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Get current user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export async function getCurrentUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        tier: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      throw new ApiError(404, 'User not found')
    }

    res.json({
      success: true,
      data: { user },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Update user profile
 * @route   PUT /api/v1/auth/profile
 * @access  Private
 */
export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!
    const { username, email } = updateProfileSchema.parse(req.body)

    // Check if email is already taken
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: userId },
        },
      })

      if (existingUser) {
        throw new ValidationError('Email already in use')
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(username && { username }),
        ...(email && { email }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        tier: true,
        updatedAt: true,
      },
    })

    res.json({
      success: true,
      data: { user },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Change password
 * @route   PUT /api/v1/auth/password
 * @access  Private
 */
export async function changePassword(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body)

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user || !user.passwordHash) {
      throw new ApiError(404, 'User not found')
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash)

    if (!isPasswordValid) {
      throw new ApiError(401, 'Current password is incorrect')
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12)

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    })

    logger.info(`Password changed for user: ${user.email}`)

    res.json({
      success: true,
      message: 'Password changed successfully',
    })
  } catch (error) {
    next(error)
  }
}

