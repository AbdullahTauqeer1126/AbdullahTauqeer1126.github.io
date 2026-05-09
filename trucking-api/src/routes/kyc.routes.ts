import express, { Router } from 'express'
import * as kycController from '../controllers/kyc.controller'
import { authMiddleware, authorize } from '../middleware/auth.middleware'

const router: Router = express.Router()

// All KYC routes require authentication
router.use(authMiddleware)

/**
 * POST /api/kyc/upload - Upload KYC document
 */
router.post('/upload', kycController.kycUpload.single('document'), kycController.uploadDocument)

/**
 * GET /api/kyc/documents - Get user's KYC documents
 */
router.get('/documents', kycController.getUserDocuments)

/**
 * GET /api/kyc/pending - Get pending documents for admin
 */
router.get('/pending', authorize(['admin']), kycController.getPendingDocuments)

/**
 * DELETE /api/kyc/:documentId - Delete KYC document
 */
router.delete('/:documentId', kycController.deleteDocument)

export default router
