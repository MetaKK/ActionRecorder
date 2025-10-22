/**
 * Media Controller
 * 媒体文件上传、管理
 */

import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import sharp from 'sharp'
import { getPrismaClient } from '../utils/database'
import { uploadFile, deleteFile, generateMediaKey, getPresignedUploadUrl as getPresignedUrl } from '../services/storage.service'
import { ApiError, NotFoundError } from '../utils/errors'
import { logger } from '../utils/logger'

const prisma = getPrismaClient()

// ============================================
// Validation Schemas
// ============================================

const presignedUploadSchema = z.object({
  filename: z.string(),
  contentType: z.string(),
  mediaType: z.enum(['image', 'video', 'audio']),
})

// ============================================
// Helpers
// ============================================

/**
 * Get file extension from mimetype
 */
function getExtensionFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'audio/webm': 'webm',
    'audio/mp4': 'mp4',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
  }
  return map[mimeType] || 'bin'
}

/**
 * Generate thumbnail for image
 */
async function generateThumbnail(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(400, 400, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 80 })
    .toBuffer()
}

/**
 * Get image dimensions
 */
async function getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
  const metadata = await sharp(buffer).metadata()
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
  }
}

// ============================================
// Handlers
// ============================================

/**
 * @desc    Upload media file(s)
 * @route   POST /api/v1/media/upload
 * @access  Private
 */
export async function uploadMedia(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!
    const files = req.files as Express.Multer.File[]

    if (!files || files.length === 0) {
      throw new ApiError(400, 'No files provided')
    }

    const uploadResults = []

    for (const file of files) {
      const isImage = file.mimetype.startsWith('image/')
      const isVideo = file.mimetype.startsWith('video/')
      const isAudio = file.mimetype.startsWith('audio/')

      let mediaType: 'IMAGE' | 'VIDEO'
      let folder: string

      if (isImage) {
        mediaType = 'IMAGE'
        folder = 'images'
      } else if (isVideo) {
        mediaType = 'VIDEO'
        folder = 'videos'
      } else if (isAudio) {
        // Audio files stored as part of records, not as media
        continue
      } else {
        throw new ApiError(400, `Unsupported file type: ${file.mimetype}`)
      }

      const extension = getExtensionFromMime(file.mimetype)
      const key = generateMediaKey(userId, mediaType.toLowerCase() as 'image' | 'video', extension)

      // Upload main file
      const uploadResult = await uploadFile(file.buffer, {
        folder: key.split('/').slice(0, -1).join('/'),
        filename: key.split('/').pop(),
        contentType: file.mimetype,
        isPublic: true,
      })

      // Get dimensions (for images)
      let width, height
      if (isImage) {
        const dimensions = await getImageDimensions(file.buffer)
        width = dimensions.width
        height = dimensions.height
      }

      // Generate thumbnail (for images)
      let thumbnailUrl
      if (isImage) {
        const thumbnailBuffer = await generateThumbnail(file.buffer)
        const thumbnailKey = key.replace(/\.[^.]+$/, '_thumb.jpg')
        const thumbnailResult = await uploadFile(thumbnailBuffer, {
          folder: thumbnailKey.split('/').slice(0, -1).join('/'),
          filename: thumbnailKey.split('/').pop(),
          contentType: 'image/jpeg',
          isPublic: true,
        })
        thumbnailUrl = thumbnailResult.url
      }

      // Save to database
      const media = await prisma.media.create({
        data: {
          userId,
          type: mediaType,
          url: uploadResult.url,
          thumbnailUrl,
          width,
          height,
          sizeBytes: BigInt(file.size),
          mimeType: file.mimetype,
        },
      })

      uploadResults.push({
        id: media.id,
        type: media.type.toLowerCase(),
        url: media.url,
        thumbnailUrl: media.thumbnailUrl,
        width: media.width,
        height: media.height,
        size: Number(media.sizeBytes),
        mimeType: media.mimeType,
        createdAt: media.createdAt,
      })

      logger.info(`Media uploaded: ${media.id} by user ${userId}`)
    }

    res.status(201).json({
      success: true,
      data: {
        media: uploadResults,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Get media info
 * @route   GET /api/v1/media/:id
 * @access  Private
 */
export async function getMedia(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!
    const mediaId = req.params.id

    const media = await prisma.media.findFirst({
      where: {
        id: mediaId,
        userId,
      },
    })

    if (!media) {
      throw new NotFoundError('Media')
    }

    res.json({
      success: true,
      data: {
        media: {
          id: media.id,
          type: media.type.toLowerCase(),
          url: media.url,
          thumbnailUrl: media.thumbnailUrl,
          width: media.width,
          height: media.height,
          size: Number(media.sizeBytes),
          mimeType: media.mimeType,
          duration: media.duration,
          createdAt: media.createdAt,
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Delete media
 * @route   DELETE /api/v1/media/:id
 * @access  Private
 */
export async function deleteMedia(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!
    const mediaId = req.params.id

    // Check ownership
    const media = await prisma.media.findFirst({
      where: {
        id: mediaId,
        userId,
      },
    })

    if (!media) {
      throw new NotFoundError('Media')
    }

    // Extract key from URL
    const url = new URL(media.url)
    const key = url.pathname.substring(1) // Remove leading /

    // Delete from R2
    await deleteFile(key)

    // Delete thumbnail if exists
    if (media.thumbnailUrl) {
      const thumbnailUrl = new URL(media.thumbnailUrl)
      const thumbnailKey = thumbnailUrl.pathname.substring(1)
      await deleteFile(thumbnailKey)
    }

    // Delete from database
    await prisma.media.delete({
      where: { id: mediaId },
    })

    logger.info(`Media deleted: ${mediaId}`)

    res.json({
      success: true,
      message: 'Media deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Get presigned URL for large file upload
 * @route   GET /api/v1/media/presigned-url/upload
 * @access  Private
 */
export async function getPresignedUploadUrl(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!
    const { filename, contentType, mediaType } = presignedUploadSchema.parse(req.query)

    const extension = getExtensionFromMime(contentType)
    const key = generateMediaKey(userId, mediaType, extension)

    const url = await getPresignedUrl(key, contentType, 3600) // 1 hour

    res.json({
      success: true,
      data: {
        uploadUrl: url,
        key,
        expiresIn: 3600,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @desc    Get presigned URL for private file download
 * @route   GET /api/v1/media/presigned-url/download/:id
 * @access  Private
 */
export async function getPresignedDownloadUrl(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!
    const mediaId = req.params.id

    // Verify ownership
    const media = await prisma.media.findFirst({
      where: {
        id: mediaId,
        userId,
      },
    })

    if (!media) {
      throw new NotFoundError('Media')
    }

    // If already public, return direct URL
    if (media.url.startsWith('http')) {
      return res.json({
        success: true,
        data: {
          downloadUrl: media.url,
        },
      })
    }

    // Otherwise generate presigned URL (for future private files)
    res.json({
      success: true,
      data: {
        downloadUrl: media.url,
      },
    })
  } catch (error) {
    next(error)
  }
}

