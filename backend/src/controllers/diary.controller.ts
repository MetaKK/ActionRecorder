/**
 * Diary Controller
 * AI日记业务逻辑
 */

import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { getPrismaClient } from '../utils/database'
import { NotFoundError } from '../utils/errors'
import { logger } from '../utils/logger'

const prisma = getPrismaClient()

// ============================================
// Validation Schemas
// ============================================

const createDiarySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  diaryData: z.record(z.unknown()),
  mood: z.string().optional(),
  wordCount: z.number().int().positive(),
  type: z.enum(['AUTO', 'MANUAL']).optional(),
  excerpt: z.string().optional(),
  title: z.string().optional(),
  isPinned: z.boolean().optional(),
})

const updateDiarySchema = z.object({
  diaryData: z.record(z.unknown()).optional(),
  mood: z.string().optional(),
  wordCount: z.number().int().positive().optional(),
  excerpt: z.string().optional(),
  title: z.string().optional(),
  isPinned: z.boolean().optional(),
})

// ============================================
// Handlers
// ============================================

/**
 * @desc    Get diaries list
 * @route   GET /api/v1/diaries
 * @access  Private
 */
export async function getDiaries(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!

    const page = parseInt(req.query.page as string) || 1
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
    const skip = (page - 1) * limit

    const [diaries, total] = await Promise.all([
      prisma.diary.findMany({
        where: {
          userId,
          isDeleted: false,
        },
        orderBy: [
          { isPinned: 'desc' },
          { date: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
        select: {
          id: true,
          date: true,
          mood: true,
          wordCount: true,
          type: true,
          excerpt: true,
          title: true,
          isPinned: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.diary.count({
        where: {
          userId,
          isDeleted: false,
        },
      }),
    ])

    res.json({
      success: true,
      data: { diaries },
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Get single diary
 * @route   GET /api/v1/diaries/:id
 * @access  Private
 */
export async function getDiaryById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!
    const diaryId = req.params.id

    const diary = await prisma.diary.findFirst({
      where: {
        id: diaryId,
        userId,
        isDeleted: false,
      },
    })

    if (!diary) {
      throw new NotFoundError('Diary')
    }

    res.json({
      success: true,
      data: { diary },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Get diaries by date
 * @route   GET /api/v1/diaries/date/:date
 * @access  Private
 */
export async function getDiariesByDate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!
    const date = req.params.date

    const diaries = await prisma.diary.findMany({
      where: {
        userId,
        date: new Date(date),
        isDeleted: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    res.json({
      success: true,
      data: { diaries },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Create/Save diary
 * @route   POST /api/v1/diaries
 * @access  Private
 */
export async function createDiary(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!
    const data = createDiarySchema.parse(req.body)

    const diary = await prisma.diary.create({
      data: {
        userId,
        date: new Date(data.date),
        diaryData: data.diaryData,
        mood: data.mood,
        wordCount: data.wordCount,
        type: data.type || 'AUTO',
        excerpt: data.excerpt,
        title: data.title,
        isPinned: data.isPinned || false,
      },
    })

    logger.info(`Diary created: ${diary.id} for date ${data.date}`)

    res.status(201).json({
      success: true,
      data: { diary },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Update diary
 * @route   PUT /api/v1/diaries/:id
 * @access  Private
 */
export async function updateDiary(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!
    const diaryId = req.params.id
    const data = updateDiarySchema.parse(req.body)

    // Check ownership
    const existing = await prisma.diary.findFirst({
      where: {
        id: diaryId,
        userId,
        isDeleted: false,
      },
    })

    if (!existing) {
      throw new NotFoundError('Diary')
    }

    // Update diary
    const diary = await prisma.diary.update({
      where: { id: diaryId },
      data: {
        ...(data.diaryData && { diaryData: data.diaryData }),
        ...(data.mood !== undefined && { mood: data.mood }),
        ...(data.wordCount && { wordCount: data.wordCount }),
        ...(data.excerpt !== undefined && { excerpt: data.excerpt }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.isPinned !== undefined && { isPinned: data.isPinned }),
      },
    })

    res.json({
      success: true,
      data: { diary },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Delete diary (soft delete)
 * @route   DELETE /api/v1/diaries/:id
 * @access  Private
 */
export async function deleteDiary(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!
    const diaryId = req.params.id

    // Check ownership
    const diary = await prisma.diary.findFirst({
      where: {
        id: diaryId,
        userId,
        isDeleted: false,
      },
    })

    if (!diary) {
      throw new NotFoundError('Diary')
    }

    // Soft delete
    await prisma.diary.update({
      where: { id: diaryId },
      data: { isDeleted: true },
    })

    logger.info(`Diary soft-deleted: ${diaryId}`)

    res.json({
      success: true,
      message: 'Diary deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Get diary statistics
 * @route   GET /api/v1/diaries/stats/summary
 * @access  Private
 */
export async function getDiaryStats(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!

    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisYearStart = new Date(now.getFullYear(), 0, 1)

    const [total, thisMonth, thisYear, diaries] = await Promise.all([
      prisma.diary.count({
        where: { userId, isDeleted: false },
      }),
      prisma.diary.count({
        where: {
          userId,
          isDeleted: false,
          date: { gte: thisMonthStart },
        },
      }),
      prisma.diary.count({
        where: {
          userId,
          isDeleted: false,
          date: { gte: thisYearStart },
        },
      }),
      prisma.diary.findMany({
        where: { userId, isDeleted: false },
        select: {
          mood: true,
          wordCount: true,
        },
      }),
    ])

    // Calculate mood distribution
    const moodDistribution: Record<string, number> = {}
    diaries.forEach(d => {
      if (d.mood) {
        moodDistribution[d.mood] = (moodDistribution[d.mood] || 0) + 1
      }
    })

    // Calculate average word count
    const totalWords = diaries.reduce((sum, d) => sum + d.wordCount, 0)
    const averageWordCount = total > 0 ? Math.round(totalWords / total) : 0

    res.json({
      success: true,
      data: {
        total,
        thisMonth,
        thisYear,
        averageWordCount,
        moodDistribution,
      },
    })
  } catch (error) {
    next(error)
  }
}

