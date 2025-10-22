/**
 * Sync Routes
 * 数据同步路由
 */

import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import * as syncController from '../controllers/sync.controller'

const router = Router()

// All routes require authentication
router.use(authMiddleware)

/**
 * @route   POST /api/v1/sync/pull
 * @desc    Pull data from server
 * @access  Private
 */
router.post('/pull', syncController.pullData)

/**
 * @route   POST /api/v1/sync/push
 * @desc    Push data to server
 * @access  Private
 */
router.post('/push', syncController.pushData)

/**
 * @route   GET /api/v1/sync/status
 * @desc    Get sync status
 * @access  Private
 */
router.get('/status', syncController.getSyncStatus)

/**
 * @route   POST /api/v1/sync/resolve-conflict
 * @desc    Resolve sync conflict
 * @access  Private
 */
router.post('/resolve-conflict', syncController.resolveConflict)

export default router

