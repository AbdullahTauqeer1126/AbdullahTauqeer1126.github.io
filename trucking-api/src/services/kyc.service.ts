import supabase, { supabaseServiceRole } from '../utils/supabase'
import { logger } from '../utils/logger'

export class KYCService {
  private readonly BUCKET_NAME = 'kyc-documents'
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  private readonly SIGNED_URL_TTL_SECONDS = 60 * 60

  private inferDocumentKey(documentType: string, documentKey?: string) {
    if (documentKey) return documentKey
    if (documentType === 'driving_license') return 'license'
    if (documentType === 'business_registration') return 'license'
    if (documentType === 'id_card') return 'cnicFront'
    return 'document'
  }

  private requiredDocumentKeysForRole(role?: string) {
    switch ((role || '').toLowerCase()) {
      case 'driver':
        return ['cnicFront', 'cnicBack', 'license']
      case 'fleet_owner':
        return ['cnicFront', 'cnicBack', 'license']
      default:
        return []
    }
  }

  private async createSignedDocumentUrl(filePath?: string | null) {
    if (!filePath) return null

    const { data, error } = await (supabaseServiceRole || supabase)
      .storage
      .from(this.BUCKET_NAME)
      .createSignedUrl(filePath, this.SIGNED_URL_TTL_SECONDS)

    if (error) {
      logger.warn(`KYC signed URL generation failed for ${filePath}`)
      return null
    }

    return data?.signedUrl || null
  }

  private async hydrateDocument<T extends Record<string, any>>(document: T) {
    const preview_url = await this.createSignedDocumentUrl(document.file_path)
    return {
      ...document,
      preview_url,
      is_pdf: String(document.mime_type || '').includes('pdf'),
    }
  }

