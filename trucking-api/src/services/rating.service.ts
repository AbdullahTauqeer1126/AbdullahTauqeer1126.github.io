import { logger } from '../utils/logger'
import { createApiError } from '../middleware/error.middleware'
import supabase, { supabaseServiceRole } from '../utils/supabase'

// ========== RATING & REVIEW SERVICE ==========
// Uses Supabase for permanent storage

export interface Rating {
  id: string
  booking_id: string
  rater_id: string
  rater_role: string
  rated_user_id: string
  overall_rating: number
  category_ratings: any
  review_text?: string
  photo_urls?: string[]
  is_verified: boolean
  is_flagged: boolean
  created_at: Date
}

class RatingService {
  private client = supabaseServiceRole || supabase

  /**
   * Submit a rating after trip completion
   */
  async submitRating(data: {
    booking_id: string
    rater_id: string
    rater_role: string
    rated_user_id: string
    overall_rating: number
    category_ratings?: any
    review_text?: string
    photo_urls?: string[]
  }): Promise<Rating> {
    if (data.overall_rating < 1 || data.overall_rating > 5) {
      throw createApiError(400, 'Rating must be between 1 and 5', 'INVALID_RATING')
    }

    const { data: ratingData, error } = await this.client
      .from('reviews')
      .insert([
        {
          booking_id: data.booking_id,
          from_user_id: data.rater_id,
          to_user_id: data.rated_user_id,
          rater_role: data.rater_role,
          rating: data.overall_rating,
          category_ratings: data.category_ratings || {},
          review_text: data.review_text,
          photo_urls: data.photo_urls || [],
          is_verified: true,
          is_flagged: false,
        },
      ])
      .select('*')
      .single()

    if (error) {
      logger.error('Error submitting rating:', error)
      throw createApiError(500, 'Failed to submit rating', 'DB_ERROR')
    }

    logger.info(`⭐ Rating submitted: ${data.overall_rating}/5 for user ${data.rated_user_id}`)
    return {
      ...ratingData,
      overall_rating: ratingData.rating,
      rater_id: ratingData.from_user_id,
      rated_user_id: ratingData.to_user_id,
      created_at: new Date(ratingData.created_at),
    }
  }

  /**
   * Get ratings for a user from DB
   */
  async getUserRatings(user_id: string, limit = 20, offset = 0): Promise<Rating[]> {
    const { data, error } = await this.client
      .from('reviews')
      .select('*')
      .eq('to_user_id', user_id)
      .eq('is_flagged', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) return []

    return (data || []).map((r: any) => ({
      ...r,
      overall_rating: r.rating,
      rater_id: r.from_user_id,
      rated_user_id: r.to_user_id,
      created_at: new Date(r.created_at),
    }))
  }

  /**
   * Get aggregated rating stats for a user
   */
  async getUserRatingStats(user_id: string) {
    const { data, error } = await this.client
      .from('reviews')
      .select('rating')
      .eq('to_user_id', user_id)
      .eq('is_flagged', false)

    if (error || !data || data.length === 0) {
      return {
        avg_rating: 0,
        total_reviews: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      }
    }

    const total = data.length
    const sum = data.reduce((acc: number, r: any) => acc + r.rating, 0)
    const distribution = data.reduce((acc: any, r: any) => {
      acc[r.rating] = (acc[r.rating] || 0) + 1
      return acc
    }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 })

    return {
      avg_rating: Math.round((sum / total) * 10) / 10,
      total_reviews: total,
      distribution
    }
  }

  /**
   * Respond to a review
   */
  async respondToReview(rating_id: string, responder_id: string, response_text: string) {
    const { data, error } = await this.client
      .from('reviews')
      .update({
        response_text,
        responded_at: new Date().toISOString(),
        responded_by: responder_id
      })
      .eq('id', rating_id)
      .select('*')
      .single()

    if (error) throw error
    return data
  }
}

export const ratingService = new RatingService()

