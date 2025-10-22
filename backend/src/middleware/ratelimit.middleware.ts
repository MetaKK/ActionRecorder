/**
 * Rate Limiting Middleware
 * 基于 Redis 的限流中间件
 */

import { Request, Response, NextFunction } from 'express'
import Redis from 'ioredis'
import { ApiError } from '../utils/errors'
import { UserTier } from '@prisma/client'

let redis: Redis | null = null

// 初始化 Redis
function getRedisClient(): Redis | null {
  if (redis) return redis
  
  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) {
    console.warn('⚠️ REDIS_URL not configured, rate limiting disabled')
    return null
  }
  
  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null
        return Math.min(times * 50, 2000)
      },
    })
    
    redis.on('error', (error) => {
      console.error('Redis error:', error)
    })
    
    return redis
  } catch (error) {
    console.error('Failed to connect to Redis:', error)
    return null
  }
}

interface RateLimitConfig {
  windowMs: number     // 时间窗口（毫秒）
  maxRequests: number  // 最大请求数
}

// 不同用户等级的限流配置
const rateLimitConfigs: Record<UserTier, RateLimitConfig> = {
  FREE: {
    windowMs: 15 * 60 * 1000,  // 15分钟
    maxRequests: 100,          // 100次请求
  },
  PREMIUM: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 1000,
  },
  ENTERPRISE: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 10000,
  },
}

/**
 * 限流中间件
 */
export function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const redisClient = getRedisClient()
  
  // Redis 不可用，跳过限流
  if (!redisClient) {
    return next()
  }
  
  const userId = req.userId
  
  // 未认证用户，使用 IP 限流
  const identifier = userId || req.ip || 'unknown'
  const tier = req.userTier || UserTier.FREE
  const config = rateLimitConfigs[tier]
  
  const key = `ratelimit:${identifier}`
  const now = Date.now()
  const windowStart = now - config.windowMs
  
  ;(async () => {
    try {
      // 使用 Redis Sorted Set 实现滑动窗口限流
      const multi = redisClient.multi()
      
      // 移除过期记录
      multi.zremrangebyscore(key, '-inf', windowStart)
      
      // 添加当前请求
      multi.zadd(key, now, `${now}-${Math.random()}`)
      
      // 计算时间窗口内的请求数
      multi.zcard(key)
      
      // 设置过期时间
      multi.expire(key, Math.ceil(config.windowMs / 1000))
      
      const results = await multi.exec()
      
      if (!results) {
        throw new Error('Redis transaction failed')
      }
      
      // 获取请求计数
      const count = results[2][1] as number
      
      // 设置响应头
      res.setHeader('X-RateLimit-Limit', config.maxRequests)
      res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - count))
      res.setHeader('X-RateLimit-Reset', new Date(now + config.windowMs).toISOString())
      
      // 检查是否超过限流
      if (count > config.maxRequests) {
        const retryAfter = Math.ceil(config.windowMs / 1000)
        res.setHeader('Retry-After', retryAfter)
        
        return next(new ApiError(
          429,
          'Too many requests, please try again later',
          { retryAfter }
        ))
      }
      
      next()
    } catch (error) {
      console.error('Rate limit error:', error)
      // 限流失败，放行请求（fail open）
      next()
    }
  })()
}

/**
 * 自定义限流中间件
 */
export function createRateLimiter(config: RateLimitConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    const redisClient = getRedisClient()
    
    if (!redisClient) {
      return next()
    }
    
    const identifier = req.userId || req.ip || 'unknown'
    const key = `ratelimit:custom:${identifier}`
    const now = Date.now()
    const windowStart = now - config.windowMs
    
    ;(async () => {
      try {
        const multi = redisClient.multi()
        multi.zremrangebyscore(key, '-inf', windowStart)
        multi.zadd(key, now, `${now}-${Math.random()}`)
        multi.zcard(key)
        multi.expire(key, Math.ceil(config.windowMs / 1000))
        
        const results = await multi.exec()
        if (!results) throw new Error('Redis transaction failed')
        
        const count = results[2][1] as number
        
        res.setHeader('X-RateLimit-Limit', config.maxRequests)
        res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - count))
        
        if (count > config.maxRequests) {
          const retryAfter = Math.ceil(config.windowMs / 1000)
          res.setHeader('Retry-After', retryAfter)
          return next(new ApiError(429, 'Rate limit exceeded'))
        }
        
        next()
      } catch (error) {
        console.error('Rate limit error:', error)
        next()
      }
    })()
  }
}

// 导出 Redis 客户端（供其他模块使用）
export { getRedisClient }

