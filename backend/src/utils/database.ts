/**
 * Database connection utility
 * Prisma Client 单例
 */

import { PrismaClient } from '@prisma/client'
import { logger } from './logger'

// Prisma Client 单例
let prisma: PrismaClient

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error'],
    })
  }
  return prisma
}

/**
 * 连接数据库
 */
export async function connectDB(): Promise<void> {
  try {
    const client = getPrismaClient()
    await client.$connect()
    logger.info('✅ Database connected successfully')
  } catch (error) {
    logger.error('❌ Database connection failed:', error)
    throw error
  }
}

/**
 * 断开数据库连接
 */
export async function disconnectDB(): Promise<void> {
  try {
    const client = getPrismaClient()
    await client.$disconnect()
    logger.info('Database disconnected')
  } catch (error) {
    logger.error('Error disconnecting from database:', error)
  }
}

// 优雅关闭
process.on('beforeExit', async () => {
  await disconnectDB()
})

export { prisma }
export default getPrismaClient

