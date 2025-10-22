/**
 * Authentication Routes
 * 用户注册、登录、登出
 */

import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import * as authController from '../controllers/auth.controller'

const router = Router()

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authController.register)

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authController.login)

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authMiddleware, authController.logout)

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authMiddleware, authController.getCurrentUser)

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authMiddleware, authController.updateProfile)

/**
 * @route   PUT /api/v1/auth/password
 * @desc    Change password
 * @access  Private
 */
router.put('/password', authMiddleware, authController.changePassword)

export default router

