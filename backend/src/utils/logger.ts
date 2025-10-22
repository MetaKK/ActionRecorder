/**
 * Logger utility
 * 简单的日志工具（生产环境可替换为 winston/pino）
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LOG_LEVEL = (process.env.LOG_LEVEL || 'info') as LogLevel

const levels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

function shouldLog(level: LogLevel): boolean {
  return levels[level] >= levels[LOG_LEVEL]
}

function formatMessage(level: LogLevel, message: string, meta?: unknown): string {
  const timestamp = new Date().toISOString()
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : ''
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`
}

export const logger = {
  debug(message: string, meta?: unknown) {
    if (shouldLog('debug')) {
      console.debug(formatMessage('debug', message, meta))
    }
  },

  info(message: string, meta?: unknown) {
    if (shouldLog('info')) {
      console.info(formatMessage('info', message, meta))
    }
  },

  warn(message: string, meta?: unknown) {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message, meta))
    }
  },

  error(message: string, error?: unknown) {
    if (shouldLog('error')) {
      const errorDetails = error instanceof Error 
        ? { message: error.message, stack: error.stack }
        : error
      console.error(formatMessage('error', message, errorDetails))
    }
  },
}

