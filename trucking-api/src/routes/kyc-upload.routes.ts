import { Router, Request, Response } from 'express'
import multer from 'multer'
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware'
import { asyncHandler } from '../middleware/error.middleware'
import { supabaseServiceRole } from '../utils/supabase'
import { logger } from '../utils/logger'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// Multer config: store in memory, max 5MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Only JPEG, PNG, WebP, and PDF files are allowed'))
  },
})

const BUCKET_NAME = 'kyc-documents'

// ========== UPLOAD KYC DOCUMENT ==========
router.post('/upload',
  authMiddleware,
  upload.single('document'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const file = req.file
    if (!file) {
      res.status(400).json({ success: false, message: 'No file uploaded' })
      return
    }

    const userId = req.user!.userId
    const { document_type, document_key } = req.body
    // document_type: 'cnic_front', 'cnic_back', 'license', 'vehicle_registration', etc.
    // document_key: optional identifier

    const ext = file.originalname.split('.').pop() || 'jpg'
    const fileName = `${userId}/${document_type || 'document'}_${uuidv4().slice(0, 8)}.${ext}`

    try {
      if (!supabaseServiceRole) {
        throw new Error('Supabase not configured')
      }

      // Ensure bucket exists (idempotent)
      const { data: buckets } = await supabaseServiceRole.storage.listBuckets()
      const bucketExists = buckets?.some(b => b.name === BUCKET_NAME)
      if (!bucketExists) {
        await supabaseServiceRole.storage.createBucket(BUCKET_NAME, {
          public: false,
          fileSizeLimit: 5 * 1024 * 1024,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
        })
        logger.info(`📁 Created storage bucket: ${BUCKET_NAME}`)
      }

      // Upload to Supabase Storage
      const { data, error } = await supabaseServiceRole.storage
        .from(BUCKET_NAME)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        })

      if (error) throw error

      // Get signed URL (valid for 1 hour)
      const { data: urlData } = await supabaseServiceRole.storage
        .from(BUCKET_NAME)
        .createSignedUrl(fileName, 3600)

      // Store document reference in database
      await supabaseServiceRole.from('kyc_documents').upsert({
        id: uuidv4(),
        user_id: userId,
        document_type: document_type || 'other',
        document_key: document_key || null,
        file_path: fileName,
        file_name: file.originalname,
        file_size: file.size,
        mime_type: file.mimetype,
        status: 'pending_review',
        uploaded_at: new Date().toISOString(),
      })

      logger.info(`📄 KYC document uploaded: ${fileName} by ${userId}`)

      res.json({
        success: true,
        data: {
          file_path: fileName,
          file_name: file.originalname,
          file_size: file.size,
          signed_url: urlData?.signedUrl || null,
          document_type,
          status: 'pending_review',
        },
      })
    } catch (err: any) {
      logger.error(`❌ KYC upload failed: ${err.message}`)
      res.status(500).json({ success: false, message: `Upload failed: ${err.message}` })
    }
  })
)

// ========== GET USER'S KYC DOCUMENTS ==========
router.get('/documents', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId

  try {
    if (!supabaseServiceRole) throw new Error('Supabase not configured')

    const { data, error } = await supabaseServiceRole
      .from('kyc_documents')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false })

    if (error) throw error

    // Generate fresh signed URLs
    const withUrls = await Promise.all((data || []).map(async (doc: any) => {
      const { data: urlData } = await supabaseServiceRole!.storage
        .from(BUCKET_NAME)
        .createSignedUrl(doc.file_path, 3600)
      return { ...doc, signed_url: urlData?.signedUrl || null }
    }))

    res.json({ success: true, data: withUrls })
  } catch (err: any) {
    logger.error(`❌ KYC documents fetch failed: ${err.message}`)
    res.status(500).json({ success: false, message: err.message })
  }
}))

// ========== ADMIN: GET ALL PENDING KYC ==========
router.get('/pending', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseServiceRole) throw new Error('Supabase not configured')

    const { data, error } = await supabaseServiceRole
      .from('kyc_documents')
      .select('*, profiles:user_id(first_name, last_name, email, phone)')
      .eq('status', 'pending_review')
      .order('uploaded_at', { ascending: false })

    if (error) throw error
    res.json({ success: true, data: data || [] })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message })
  }
}))

// ========== ADMIN: APPROVE/REJECT KYC ==========
router.put('/:documentId/review', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const documentId = String(req.params.documentId)
  const { status, rejection_reason } = req.body // status: 'approved' | 'rejected'

  try {
    if (!supabaseServiceRole) throw new Error('Supabase not configured')

    const { error } = await supabaseServiceRole
      .from('kyc_documents')
      .update({
        status,
        rejection_reason: rejection_reason || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: req.user!.userId,
      })
      .eq('id', documentId)

    if (error) throw error

    logger.info(`📋 KYC ${documentId} ${status} by ${req.user!.userId}`)
    res.json({ success: true, message: `Document ${status}` })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message })
  }
}))

export default router
