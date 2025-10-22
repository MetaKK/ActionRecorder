/**
 * Media Routes
 * 媒体文件上传、下载、删除
 */

import { Router } from 'express'
import multer from 'multer'
import { authMiddleware } from '../middleware/auth.middleware'
import * as mediaController from '../controllers/media.controller'

const router = Router()

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
    files: parseInt(process.env.MAX_FILES_PER_REQUEST || '10'),
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'audio/webm',
      'audio/mp4',
      'audio/mpeg',
      'audio/wav',
    ]

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`))
    }
  },
})

// All routes require authentication
router.use(authMiddleware)

/**
 * @route   POST /api/v1/media/upload
 * @desc    Upload media file(s)
 * @access  Private
 */
router.post('/upload', upload.array('files', 10), mediaController.uploadMedia)

/**
 * @route   GET /api/v1/media/:id
 * @desc    Get media info
 * @access  Private
 */
router.get('/:id', mediaController.getMedia)

/**
 * @route   DELETE /api/v1/media/:id
 * @desc    Delete media
 * @access  Private
 */
router.delete('/:id', mediaController.deleteMedia)

/**
 * @route   GET /api/v1/media/presigned-url/upload
 * @desc    Get presigned URL for large file upload
 * @access  Private
 */
router.get('/presigned-url/upload', mediaController.getPresignedUploadUrl)

/**
 * @route   GET /api/v1/media/presigned-url/download/:id
 * @desc    Get presigned URL for private file download
 * @access  Private
 */
router.get('/presigned-url/download/:id', mediaController.getPresignedDownloadUrl)

export default router

