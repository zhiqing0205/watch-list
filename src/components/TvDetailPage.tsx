'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { TvDetailSkeleton } from '@/components/skeletons/TvDetailSkeleton'
import { TvDetailContent } from '@/components/TvDetailContent'
import { useLoading } from '@/contexts/LoadingContext'

export default function TvDetailPage() {
  const params = useParams()
  const { setNavigating } = useLoading()
  const [tvData, setTvData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchTvData = async () => {
      try {
        const response = await fetch(`/api/tv/${params.id}`)
        if (!response.ok) {
          throw new Error('TV show not found')
        }
        const data = await response.json()
        setTvData(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
        // 清除全局loading状态
        setNavigating(false)
      }
    }

    if (params.id) {
      fetchTvData()
    }
  }, [params.id, setNavigating])

  if (loading) {
    return <TvDetailSkeleton />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">电视剧未找到</h1>
          <p className="text-slate-600 dark:text-slate-400">{error}</p>
        </div>
      </div>
    )
  }

  return <TvDetailContent tvData={tvData} />
}