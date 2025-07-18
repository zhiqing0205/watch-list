'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { MovieCard } from '@/components/MovieCard'
import { TvCard } from '@/components/TvCard'
import { Pagination } from '@/components/ui/Pagination'
import { Navbar } from '@/components/Navbar'
import { Search, Film, Tv, User } from 'lucide-react'
import { AnimatedGradientBackground } from '@/components/AnimatedGradientBackground'

interface Movie {
  id: number
  tmdbId: number
  title: string
  originalTitle: string | null
  releaseDate: Date | null
  posterPath: string | null
  posterUrl: string | null
  doubanRating: number | null
  watchStatus: string
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
  doubanRating: number | null
  watchStatus: string
  isVisible: boolean
  createdAt: Date
  genres: string[]
}

interface Actor {
  id: number
  name: string
  profilePath: string | null
  posterUrl: string | null
}

interface SearchResults {
  movies: Movie[]
  tvShows: TvShow[]
  actor: Actor | null
  pagination: {
    page: number
    limit: number
    total: {
      movies: number
      tvShows: number
      all: number
    }
    totalPages: {
      movies: number
      tvShows: number
      all: number
    }
  }
}

export default function SearchPageClient() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q')
  const actorId = searchParams.get('actor')
  
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState<'all' | 'movies' | 'tv'>('all')

  useEffect(() => {
    if (query || actorId) {
      fetchResults(1)
    }
  }, [query, actorId])

  const fetchResults = async (page: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.append('q', query)
      if (actorId) params.append('actor', actorId)
      params.append('page', page.toString())
      params.append('limit', '12')

      const response = await fetch(`/api/search?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setResults(data)
        setCurrentPage(page)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    fetchResults(page)
  }

  const getSearchTitle = () => {
    if (results?.actor) {
      return `${results.actor.name} 的作品`
    }
    if (query) {
      return `搜索 "${query}"`
    }
    return '搜索结果'
  }

  const getFilteredResults = () => {
    if (!results) return { movies: [], tvShows: [], total: 0 }
    
    switch (activeTab) {
      case 'movies':
        return { movies: results.movies, tvShows: [], total: results.pagination.total.movies }
      case 'tv':
        return { movies: [], tvShows: results.tvShows, total: results.pagination.total.tvShows }
      default:
        return { 
          movies: results.movies, 
          tvShows: results.tvShows, 
          total: results.pagination.total.all 
        }
    }
  }

  const filteredResults = getFilteredResults()

  return (
    <AnimatedGradientBackground className="min-h-screen">
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-slate-600 dark:text-slate-400 mt-4">搜索中...</p>
          </div>
        )}

        {!loading && results && (
          <>
            {/* Search Info */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Search className="h-5 w-5 text-slate-500" />
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {getSearchTitle()}
                </h1>
              </div>
              
              {results.actor && (
                <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    {results.actor.profileUrl || results.actor.profilePath ? (
                      <img
                        src={results.actor.profileUrl || `https://image.tmdb.org/t/p/w185${results.actor.profilePath}`}
                        alt={results.actor.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-slate-500" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{results.actor.name}</h2>
                    <p className="text-slate-600 dark:text-slate-400">
                      共找到 {results.pagination.total.all} 部作品
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 mb-6 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-fit">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                全部 ({results.pagination.total.all})
              </button>
              <button
                onClick={() => setActiveTab('movies')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                  activeTab === 'movies'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Film className="h-4 w-4" />
                电影 ({results.pagination.total.movies})
              </button>
              <button
                onClick={() => setActiveTab('tv')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                  activeTab === 'tv'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Tv className="h-4 w-4" />
                电视剧 ({results.pagination.total.tvShows})
              </button>
            </div>

            {/* Results */}
            {filteredResults.total > 0 ? (
              <>
                {(activeTab === 'all' || activeTab === 'movies') && filteredResults.movies.length > 0 && (
                  <section className="mb-12">
                    {activeTab === 'all' && (
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Film className="h-5 w-5" />
                        电影 ({results.pagination.total.movies})
                      </h2>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                      {filteredResults.movies.map((movie) => (
                        <MovieCard key={`movie-${movie.id}`} movie={movie} />
                      ))}
                    </div>
                  </section>
                )}

                {(activeTab === 'all' || activeTab === 'tv') && filteredResults.tvShows.length > 0 && (
                  <section className="mb-12">
                    {activeTab === 'all' && (
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Tv className="h-5 w-5" />
                        电视剧 ({results.pagination.total.tvShows})
                      </h2>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                      {filteredResults.tvShows.map((tvShow) => (
                        <TvCard key={`tv-${tvShow.id}`} tvShow={tvShow} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Pagination */}
                {results.pagination.totalPages.all > 1 && (
                  <div className="mt-8">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={results.pagination.totalPages.all}
                      onPageChange={handlePageChange}
                      totalItems={filteredResults.total}
                      itemsPerPage={results.pagination.limit}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <Search className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  没有找到相关内容
                </h3>
                <p className="text-slate-500 dark:text-slate-500">
                  尝试使用不同的关键词或检查拼写
                </p>
              </div>
            )}
          </>
        )}

        {!loading && !results && (query || actorId) && (
          <div className="text-center py-16">
            <Search className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-400 mb-2">
              搜索失败
            </h3>
            <p className="text-slate-500 dark:text-slate-500">
              请稍后重试
            </p>
          </div>
        )}
      </div>
    </div>
    </AnimatedGradientBackground>
  )
}