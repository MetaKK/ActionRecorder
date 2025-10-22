/**
 * Life Recorder Backend Server
 * Express + TypeScript
 */

import express, { Application, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import dotenv from 'dotenv'

// Routes
import authRoutes from './routes/auth.routes'
import recordRoutes from './routes/record.routes'
import diaryRoutes from './routes/diary.routes'
import mediaRoutes from './routes/media.routes'
import syncRoutes from './routes/sync.routes'
import aiRoutes from './routes/ai.routes'

// Middleware
import { errorHandler } from './middleware/error.middleware'
import { notFoundHandler } from './middleware/notfound.middleware'

// Utils
import { logger } from './utils/logger'
import { connectDB } from './utils/database'

// Load environment variables
dotenv.config()

const app: Application = express()
const PORT = process.env.PORT || 4000

// ============================================
// Middleware
// ============================================

// Security
app.use(helmet())

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}))

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Compression
app.use(compression())

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined'))
}

// ============================================
// Health Check
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  })
})

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Life Recorder API',
    version: '1.0.0',
    documentation: '/api/docs',
  })
})

// ============================================
// API Routes
// ============================================

const API_PREFIX = '/api/v1'

app.use(`${API_PREFIX}/auth`, authRoutes)
app.use(`${API_PREFIX}/records`, recordRoutes)
app.use(`${API_PREFIX}/diaries`, diaryRoutes)
app.use(`${API_PREFIX}/media`, mediaRoutes)
app.use(`${API_PREFIX}/sync`, syncRoutes)
app.use(`${API_PREFIX}/ai`, aiRoutes)

// ============================================
// Error Handling
// ============================================

app.use(notFoundHandler)
app.use(errorHandler)

// ============================================
// Start Server
// ============================================

async function startServer() {
  try {
    // Connect to database
    await connectDB()
    
    // Start listening
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`)
      logger.info(`📝 Environment: ${process.env.NODE_ENV}`)
      logger.info(`🔗 API: http://localhost:${PORT}${API_PREFIX}`)
    })
  } catch (error) {
    logger.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...')
  process.exit(0)
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...')
  process.exit(0)
})

// Start the server
startServer()

export default app

