'use client'

import { useState, useEffect } from 'react'
import { MovieCard } from '@/components/MovieCard'
import { TvCard } from '@/components/TvCard'
import { ContentFilter } from '@/components/ui/ContentFilter'
import { Pagination } from '@/components/ui/Pagination'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { WatchStatus } from '@prisma/client'

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
  watchStatus: WatchStatus
  isVisible: boolean
  createdAt: Date
  genres: string[]
}

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
  watchStatus: WatchStatus
  isVisible: boolean
  createdAt: Date
  genres: string[]
}

interface HomePageProps {
  initialTvShows: TvShow[]
  initialMovies: Movie[]
  availableGenres: string[]
}

export default function HomePageClient({ initialTvShows, initialMovies, availableGenres }: HomePageProps) {
  const [tvShows, setTvShows] = useState<TvShow[]>(initialTvShows)
  const [movies, setMovies] = useState<Movie[]>(initialMovies)
  const [watchStatusFilter, setWatchStatusFilter] = useState<WatchStatus | 'ALL'>('ALL')
  const [genreFilter, setGenreFilter] = useState<string>('')
  const [loading, setLoading] = useState(false)
  
  const [tvCurrentPage, setTvCurrentPage] = useState(1)
  const [movieCurrentPage, setMovieCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Sorting states
  const [tvSortBy, setTvSortBy] = useState('default')
  const [tvSortOrder, setTvSortOrder] = useState('desc')
  const [movieSortBy, setMovieSortBy] = useState('default')
  const [movieSortOrder, setMovieSortOrder] = useState('desc')

  // Client-side sorting function
  const sortContent = (items: any[], sortBy: string, sortOrder: string, type: 'tv' | 'movie') => {
    if (sortBy === 'default') {
      return [...items].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
      })
    }

    return [...items].sort((a, b) => {
      let valueA: any
      let valueB: any

      switch (sortBy) {
        case 'rating':
          valueA = a.doubanRating || 0
          valueB = b.doubanRating || 0
          break
        case 'year':
          if (type === 'tv') {
            valueA = a.firstAirDate ? new Date(a.firstAirDate).getFullYear() : 0
            valueB = b.firstAirDate ? new Date(b.firstAirDate).getFullYear() : 0
          } else {
            valueA = a.releaseDate ? new Date(a.releaseDate).getFullYear() : 0
            valueB = b.releaseDate ? new Date(b.releaseDate).getFullYear() : 0
          }
          break
        case 'name':
          valueA = type === 'tv' ? (a.name || '').toLowerCase() : (a.title || '').toLowerCase()
          valueB = type === 'tv' ? (b.name || '').toLowerCase() : (b.title || '').toLowerCase()
          break
        default:
          return 0
      }

      if (sortBy === 'name') {
        return sortOrder === 'desc' ? valueB.localeCompare(valueA) : valueA.localeCompare(valueB)
      } else {
        return sortOrder === 'desc' ? valueB - valueA : valueA - valueB
      }
    })
  }

  useEffect(() => {
    const fetchFilteredContent = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (watchStatusFilter !== 'ALL') {
          params.append('watchStatus', watchStatusFilter)
        }
        if (genreFilter) {
          params.append('genre', genreFilter)
        }

        const response = await fetch(`/api/content/filtered?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setTvShows(data.tvShows)
          setMovies(data.movies)
          setTvCurrentPage(1)
          setMovieCurrentPage(1)
        }
      } catch (error) {
        console.error('Failed to fetch filtered content:', error)
      } finally {
        setLoading(false)
      }
    }

    if (watchStatusFilter !== 'ALL' || genreFilter !== '') {
      fetchFilteredContent()
    } else {
      setTvShows(initialTvShows)
      setMovies(initialMovies)
      setTvCurrentPage(1)
      setMovieCurrentPage(1)
    }
  }, [watchStatusFilter, genreFilter, initialTvShows, initialMovies])

  const currentlyWatchingTvShows = tvShows.filter(show => show.watchStatus === WatchStatus.WATCHING)
  const currentlyWatchingMovies = movies.filter(movie => movie.watchStatus === WatchStatus.WATCHING)

  // Apply sorting to content before pagination
  const sortedTvShows = sortContent(tvShows, tvSortBy, tvSortOrder, 'tv')
  const sortedMovies = sortContent(movies, movieSortBy, movieSortOrder, 'movie')
  
  const tvTotalPages = Math.ceil(sortedTvShows.length / itemsPerPage)
  const movieTotalPages = Math.ceil(sortedMovies.length / itemsPerPage)
  
  const paginatedTvShows = sortedTvShows.slice(
    (tvCurrentPage - 1) * itemsPerPage,
    tvCurrentPage * itemsPerPage
  )
  
  const paginatedMovies = sortedMovies.slice(
    (movieCurrentPage - 1) * itemsPerPage,
    movieCurrentPage * itemsPerPage
  )

  // Sorting functions
  const handleTvSort = (sortBy: string) => {
    if (tvSortBy === sortBy) {
      // Toggle order if same sort option is clicked
      setTvSortOrder(tvSortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      // Set new sort option with desc as default
      setTvSortBy(sortBy)
      setTvSortOrder('desc')
    }
  }

  const handleMovieSort = (sortBy: string) => {
    if (movieSortBy === sortBy) {
      // Toggle order if same sort option is clicked
      setMovieSortOrder(movieSortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      // Set new sort option with desc as default
      setMovieSortBy(sortBy)
      setMovieSortOrder('desc')
    }
  }

  const SortButton = ({ 
    label, 
    sortBy, 
    currentSort, 
    currentOrder, 
    onSort 
  }: { 
    label: string
    sortBy: string
    currentSort: string
    currentOrder: string
    onSort: (sortBy: string) => void
  }) => {
    const isActive = currentSort === sortBy
    return (
      <Button
        variant={isActive ? "default" : "outline"}
        size="sm"
        onClick={() => onSort(sortBy)}
        className={`flex items-center gap-1 text-xs ${
          isActive 
            ? 'bg-[rgb(37,99,235)] hover:bg-[rgb(29,78,216)] text-white border-[rgb(37,99,235)]' 
            : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
        }`}
      >
        <span>{label}</span>
        {isActive && (
          currentOrder === 'desc' ? 
            <ArrowDown className="h-3 w-3" /> : 
            <ArrowUp className="h-3 w-3" />
        )}
      </Button>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Content Filter */}
        <ContentFilter
          watchStatusFilter={watchStatusFilter}
          genreFilter={genreFilter}
          availableGenres={availableGenres}
          onWatchStatusChange={setWatchStatusFilter}
          onGenreChange={setGenreFilter}
        />

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-slate-600 dark:text-slate-400 mt-2">加载中...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* Currently Watching */}
            {(currentlyWatchingTvShows.length > 0 || currentlyWatchingMovies.length > 0) && (
              <section className="mb-12">
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mb-6">正在观看</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {currentlyWatchingTvShows.map((tvShow) => (
                    <TvCard key={`tv-${tvShow.id}`} tvShow={tvShow} />
                  ))}
                  {currentlyWatchingMovies.map((movie) => (
                    <MovieCard key={`movie-${movie.id}`} movie={movie} />
                  ))}
                </div>
              </section>
            )}

            {/* TV Shows Section */}
            {tvShows.length > 0 && (
              <section className="mb-12">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
                    电视剧 ({sortedTvShows.length})
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">排序:</span>
                    <div className="flex items-center gap-1">
                      <SortButton
                        label="默认"
                        sortBy="default"
                        currentSort={tvSortBy}
                        currentOrder={tvSortOrder}
                        onSort={handleTvSort}
                      />
                      <SortButton
                        label="评分"
                        sortBy="rating"
                        currentSort={tvSortBy}
                        currentOrder={tvSortOrder}
                        onSort={handleTvSort}
                      />
                      <SortButton
                        label="年份"
                        sortBy="year"
                        currentSort={tvSortBy}
                        currentOrder={tvSortOrder}
                        onSort={handleTvSort}
                      />
                      <SortButton
                        label="名称"
                        sortBy="name"
                        currentSort={tvSortBy}
                        currentOrder={tvSortOrder}
                        onSort={handleTvSort}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {paginatedTvShows.map((tvShow) => (
                    <TvCard key={`tv-${tvShow.id}`} tvShow={tvShow} />
                  ))}
                </div>
                {tvTotalPages > 1 && (
                  <div className="mt-6">
                    <Pagination
                      currentPage={tvCurrentPage}
                      totalPages={tvTotalPages}
                      onPageChange={setTvCurrentPage}
                      totalItems={sortedTvShows.length}
                      itemsPerPage={itemsPerPage}
                    />
                  </div>
                )}
              </section>
            )}

            {/* Movies Section */}
            {movies.length > 0 && (
              <section className="mb-12">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
                    电影 ({sortedMovies.length})
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">排序:</span>
                    <div className="flex items-center gap-1">
                      <SortButton
                        label="默认"
                        sortBy="default"
                        currentSort={movieSortBy}
                        currentOrder={movieSortOrder}
                        onSort={handleMovieSort}
                      />
                      <SortButton
                        label="评分"
                        sortBy="rating"
                        currentSort={movieSortBy}
                        currentOrder={movieSortOrder}
                        onSort={handleMovieSort}
                      />
                      <SortButton
                        label="年份"
                        sortBy="year"
                        currentSort={movieSortBy}
                        currentOrder={movieSortOrder}
                        onSort={handleMovieSort}
                      />
                      <SortButton
                        label="名称"
                        sortBy="name"
                        currentSort={movieSortBy}
                        currentOrder={movieSortOrder}
                        onSort={handleMovieSort}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {paginatedMovies.map((movie) => (
                    <MovieCard key={`movie-${movie.id}`} movie={movie} />
                  ))}
                </div>
                {movieTotalPages > 1 && (
                  <div className="mt-6">
                    <Pagination
                      currentPage={movieCurrentPage}
                      totalPages={movieTotalPages}
                      onPageChange={setMovieCurrentPage}
                      totalItems={sortedMovies.length}
                      itemsPerPage={itemsPerPage}
                    />
                  </div>
                )}
              </section>
            )}

            {/* Empty State */}
            {tvShows.length === 0 && movies.length === 0 && (
              <div className="text-center py-16">
                <p className="text-slate-600 dark:text-slate-400 text-lg mb-4">暂无符合条件的内容</p>
                <p className="text-slate-500 dark:text-slate-500">尝试调整筛选条件或添加新的影视内容</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}