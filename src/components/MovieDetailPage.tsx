'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { MovieDetailSkeleton } from '@/components/skeletons/MovieDetailSkeleton'
import { MovieDetailContent } from '@/components/MovieDetailContent'
import { useLoading } from '@/contexts/LoadingContext'

export default function MovieDetailPage() {
  const params = useParams()
  const { setNavigating } = useLoading()
  const [movieData, setMovieData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        const response = await fetch(`/api/movies/${params.id}`)
        if (!response.ok) {
          throw new Error('Movie not found')
        }
        const data = await response.json()
        setMovieData(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
        // 清除全局loading状态
        setNavigating(false)
      }
    }

    if (params.id) {
      fetchMovieData()
    }
  }, [params.id, setNavigating])

  if (loading) {
    return <MovieDetailSkeleton />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">电影未找到</h1>
          <p className="text-slate-600 dark:text-slate-400">{error}</p>
        </div>
      </div>
    )
  }

  return <MovieDetailContent movieData={movieData} />
}