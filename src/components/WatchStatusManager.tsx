'use client'

import { useState } from 'react'
import { WatchStatus } from '@prisma/client'
import { Star, Edit2, Save, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WatchStatusManagerProps {
  contentId: string
  contentType: 'movie' | 'tv'
  currentStatus: WatchStatus
  currentRating?: number
  currentReview?: string
  userId: string
  onStatusChange: (status: WatchStatus) => void
  onReviewSubmit: (rating: number | null, review: string) => void
}

const watchStatusOptions = [
  { value: WatchStatus.UNWATCHED, label: '未观看', color: 'bg-gray-500' },
  { value: WatchStatus.WATCHING, label: '观看中', color: 'bg-yellow-500' },
  { value: WatchStatus.WATCHED, label: '已观看', color: 'bg-green-500' },
  { value: WatchStatus.DROPPED, label: '弃剧', color: 'bg-red-500' },
]

export function WatchStatusManager({
  contentId,
  contentType,
  currentStatus,
  currentRating,
  currentReview,
  userId,
  onStatusChange,
  onReviewSubmit
}: WatchStatusManagerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [rating, setRating] = useState(currentRating || 0)
  const [review, setReview] = useState(currentReview || '')
  const [loading, setLoading] = useState(false)

  const handleStatusChange = async (newStatus: WatchStatus) => {
    if (newStatus === currentStatus) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/${contentType}/${contentId}/watch-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          watchStatus: newStatus,
          userId
        })
      })

      if (response.ok) {
        onStatusChange(newStatus)
      }
    } catch (error) {
      console.error('Error updating watch status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReviewSubmit = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/${contentType}/${contentId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          rating: rating || null,
          review: review || null
        })
      })

      if (response.ok) {
        onReviewSubmit(rating || null, review)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Error submitting review:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setRating(currentRating || 0)
    setReview(currentReview || '')
    setIsEditing(false)
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6 space-y-6">
      {/* Watch Status */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">观看状态</h3>
        <div className="flex flex-wrap gap-2">
          {watchStatusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              disabled={loading}
              className={cn(
                'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                currentStatus === option.value
                  ? `${option.color} text-white`
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Review Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">我的评价</h3>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm"
            >
              <Edit2 className="h-4 w-4" />
              {currentRating || currentReview ? '编辑' : '添加评价'}
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                评分 (1-10)
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={cn(
                      'w-8 h-8 rounded flex items-center justify-center text-sm font-medium transition-colors',
                      star <= rating
                        ? 'bg-yellow-500 text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    )}
                  >
                    {star}
                  </button>
                ))}
                <button
                  onClick={() => setRating(0)}
                  className="ml-2 text-slate-400 hover:text-slate-300 text-sm"
                >
                  清除
                </button>
              </div>
            </div>

            {/* Review Text */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                评论
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="写下你的观看感受..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleReviewSubmit}
                disabled={loading}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Save className="h-4 w-4" />
                保存
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
                取消
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {currentRating && (
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-white font-medium">{currentRating}/10</span>
              </div>
            )}
            {currentReview && (
              <p className="text-slate-300">{currentReview}</p>
            )}
            {!currentRating && !currentReview && (
              <p className="text-slate-500 text-sm">暂无评价</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}