import { Request, Response } from 'express'
import multer, { Multer } from 'multer'
import { kycService } from '../services/kyc.service'
import { logger } from '../utils/logger'

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Accept images and PDFs
    if (file.mimetype.match(/^(image|application\/pdf)/)) {
      cb(null, true)
    } else {
      cb(new Error('Only image and PDF files are allowed'))
    }
  },
})

/**
 * Upload KYC document
 */
export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId
    const { documentType, documentKey } = req.body

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    if (!documentType) {
      return res.status(400).json({
        success: false,
        error: 'Document type is required',
      })
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'File is required',
      })
    }

    const document = await kycService.uploadDocument(
      userId,
      documentType,
      documentKey,
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    )

    res.json({
      success: true,
      data: document,
      message: 'Document uploaded successfully',
    })
  } catch (error: any) {
    logger.error('Error uploading KYC document:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload document',
    })
  }
}

/**
 * Get user's KYC documents
 */
export const getUserDocuments = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    const userDocs = await kycService.getDocumentsByUser(userId)

    res.json({
      success: true,
      data: userDocs,
    })
  } catch (error) {
    logger.error('Error fetching user documents:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch documents',
    })
  }
}

/**
 * Get pending documents for admin
 */
export const getPendingDocuments = async (req: Request, res: Response) => {
  try {
    const limitParam = Array.isArray(req.query.limit) ? req.query.limit[0] : (req.query.limit || '50')
    const limit = parseInt(limitParam as string)
    const documents = await kycService.getPendingDocuments(limit)

    res.json({
      success: true,
      data: documents,
    })
  } catch (error: any) {
    logger.error('Error fetching pending documents:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending documents',
      details: error?.message,
    })
  }
}

/**
 * Delete document
 */
export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const documentId = Array.isArray(req.params.documentId) ? req.params.documentId[0] : req.params.documentId
    const userId = (req as any).user?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    // Get document to check ownership
    const doc = await kycService.getDocument(documentId)
    if (doc?.user_id !== userId && (req as any).user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
      })
    }

    const result = await kycService.deleteDocument(documentId)

    res.json({
      success: true,
      data: result,
      message: 'Document deleted successfully',
    })
  } catch (error) {
    logger.error('Error deleting document:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete document',
    })
  }
}

export { upload as kycUpload }
