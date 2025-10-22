/**
 * Storage Service
 * Cloudflare R2 (S3-compatible) object storage
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'
import { logger } from '../utils/logger'
import { ApiError } from '../utils/errors'

// Initialize S3 client for R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = process.env.R2_BUCKET_NAME || ''
const PUBLIC_URL = process.env.R2_PUBLIC_URL || ''

export interface UploadOptions {
  folder?: string       // 文件夹路径
  filename?: string     // 自定义文件名
  contentType?: string  // MIME类型
  isPublic?: boolean    // 是否公开访问
}

export interface UploadResult {
  key: string           // S3 Key
  url: string           // 公开访问URL
  size: number          // 文件大小
  etag?: string         // ETag
}

/**
 * Upload file to R2
 */
export async function uploadFile(
  buffer: Buffer,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    const {
      folder = 'files',
      filename,
      contentType = 'application/octet-stream',
      isPublic = true,
    } = options

    // Generate unique filename if not provided
    const ext = filename ? filename.split('.').pop() : 'bin'
    const key = filename 
      ? `${folder}/${filename}`
      : `${folder}/${uuidv4()}.${ext}`

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ...(isPublic && { ACL: 'public-read' }),
    })

    const result = await s3Client.send(command)

    const url = `${PUBLIC_URL}/${key}`

    logger.info(`File uploaded to R2: ${key}`)

    return {
      key,
      url,
      size: buffer.length,
      etag: result.ETag,
    }
  } catch (error) {
    logger.error('Failed to upload file to R2:', error)
    throw new ApiError(500, 'File upload failed')
  }
}

/**
 * Get presigned URL for upload (for large files)
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600 // 1 hour
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    })

    const url = await getSignedUrl(s3Client, command, { expiresIn })

    return url
  } catch (error) {
    logger.error('Failed to generate presigned URL:', error)
    throw new ApiError(500, 'Failed to generate upload URL')
  }
}

/**
 * Get presigned URL for download (for private files)
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    const url = await getSignedUrl(s3Client, command, { expiresIn })

    return url
  } catch (error) {
    logger.error('Failed to generate download URL:', error)
    throw new ApiError(500, 'Failed to generate download URL')
  }
}

/**
 * Delete file from R2
 */
export async function deleteFile(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    await s3Client.send(command)

    logger.info(`File deleted from R2: ${key}`)
  } catch (error) {
    logger.error('Failed to delete file from R2:', error)
    throw new ApiError(500, 'File deletion failed')
  }
}

/**
 * Check if file exists
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    await s3Client.send(command)
    return true
  } catch {
    return false
  }
}

/**
 * Get file metadata
 */
export async function getFileMetadata(key: string) {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    const response = await s3Client.send(command)

    return {
      contentType: response.ContentType,
      contentLength: response.ContentLength,
      lastModified: response.LastModified,
      etag: response.ETag,
    }
  } catch (error) {
    logger.error('Failed to get file metadata:', error)
    throw new ApiError(404, 'File not found')
  }
}

/**
 * Generate unique key for media
 */
export function generateMediaKey(
  userId: string,
  type: 'image' | 'video' | 'audio',
  extension: string
): string {
  const folder = `media/${userId}/${type}s`
  const filename = `${uuidv4()}.${extension}`
  return `${folder}/${filename}`
}

