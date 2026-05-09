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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Only JPEG, PNG, WebP, and PDF files are allowed'))
  },
})

const verifiedBuckets = new Set<string>()

async function ensureBucket(bucketName: string, isPublic: boolean = true) {
  if (verifiedBuckets.has(bucketName)) return
  
  if (!supabaseServiceRole) {
    logger.error('❌ Supabase service role key is missing')
    throw new Error('Supabase not configured')
  }

  try {
    const { data: buckets, error } = await supabaseServiceRole.storage.listBuckets()
    if (error) {
      logger.error(`❌ Failed to list Supabase buckets: ${error.message}`)
      // Don't throw here, try to create anyway or assume it exists
    }

    const exists = buckets?.some((b: any) => b.name === bucketName)
    if (!exists) {
      logger.info(`📁 Creating storage bucket: ${bucketName}...`)
      const { error: createError } = await supabaseServiceRole.storage.createBucket(bucketName, {
        public: isPublic,
        fileSizeLimit: 10 * 1024 * 1024,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      })
      if (createError && !createError.message.includes('already exists')) {
        logger.error(`❌ Failed to create bucket ${bucketName}: ${createError.message}`)
        throw createError
      }
    }
    
    verifiedBuckets.add(bucketName)
    logger.info(`✅ Storage bucket verified: ${bucketName}`)
  } catch (err: any) {
    logger.error(`⚠️ ensureBucket error for ${bucketName}: ${err.message}`)
    // If we can't verify, we'll try to upload anyway and let Supabase handle the error
  }
}

// ========== UPLOAD TRUCK PHOTO ==========
router.post('/truck-photo',
  authMiddleware,
  upload.single('file'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const file = req.file
    if (!file) {
      res.status(400).json({ success: false, message: 'No file uploaded' })
      return
    }

    const userId = req.user!.userId
    const { photo_key } = req.body // 'front', 'back', 'interior', 'exterior'
    const bucketName = 'truck-images'

    try {
      if (!supabaseServiceRole) throw new Error('Supabase not configured')

      await ensureBucket(bucketName, true)

      const ext = file.originalname.split('.').pop() || 'jpg'
      const fileName = `${userId}/${Date.now()}-${photo_key || 'photo'}.${ext}`

      const { data, error } = await supabaseServiceRole.storage
        .from(bucketName)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        })

      if (error) throw error

      // Get public URL
      const { data: urlData } = supabaseServiceRole.storage
        .from(bucketName)
        .getPublicUrl(fileName)

      logger.info(`📸 Truck photo uploaded: ${fileName} by ${userId}`)

      res.json({
        success: true,
        data: {
          file_path: fileName,
          public_url: urlData?.publicUrl || '',
          photo_key: photo_key || 'photo',
        },
      })
    } catch (err: any) {
      logger.error(`❌ Truck photo upload failed: ${err.message}`)
      res.status(500).json({ success: false, message: `Upload failed: ${err.message}` })
    }
  })
)

// ========== UPLOAD TRUCK DOCUMENT ==========
router.post('/truck-document',
  authMiddleware,
  upload.single('file'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const file = req.file
    if (!file) {
      res.status(400).json({ success: false, message: 'No file uploaded' })
      return
    }

    const userId = req.user!.userId
    const { document_key } = req.body // 'registration', 'fitness', 'route', 'insurance'
    const bucketName = 'truck-documents'

    try {
      if (!supabaseServiceRole) throw new Error('Supabase not configured')

      await ensureBucket(bucketName, false)

      const ext = file.originalname.split('.').pop() || 'pdf'
      const fileName = `${userId}/${Date.now()}-${document_key || 'doc'}.${ext}`

      const { data, error } = await supabaseServiceRole.storage
        .from(bucketName)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        })

      if (error) throw error

      // For documents, create a signed URL (valid 1 year) since bucket is private
      const { data: urlData } = await supabaseServiceRole.storage
        .from(bucketName)
        .createSignedUrl(fileName, 365 * 24 * 3600) // 1 year

      // Also get public URL as fallback
      const { data: publicUrlData } = supabaseServiceRole.storage
        .from(bucketName)
        .getPublicUrl(fileName)

      logger.info(`📄 Truck document uploaded: ${fileName} by ${userId}`)

      res.json({
        success: true,
        data: {
          file_path: fileName,
          public_url: publicUrlData?.publicUrl || '',
          signed_url: urlData?.signedUrl || '',
          document_key: document_key || 'document',
        },
      })
    } catch (err: any) {
      logger.error(`❌ Truck document upload failed: ${err.message}`)
      res.status(500).json({ success: false, message: `Upload failed: ${err.message}` })
    }
  })
)

export default router
