/**
 * Record Routes
 * 生活记录相关路由
 */

import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { rateLimitMiddleware } from '../middleware/ratelimit.middleware'
import * as recordController from '../controllers/record.controller'

const router = Router()

// 所有路由都需要认证
router.use(authMiddleware)
router.use(rateLimitMiddleware)

/**
 * @route   GET /api/v1/records
 * @desc    Get records list (with pagination)
 * @access  Private
 */
router.get('/', recordController.getRecords)

/**
 * @route   GET /api/v1/records/:id
 * @desc    Get single record
 * @access  Private
 */
router.get('/:id', recordController.getRecordById)

/**
 * @route   POST /api/v1/records
 * @desc    Create new record
 * @access  Private
 */
router.post('/', recordController.createRecord)

/**
 * @route   PUT /api/v1/records/:id
 * @desc    Update record
 * @access  Private
 */
router.put('/:id', recordController.updateRecord)

/**
 * @route   DELETE /api/v1/records/:id
 * @desc    Delete record
 * @access  Private
 */
router.delete('/:id', recordController.deleteRecord)

/**
 * @route   POST /api/v1/records/batch
 * @desc    Batch create records (for migration)
 * @access  Private
 */
router.post('/batch', recordController.batchCreateRecords)

/**
 * @route   GET /api/v1/records/date-range
 * @desc    Get records by date range
 * @access  Private
 */
router.get('/filter/date-range', recordController.getRecordsByDateRange)

export default router

