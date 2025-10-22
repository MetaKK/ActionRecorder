/**
 * Authentication Middleware
 * JWT验证和用户认证
 */

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { ApiError } from '../utils/errors'
import { UserTier } from '@prisma/client'

// 扩展 Express Request 类型
declare global {
  namespace Express {
    interface Request {
      userId?: string
      userEmail?: string
      userTier?: UserTier
    }
  }
}

interface JWTPayload {
  userId: string
  email: string
  tier: UserTier
  iat: number
  exp: number
}

/**
 * 验证 JWT Token
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // 获取 Token
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'No token provided')
    }
    
    const token = authHeader.substring(7) // 移除 "Bearer " 前缀
    
    // 验证 Token
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured')
    }
    
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload
    
    // 将用户信息附加到 request
    req.userId = decoded.userId
    req.userEmail = decoded.email
    req.userTier = decoded.tier
    
    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new ApiError(401, 'Invalid token'))
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new ApiError(401, 'Token expired'))
    }
    next(error)
  }
}

/**
 * 可选的认证中间件（Token不存在也放行）
 */
export function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next() // 没有 Token，继续处理
    }
    
    const token = authHeader.substring(7)
    const jwtSecret = process.env.JWT_SECRET
    
    if (!jwtSecret) {
      return next()
    }
    
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload
    req.userId = decoded.userId
    req.userEmail = decoded.email
    req.userTier = decoded.tier
    
    next()
  } catch {
    // Token 无效，忽略错误继续处理
    next()
  }
}

/**
 * 权限检查中间件
 */
export function requireTier(...allowedTiers: UserTier[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userTier) {
      return next(new ApiError(401, 'Authentication required'))
    }
    
    if (!allowedTiers.includes(req.userTier)) {
      return next(new ApiError(403, 'Insufficient permissions'))
    }
    
    next()
  }
}

/**
 * 生成 JWT Token
 */
export function generateToken(
  userId: string,
  email: string,
  tier: UserTier
): string {
  const jwtSecret = process.env.JWT_SECRET
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d'
  
  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured')
  }
  
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId,
    email,
    tier,
  }
  
  return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn })
}

