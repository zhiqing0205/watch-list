'use client'

import { useState, useEffect, useCallback } from 'react'
import { TvCard } from '@/components/TvCard'

interface TvShow {
  id: number
  tmdbId: number
  name: string
  originalName: string | null
  firstAirDate: Date | null
  numberOfSeasons: number | null
  numberOfEpisodes: number | null
  posterPath: string | null
  posterUrl: string | null
  backdropPath: string | null
  backdropUrl: string | null
  doubanRating: number | null
  watchStatus: string
  isVisible: boolean
  createdAt: Date
  genres: string[]
}

interface SimilarTvShowsProps {
  tvShowId: number
  initialTvShows: TvShow[]
  initialHasMore: boolean
}

export function SimilarTvShows({ tvShowId, initialTvShows, initialHasMore }: SimilarTvShowsProps) {
  const [tvShows, setTvShows] = useState<TvShow[]>(initialTvShows)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(2) // Start from page 2 since page 1 is initial data
  const [showNoMore, setShowNoMore] = useState(false)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const response = await fetch(`/api/tv/${tvShowId}/similar?page=${page}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setTvShows(prev => [...prev, ...data.tvShows])
        setHasMore(data.hasMore)
        setPage(prev => prev + 1)
        
        // Show "no more" message if we've reached the end
        if (!data.hasMore && tvShows.length > 0) {
          setShowNoMore(true)
        }
      }
    } catch (error) {
      console.error('Error loading more TV shows:', error)
    } finally {
      setLoading(false)
    }
  }, [tvShowId, page, loading, hasMore, tvShows.length])

  useEffect(() => {
    // Show "no more" message if initially there's no more content and we have TV shows
    if (!initialHasMore && initialTvShows.length > 0) {
      setShowNoMore(true)
    }
  }, [initialHasMore, initialTvShows.length])

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 100 >= 
        document.documentElement.offsetHeight
      ) {
        loadMore()
      }
    }

    if (hasMore) {
      window.addEventListener('scroll', handleScroll)
      return () => window.removeEventListener('scroll', handleScroll)
    }
  }, [loadMore, hasMore])

  if (tvShows.length === 0) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-white mb-6">猜你喜欢</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {tvShows.map((tvShow) => (
          <TvCard 
            key={tvShow.id} 
            tvShow={tvShow as any}
          />
        ))}
      </div>
      {loading && (
        <div className="text-center mt-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <p className="text-white mt-2">加载中...</p>
        </div>
      )}
      {showNoMore && !loading && (
        <div className="text-center mt-8">
          <p className="text-white/70 text-sm">没有更多了</p>
        </div>
      )}
    </div>
  )
}