'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Star, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { ratingApi } from '@/lib/api-client'
import { toast } from '@/components/ui'

interface RatingModalProps {
  booking_id: string
  driver_id: string
  driver_name: string
  open: boolean
  onClose: () => void
  onSubmit?: () => void
}

export const RatingModal: React.FC<RatingModalProps> = ({
  booking_id,
  driver_id,
  driver_name,
  open,
  onClose,
  onSubmit
}) => {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [review, setReview] = useState('')
  const [categories, setCategories] = useState({
    cleanliness: 0,
    communication: 0,
    safety: 0,
    professionalism: 0,
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    setSubmitting(true)
    try {
      const res = await ratingApi.submitRating({
        booking_id,
        rated_user_id: driver_id,
        overall_rating: rating,
        review_text: review,
        category_ratings: categories,
      })

      if (res.success) {
        toast.success('Thank you for your review!')
        setRating(0)
        setReview('')
        setCategories({ cleanliness: 0, communication: 0, safety: 0, professionalism: 0 })
        onSubmit?.()
        onClose()
      } else {
        toast.error('Failed to submit rating')
      }
    } catch (err) {
      toast.error('Error submitting rating')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1B5E20] to-[#2E7D32] p-6 text-white flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black">Rate {driver_name}</h2>
            <p className="text-sm text-white/70 mt-1">How was your delivery experience?</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
            <X size={18} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Overall Rating */}
          <div>
            <label className="block text-sm font-bold text-[#212121] mb-3">Overall Rating *</label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  whileHover={{ scale: 1.2 }}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-colors"
                >
                  <Star
                    size={32}
                    className={`${
                      (hoveredRating || rating) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300'
                    } transition-colors`}
                  />
                </motion.button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm font-bold text-[#1B5E20] mt-2">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent!'}
              </p>
            )}
          </div>

          {/* Category Ratings */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-[#212121]">Rate by Category</label>
            {Object.entries(categories).map(([category, value]) => (
              <div key={category}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#666] capitalize">{category}</span>
                  <span className="text-xs font-bold text-[#1B5E20]">{value}/5</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setCategories({ ...categories, [category]: star })}
                      className="transition-colors"
                    >
                      <Star
                        size={16}
                        className={`${
                          value >= star
                            ? 'fill-[#1B5E20] text-[#1B5E20]'
                            : 'text-gray-200'
                        } transition-colors`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-sm font-bold text-[#212121] mb-2">Share Your Feedback</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Tell us about your experience with the driver..."
              maxLength={500}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#1B5E20] focus:ring-2 focus:ring-[#1B5E20]/10 outline-none resize-none transition-all"
            />
            <p className="text-xs text-[#999] mt-1">{review.length}/500</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || rating === 0}
              icon={submitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              className="flex-1"
            >
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
