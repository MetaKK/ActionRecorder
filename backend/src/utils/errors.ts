/**
 * 自定义错误类
 */

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(400, message, details)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication failed') {
    super(401, message)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends ApiError {
  constructor(message = 'Insufficient permissions') {
    super(403, message)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(404, `${resource} not found`)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, message)
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends ApiError {
  constructor(retryAfter?: number) {
    super(429, 'Too many requests', { retryAfter })
    this.name = 'RateLimitError'
  }
}

