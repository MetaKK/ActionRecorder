/**
 * Diary Routes
 * AI日记相关路由
 */

import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { rateLimitMiddleware } from '../middleware/ratelimit.middleware'
import * as diaryController from '../controllers/diary.controller'

const router = Router()

// All routes require authentication
router.use(authMiddleware)
router.use(rateLimitMiddleware)

/**
 * @route   GET /api/v1/diaries
 * @desc    Get diaries list
 * @access  Private
 */
router.get('/', diaryController.getDiaries)

/**
 * @route   GET /api/v1/diaries/:id
 * @desc    Get single diary
 * @access  Private
 */
router.get('/:id', diaryController.getDiaryById)

/**
 * @route   GET /api/v1/diaries/date/:date
 * @desc    Get diaries by date (YYYY-MM-DD)
 * @access  Private
 */
router.get('/date/:date', diaryController.getDiariesByDate)

/**
 * @route   POST /api/v1/diaries
 * @desc    Create/Save diary
 * @access  Private
 */
router.post('/', diaryController.createDiary)

/**
 * @route   PUT /api/v1/diaries/:id
 * @desc    Update diary
 * @access  Private
 */
router.put('/:id', diaryController.updateDiary)

/**
 * @route   DELETE /api/v1/diaries/:id
 * @desc    Delete diary (soft delete)
 * @access  Private
 */
router.delete('/:id', diaryController.deleteDiary)

/**
 * @route   GET /api/v1/diaries/stats/summary
 * @desc    Get diary statistics
 * @access  Private
 */
router.get('/stats/summary', diaryController.getDiaryStats)

export default router

