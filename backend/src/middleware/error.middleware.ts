/**
 * Error handling middleware
 */

import { Request, Response, NextFunction } from 'express'
import { ApiError } from '../utils/errors'
import { logger } from '../utils/logger'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  logger.error('Error occurred:', error)

  // API Error
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.name,
        message: error.message,
        details: error.details,
      },
    })
  }

  // Zod Validation Error
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: error.errors,
      },
    })
  }

  // Prisma Errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Resource already exists',
          details: error.meta,
        },
      })
    }

    // Record not found
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found',
        },
      })
    }

    // Foreign key constraint violation
    if (error.code === 'P2003') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REFERENCE',
          message: 'Invalid reference',
          details: error.meta,
        },
      })
    }
  }

  // Generic Prisma Error
  if (error instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid data format',
      },
    })
  }

  // JWT Errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
      },
    })
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token expired',
      },
    })
  }

  // Generic Error
  const statusCode = 500
  res.status(statusCode).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
  })
}