  async syncUserKycState(userId: string) {
    const client = supabaseServiceRole || supabase

    const [{ data: user, error: userError }, { data: documents, error: docsError }] = await Promise.all([
      client.from('users').select('role').eq('id', userId).single(),
      client
        .from('kyc_documents')
        .select('document_key, status, rejection_reason, file_path, mime_type, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
    ])

    if (userError) throw userError
    if (docsError) throw docsError

    const latestByKey = new Map<string, any>()
    for (const document of documents || []) {
      if (document.document_key && !latestByKey.has(document.document_key)) {
        latestByKey.set(document.document_key, document)
      }
    }

    const kycDocs: Record<string, string> = {}
    for (const [key, document] of latestByKey.entries()) {
      const signedUrl = await this.createSignedDocumentUrl(document.file_path)
      if (signedUrl) kycDocs[key] = signedUrl
    }

    const requiredKeys = this.requiredDocumentKeysForRole(user?.role)
    const requiredDocs = requiredKeys.map((key) => latestByKey.get(key)).filter(Boolean)

    let kyc_status = 'NONE'
    let kyc_verified = false

    if ((documents || []).length > 0) {
      kyc_status = 'PENDING'
    }
    if (requiredDocs.some((document) => document.status === 'REJECTED')) {
      kyc_status = 'REJECTED'
    } else if (requiredKeys.length > 0 && requiredKeys.every((key) => latestByKey.get(key)?.status === 'APPROVED')) {
      kyc_status = 'VERIFIED'
      kyc_verified = true
    } else if (requiredDocs.some((document) => document.status === 'PENDING')) {
      kyc_status = 'PENDING'
    }

    await client
      .from('users')
      .update({
        kyc_docs: kycDocs,
        kyc_status,
        kyc_verified,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    return { kyc_docs: kycDocs, kyc_status, kyc_verified }
  }

  /**
   * Initialize KYC bucket if needed
   */
  async initializeBucket() {
    try {
      const { data, error } = await (supabaseServiceRole || supabase)
        .storage
        .listBuckets()

      if (error) throw error

      const bucketExists = data?.some((b: any) => b.name === this.BUCKET_NAME)

      if (!bucketExists) {
        const { error: createError } = await (supabaseServiceRole || supabase)
          .storage
          .createBucket(this.BUCKET_NAME, {
            public: false,
          })

        if (createError) throw createError
        logger.info(`✅ Created ${this.BUCKET_NAME} bucket`)
      }
    } catch (error) {
      logger.error('Error initializing KYC bucket:', error)
    }
  }

  /**
   * Upload KYC document
   */
  async uploadDocument(
    userId: string,
    documentType: string,
    documentKey: string | undefined,
    file: Buffer,
    fileName: string,
    mimeType: string
  ) {
    try {
      await this.initializeBucket()

      // Validate file size
      if (file.length > this.MAX_FILE_SIZE) {
        throw new Error('File size exceeds 10MB limit')
      }

      // Create unique file path
      const timestamp = Date.now()
      const filePath = `${userId}/${documentType}/${timestamp}-${fileName}`
      const resolvedDocumentKey = this.inferDocumentKey(documentType, documentKey)

      // Upload to Supabase Storage
      const { error } = await (supabaseServiceRole || supabase)
        .storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          contentType: mimeType || 'application/octet-stream',
          upsert: false,
        })

      if (error) throw error

      const documentUrl = await this.createSignedDocumentUrl(filePath)
      const documentUrlForDb =
        documentUrl && documentUrl.length <= 500
          ? documentUrl
          : filePath

      // Save metadata to database
      const { data: dbData, error: dbError } = await (supabaseServiceRole || supabase)
        .from('kyc_documents')
        .insert([
          {
            user_id: userId,
            document_type: documentType,
            document_key: resolvedDocumentKey,
            file_name: fileName,
            file_path: filePath,
            mime_type: mimeType,
            document_url: documentUrlForDb,
            status: 'PENDING',
          },
        ])
        .select('id, document_type, document_key, file_name, mime_type, status, created_at')
        .single()

      if (dbError) throw dbError

      await this.syncUserKycState(userId)

      logger.info(`✅ KYC document uploaded for user ${userId}`)
      return {
        id: dbData.id,
        document_type: dbData.document_type,
        document_key: dbData.document_key,
        file_name: dbData.file_name,
        mime_type: dbData.mime_type,
        document_url: documentUrl,
        status: dbData.status,
        created_at: dbData.created_at,
      }
    } catch (error) {
      logger.error('Error uploading KYC document:', error)
      throw error
    }
  }

  /**
   * Get document by ID
   */
  async getDocument(documentId: string) {
    try {
      const { data, error } = await (supabaseServiceRole || supabase)
        .from('kyc_documents')
        .select(
          `
          id,
          user_id,
          document_type,
          document_key,
          file_name,
          file_path,
          mime_type,
          document_number,
          document_url,
          status,
          rejection_reason,
          verified_by,
          verified_at,
          created_at
        `
        )
        .eq('id', documentId)
        .single()

      if (error) throw error
      return await this.hydrateDocument(data)
    } catch (error) {
      logger.error('Error fetching document:', error)
      throw error
    }
  }

  /**
   * Delete document from storage
   */
  async deleteDocument(documentId: string) {
    try {
      // Get document URL first
      const doc = await this.getDocument(documentId)
      if (!doc?.file_path) throw new Error('Document not found')

      // Delete from storage
      const { error: storageError } = await (supabaseServiceRole || supabase)
        .storage
        .from(this.BUCKET_NAME)
        .remove([doc.file_path])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await (supabaseServiceRole || supabase)
        .from('kyc_documents')
        .delete()
        .eq('id', documentId)

      if (dbError) throw dbError

      await this.syncUserKycState(doc.user_id)

      logger.info(`✅ KYC document deleted: ${documentId}`)
      return { success: true }
    } catch (error) {
      logger.error('Error deleting document:', error)
      throw error
    }
  }

  /**
   * Get pending KYC documents for admin
   */
  async getPendingDocuments(limit: number = 50) {
    try {
      const { data, error } = await (supabaseServiceRole || supabase)
        .from('kyc_documents')
        .select(
          `
          id,
          user_id,
          document_type,
          document_key,
          file_name,
          file_path,
          mime_type,
          document_url,
          status,
          created_at,
          users!kyc_documents_user_id_fkey (
            email,
            first_name,
            last_name,
            phone,
            role
          )
        `
        )
        .eq('status', 'PENDING')
        .order('created_at', { ascending: true })
        .limit(limit)

      if (error) throw error
      return await Promise.all((data || []).map((document: any) => this.hydrateDocument(document)))
    } catch (error) {
      logger.error('Error fetching pending documents:', error)
      throw error
    }
  }

  async getDocumentsByUser(userId: string) {
    try {
      const { data, error } = await (supabaseServiceRole || supabase)
        .from('kyc_documents')
        .select('id, user_id, document_type, document_key, file_name, file_path, mime_type, document_number, document_url, status, rejection_reason, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return await Promise.all((data || []).map((document: any) => this.hydrateDocument(document)))
    } catch (error) {
      logger.error('Error fetching user KYC documents:', error)
      throw error
    }
  }

  /**
   * Update document number (like ID card number)
   */
  async updateDocumentNumber(documentId: string, documentNumber: string) {
    try {
      const { data, error } = await (supabaseServiceRole || supabase)
        .from('kyc_documents')
        .update({
          document_number: documentNumber,
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId)
        .select('id, document_number')
        .single()

      if (error) throw error
      return data
    } catch (error) {
      logger.error('Error updating document number:', error)
      throw error
    }
  }
}

export const kycService = new KYCService()
