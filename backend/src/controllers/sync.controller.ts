/**
 * Sync Controller
 * 数据同步逻辑
 */

import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { getPrismaClient } from '../utils/database'
import { logger } from '../utils/logger'

const prisma = getPrismaClient()

// ============================================
// Validation Schemas
// ============================================

const pullDataSchema = z.object({
  lastSyncTime: z.number().int(),
})

const pushDataSchema = z.object({
  lastSyncTime: z.number().int(),
  changes: z.object({
    records: z.array(z.any()).optional(),
    diaries: z.array(z.any()).optional(),
    deletedIds: z.array(z.string()).optional(),
  }),
})

// ============================================
// Handlers
// ============================================

/**
 * @desc    Pull data from server (incremental sync)
 * @route   POST /api/v1/sync/pull
 * @access  Private
 */
export async function pullData(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!
    const { lastSyncTime } = pullDataSchema.parse(req.body)

    const lastSyncDate = new Date(lastSyncTime)

    // Get all updates since last sync
    const [records, diaries] = await Promise.all([
      prisma.record.findMany({
        where: {
          userId,
          updatedAt: { gt: lastSyncDate },
        },
        include: {
          media: {
            include: {
              media: true,
            },
          },
        },
      }),
      prisma.diary.findMany({
        where: {
          userId,
          updatedAt: { gt: lastSyncDate },
        },
      }),
    ])

    const newSyncTime = Date.now()

    logger.info(`Pull sync for user ${userId}: ${records.length} records, ${diaries.length} diaries`)

    res.json({
      success: true,
      data: {
        updates: {
          records,
          diaries,
        },
        conflicts: [], // TODO: Implement conflict detection
        newSyncTime,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Push data to server
 * @route   POST /api/v1/sync/push
 * @access  Private
 */
export async function pushData(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!
    const { changes } = pushDataSchema.parse(req.body)

    const results = {
      recordsCreated: 0,
      recordsUpdated: 0,
      diariesCreated: 0,
      diariesUpdated: 0,
      errors: [] as string[],
    }

    // Push records
    if (changes.records) {
      for (const record of changes.records) {
        try {
          await prisma.record.upsert({
            where: { id: record.id },
            update: {
              content: record.content,
              location: record.location,
              timestamp: record.timestamp,
              updatedAt: new Date(record.updatedAt),
            },
            create: {
              id: record.id,
              userId,
              content: record.content,
              location: record.location,
              timestamp: record.timestamp,
              createdAt: new Date(record.createdAt),
              updatedAt: new Date(record.updatedAt),
            },
          })

          const existing = await prisma.record.findUnique({
            where: { id: record.id },
          })

          if (existing) {
            if (existing.createdAt.getTime() === new Date(record.createdAt).getTime()) {
              results.recordsCreated++
            } else {
              results.recordsUpdated++
            }
          }
        } catch (error) {
          results.errors.push(`Failed to sync record ${record.id}`)
          logger.error(`Sync error for record ${record.id}:`, error)
        }
      }
    }

    // Push diaries
    if (changes.diaries) {
      for (const diary of changes.diaries) {
        try {
          await prisma.diary.upsert({
            where: { id: diary.id },
            update: {
              diaryData: diary.diaryData,
              mood: diary.mood,
              wordCount: diary.wordCount,
              excerpt: diary.excerpt,
              title: diary.title,
              isPinned: diary.isPinned,
              isDeleted: diary.isDeleted,
              updatedAt: new Date(diary.updatedAt),
            },
            create: {
              id: diary.id,
              userId,
              date: new Date(diary.date),
              diaryData: diary.diaryData,
              mood: diary.mood,
              wordCount: diary.wordCount,
              type: diary.type || 'AUTO',
              excerpt: diary.excerpt,
              title: diary.title,
              isPinned: diary.isPinned || false,
              isDeleted: diary.isDeleted || false,
              createdAt: new Date(diary.createdAt),
              updatedAt: new Date(diary.updatedAt),
            },
          })

          const existing = await prisma.diary.findUnique({
            where: { id: diary.id },
          })

          if (existing) {
            if (existing.createdAt.getTime() === new Date(diary.createdAt).getTime()) {
              results.diariesCreated++
            } else {
              results.diariesUpdated++
            }
          }
        } catch (error) {
          results.errors.push(`Failed to sync diary ${diary.id}`)
          logger.error(`Sync error for diary ${diary.id}:`, error)
        }
      }
    }

    logger.info(`Push sync for user ${userId}:`, results)

    res.json({
      success: true,
      data: results,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Get sync status
 * @route   GET /api/v1/sync/status
 * @access  Private
 */
export async function getSyncStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!

    const [recordCount, diaryCount, lastRecord, lastDiary] = await Promise.all([
      prisma.record.count({ where: { userId } }),
      prisma.diary.count({ where: { userId, isDeleted: false } }),
      prisma.record.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      prisma.diary.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
    ])

    const lastSync = Math.max(
      lastRecord?.updatedAt.getTime() || 0,
      lastDiary?.updatedAt.getTime() || 0
    )

    res.json({
      success: true,
      data: {
        recordCount,
        diaryCount,
        lastSync: lastSync > 0 ? lastSync : null,
        serverTime: Date.now(),
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Resolve sync conflict
 * @route   POST /api/v1/sync/resolve-conflict
 * @access  Private
 */
export async function resolveConflict(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // TODO: Implement conflict resolution
    // For now, use Last Write Wins strategy

    res.json({
      success: true,
      message: 'Conflict resolution not yet implemented',
    })
  } catch (error) {
    next(error)
  }
}

