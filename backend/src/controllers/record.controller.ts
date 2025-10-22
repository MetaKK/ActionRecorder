/**
 * Record Controller
 * 生活记录业务逻辑
 */

import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { getPrismaClient } from '../utils/database'
import { ApiError, NotFoundError } from '../utils/errors'
import { logger } from '../utils/logger'

const prisma = getPrismaClient()

// ============================================
// Validation Schemas
// ============================================

const locationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number(),
  altitude: z.number().nullable().optional(),
  altitudeAccuracy: z.number().nullable().optional(),
  heading: z.number().nullable().optional(),
  speed: z.number().nullable().optional(),
  timestamp: z.number(),
  address: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  street: z.string().optional(),
  country: z.string().optional(),
  province: z.string().optional(),
})

const createRecordSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  location: locationSchema.optional(),
  audioUrl: z.string().url().optional(),
  audioDuration: z.number().int().positive().optional(),
  audioFormat: z.string().optional(),
  timestamp: z.number().int(),
  mediaIds: z.array(z.string().uuid()).optional(), // 关联的媒体ID
})

const updateRecordSchema = z.object({
  content: z.string().min(1).optional(),
  location: locationSchema.optional(),
  mediaIds: z.array(z.string().uuid()).optional(),
})

const batchCreateSchema = z.object({
  records: z.array(createRecordSchema),
})

// ============================================
// Handlers
// ============================================

/**
 * @desc    Get records list (with pagination)
 * @route   GET /api/v1/records
 * @access  Private
 */
export async function getRecords(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!
    
    // Parse query parameters
    const page = parseInt(req.query.page as string) || 1
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
    const skip = (page - 1) * limit

    // Get records with pagination
    const [records, total] = await Promise.all([
      prisma.record.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
        include: {
          media: {
            include: {
              media: true,
            },
            orderBy: {
              displayOrder: 'asc',
            },
          },
        },
      }),
      prisma.record.count({
        where: { userId },
      }),
    ])

    // Transform data
    const transformedRecords = records.map(record => ({
      id: record.id,
      content: record.content,
      location: record.location,
      audioUrl: record.audioUrl,
      audioDuration: record.audioDuration,
      audioFormat: record.audioFormat,
      timestamp: record.timestamp,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      images: record.media.map(rm => ({
        id: rm.media.id,
        type: rm.media.type.toLowerCase(),
        url: rm.media.url,
        thumbnailUrl: rm.media.thumbnailUrl,
        width: rm.media.width,
        height: rm.media.height,
        size: rm.media.sizeBytes,
        mimeType: rm.media.mimeType,
        duration: rm.media.duration,
        createdAt: rm.media.createdAt,
      })),
    }))

    res.json({
      success: true,
      data: {
        records: transformedRecords,
      },
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
 * @desc    Get single record
 * @route   GET /api/v1/records/:id
 * @access  Private
 */
export async function getRecordById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!
    const recordId = req.params.id

    const record = await prisma.record.findFirst({
      where: {
        id: recordId,
        userId,
      },
      include: {
        media: {
          include: {
            media: true,
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
      },
    })

    if (!record) {
      throw new NotFoundError('Record')
    }

    res.json({
      success: true,
      data: {
        record: {
          ...record,
          images: record.media.map(rm => rm.media),
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Create new record
 * @route   POST /api/v1/records
 * @access  Private
 */
export async function createRecord(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!
    const data = createRecordSchema.parse(req.body)

    // Verify media ownership if mediaIds provided
    if (data.mediaIds && data.mediaIds.length > 0) {
      const mediaCount = await prisma.media.count({
        where: {
          id: { in: data.mediaIds },
          userId,
        },
      })

      if (mediaCount !== data.mediaIds.length) {
        throw new ApiError(400, 'Some media files not found or not owned by user')
      }
    }

    // Create record with media associations
    const record = await prisma.record.create({
      data: {
        userId,
        content: data.content,
        location: data.location,
        audioUrl: data.audioUrl,
        audioDuration: data.audioDuration,
        audioFormat: data.audioFormat,
        timestamp: data.timestamp,
        media: data.mediaIds ? {
          create: data.mediaIds.map((mediaId, index) => ({
            mediaId,
            displayOrder: index,
          })),
        } : undefined,
      },
      include: {
        media: {
          include: {
            media: true,
          },
        },
      },
    })

    logger.info(`Record created: ${record.id} by user ${userId}`)

    res.status(201).json({
      success: true,
      data: { record },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Update record
 * @route   PUT /api/v1/records/:id
 * @access  Private
 */
export async function updateRecord(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!
    const recordId = req.params.id
    const data = updateRecordSchema.parse(req.body)

    // Check ownership
    const existing = await prisma.record.findFirst({
      where: { id: recordId, userId },
    })

    if (!existing) {
      throw new NotFoundError('Record')
    }

    // Update record
    const record = await prisma.record.update({
      where: { id: recordId },
      data: {
        ...(data.content && { content: data.content }),
        ...(data.location && { location: data.location }),
      },
    })

    // Update media associations if provided
    if (data.mediaIds) {
      // Remove old associations
      await prisma.recordMedia.deleteMany({
        where: { recordId },
      })

      // Create new associations
      if (data.mediaIds.length > 0) {
        await prisma.recordMedia.createMany({
          data: data.mediaIds.map((mediaId, index) => ({
            recordId,
            mediaId,
            displayOrder: index,
          })),
        })
      }
    }

    res.json({
      success: true,
      data: { record },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Delete record
 * @route   DELETE /api/v1/records/:id
 * @access  Private
 */
export async function deleteRecord(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!
    const recordId = req.params.id

    // Check ownership
    const record = await prisma.record.findFirst({
      where: { id: recordId, userId },
    })

    if (!record) {
      throw new NotFoundError('Record')
    }

    // Delete record (cascade delete media associations)
    await prisma.record.delete({
      where: { id: recordId },
    })

    logger.info(`Record deleted: ${recordId}`)

    res.json({
      success: true,
      message: 'Record deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Batch create records (for migration)
 * @route   POST /api/v1/records/batch
 * @access  Private
 */
export async function batchCreateRecords(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!
    const { records: recordsData } = batchCreateSchema.parse(req.body)

    // Create records in transaction
    const records = await prisma.$transaction(
      recordsData.map(data =>
        prisma.record.create({
          data: {
            userId,
            content: data.content,
            location: data.location,
            audioUrl: data.audioUrl,
            audioDuration: data.audioDuration,
            audioFormat: data.audioFormat,
            timestamp: data.timestamp,
          },
        })
      )
    )

    logger.info(`Batch created ${records.length} records for user ${userId}`)

    res.status(201).json({
      success: true,
      data: {
        count: records.length,
        records,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Get records by date range
 * @route   GET /api/v1/records/filter/date-range
 * @access  Private
 */
export async function getRecordsByDateRange(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!
    
    const startTimestamp = parseInt(req.query.start as string)
    const endTimestamp = parseInt(req.query.end as string)

    if (isNaN(startTimestamp) || isNaN(endTimestamp)) {
      throw new ApiError(400, 'Invalid date range')
    }

    const records = await prisma.record.findMany({
      where: {
        userId,
        timestamp: {
          gte: startTimestamp,
          lte: endTimestamp,
        },
      },
      orderBy: { timestamp: 'desc' },
      include: {
        media: {
          include: {
            media: true,
          },
        },
      },
    })

    res.json({
      success: true,
      data: { records },
    })
  } catch (error) {
    next(error)
  }
}

