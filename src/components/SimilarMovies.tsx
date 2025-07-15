'use client'

import { useState, useEffect, useCallback } from 'react'
import { MovieCard } from '@/components/MovieCard'

interface Movie {
  id: number
  tmdbId: number
  title: string
  originalTitle: string | null
  releaseDate: Date | null
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

interface SimilarMoviesProps {
  movieId: number
  initialMovies: Movie[]
  initialHasMore: boolean
}

export function SimilarMovies({ movieId, initialMovies, initialHasMore }: SimilarMoviesProps) {
  const [movies, setMovies] = useState<Movie[]>(initialMovies)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(2) // Start from page 2 since page 1 is initial data
  const [showNoMore, setShowNoMore] = useState(false)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const response = await fetch(`/api/movies/${movieId}/similar?page=${page}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setMovies(prev => [...prev, ...data.movies])
        setHasMore(data.hasMore)
        setPage(prev => prev + 1)
        
        // Show "no more" message if we've reached the end
        if (!data.hasMore && movies.length > 0) {
          setShowNoMore(true)
        }
      }
    } catch (error) {
      console.error('Error loading more movies:', error)
    } finally {
      setLoading(false)
    }
  }, [movieId, page, loading, hasMore, movies.length])

  useEffect(() => {
    // Show "no more" message if initially there's no more content and we have movies
    if (!initialHasMore && initialMovies.length > 0) {
      setShowNoMore(true)
    }
  }, [initialHasMore, initialMovies.length])

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

  if (movies.length === 0) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-white mb-6">猜你喜欢</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {movies.map((movie) => (
          <MovieCard 
            key={movie.id} 
            movie={movie as any}
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