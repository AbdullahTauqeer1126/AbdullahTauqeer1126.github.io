import { Router, Request, Response } from 'express'
import { authMiddleware, authorize } from '../middleware/auth.middleware'
import * as userController from '../controllers/user.controller'

const router = Router()
router.use(authMiddleware)

// GET /api/users - Get all users (admin and fleet owners can see these)
router.get('/', authorize(['admin', 'fleet_owner']), userController.getAllUsers)

// GET /api/users/role/:role - Get users by role
router.get('/role/:role', authorize(['admin']), userController.getUsersByRole)

// GET /api/users/me - Get current user profile
router.get('/me', userController.getUserProfile)

// GET /api/users/kyc/pending - Get pending KYC documents (admin only)
router.get('/kyc/pending', authorize(['admin']), userController.getKYCDocumentsForReview)

// GET /api/users/:userId/kyc - Get KYC documents for user
router.get('/:userId/kyc', authorize(['admin']), userController.getUserKYCDocuments)

// POST /api/users/kyc/approve/:documentId - Approve KYC (admin only)
router.post('/kyc/approve/:documentId', authorize(['admin']), userController.approveKYCDocument)

// POST /api/users/kyc/reject/:documentId - Reject KYC (admin only)
router.post('/kyc/reject/:documentId', authorize(['admin']), userController.rejectKYCDocument)

// POST /api/users/:userId/wallet - Update wallet balance (admin only)
router.post('/:userId/wallet', authorize(['admin']), userController.updateWalletBalance)

// PUT /api/users/me
router.put('/me', userController.updateUserProfile)

// Compatibility aliases used by frontend client
router.get('/profile', userController.getUserProfile)
router.put('/profile', userController.updateUserProfile)

// GET /api/users/:id/profile
router.get('/:id/profile', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Public profile',
    data: {
      id: req.params.id,
      first_name: 'User',
      role: 'customer',
      average_rating: 4.5,
      total_trips: 120,
      member_since: '2024-01-01',
    },
  })
})

// GET /api/users/:id/ratings
router.get('/:id/ratings', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'User ratings',
    data: [
      {
        id: 'r1',
        rating: 5,
        review_text: 'Excellent service!',
        rater_name: 'Ali H.',
        created_at: '2026-04-20',
      },
      {
        id: 'r2',
        rating: 4,
        review_text: 'Good experience.',
        rater_name: 'Sara A.',
        created_at: '2026-04-18',
      },
    ],
  })
})

export default router

export const userRoutes = router
