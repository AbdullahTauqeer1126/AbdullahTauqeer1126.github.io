import { Router, Request, Response } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()
router.use(authMiddleware)

type DisputeRecord = {
  id: string
  booking_id: string
  complaint_type: string
  description?: string
  status: 'open' | 'investigating' | 'resolved'
  resolution?: string
  compensation_amount?: number
  created_by: string
  created_at: string
  updated_at: string
}

const disputes = new Map<string, DisputeRecord>()

// POST /api/disputes — File a dispute
router.post('/', (req: Request, res: Response) => {
  const { booking_id, complaint_type, description } = req.body
  const createdBy = (req as any).user?.userId
  if (!createdBy) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }
  if (!booking_id || !complaint_type) {
    return res.status(400).json({ success: false, message: 'booking_id and complaint_type are required' })
  }

  const now = new Date().toISOString()
  const record: DisputeRecord = {
    id: `DSP-${Date.now()}`,
    booking_id,
    complaint_type,
    description,
    status: 'open',
    created_by: createdBy,
    created_at: now,
    updated_at: now,
  }
  disputes.set(record.id, record)

  res.status(201).json({ success: true, message: 'Dispute filed successfully', data: record })
})

// GET /api/disputes — List user's disputes
router.get('/', (req: Request, res: Response) => {
  const userId = (req as any).user?.userId
  const role = String((req as any).user?.role || '').toLowerCase()
  const all = Array.from(disputes.values()).sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
  const filtered = role === 'admin' ? all : all.filter((d) => d.created_by === userId)
  res.json({ success: true, message: 'Disputes retrieved', data: filtered })
})

// GET /api/disputes/:id
router.get('/:id', (req: Request, res: Response) => {
  const disputeId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  const userId = (req as any).user?.userId
  const role = String((req as any).user?.role || '').toLowerCase()
  const item = disputes.get(disputeId)
  if (!item) return res.status(404).json({ success: false, message: 'Dispute not found' })
  if (role !== 'admin' && item.created_by !== userId) {
    return res.status(403).json({ success: false, message: 'Forbidden' })
  }
  res.json({ success: true, message: 'Dispute details', data: item })
})

// PUT /api/disputes/:id/resolve — Admin resolves
router.put('/:id/resolve', (req: Request, res: Response) => {
  const disputeId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  const role = String((req as any).user?.role || '').toLowerCase()
  if (role !== 'admin') return res.status(403).json({ success: false, message: 'Only admin can resolve disputes' })
  const { resolution, compensation_amount } = req.body
  const item = disputes.get(disputeId)
  if (!item) return res.status(404).json({ success: false, message: 'Dispute not found' })
  const updated: DisputeRecord = {
    ...item,
    status: 'resolved',
    resolution,
    compensation_amount,
    updated_at: new Date().toISOString(),
  }
  disputes.set(disputeId, updated)
  res.json({ success: true, message: 'Dispute resolved', data: updated })
})

// PUT /api/disputes/:id/comment
router.put('/:id/comment', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Comment added to dispute', data: null })
})

export const disputeRoutes = router
