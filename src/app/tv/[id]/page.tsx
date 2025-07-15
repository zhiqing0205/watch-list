import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Star, Calendar, Play, Users, Tv, ArrowLeft } from 'lucide-react'
import { WatchStatus } from '@prisma/client'
import { Navbar } from '@/components/Navbar'
import { SimilarTvShows } from '@/components/SimilarTvShows'
import { generateSEO, seoConfigs } from '@/lib/seo'

export async function generateMetadata({ params }: TvPageProps) {
  const resolvedParams = await params
  const tvShowId = parseInt(resolvedParams.id, 10)
  
  if (isNaN(tvShowId)) {
    return generateSEO({
      title: '电视剧未找到 - 剧海拾遗',
      description: '抱歉，您要查找的电视剧不存在。'
    })
  }

  const tvShow = await prisma.tvShow.findUnique({
    where: { id: tvShowId }
  })

  if (!tvShow) {
    return generateSEO({
      title: '电视剧未找到 - 剧海拾遗',
      description: '抱歉，您要查找的电视剧不存在。'
    })
  }

  const year = tvShow.firstAirDate ? new Date(tvShow.firstAirDate).getFullYear() : undefined
  return generateSEO(seoConfigs.tvShow(tvShow.name, year))
}

interface TvPageProps {
  params: {
    id: string
  }
}

export default async function TvPage({ params }: TvPageProps) {
  const resolvedParams = await params
  const tvShowId = parseInt(resolvedParams.id, 10)
  
  // 检查ID是否为有效数字
  if (isNaN(tvShowId)) {
    notFound()
  }

  const tvShow = await prisma.tvShow.findUnique({
    where: { id: tvShowId },
    include: {
      cast: {
        include: {
          actor: true
        },
        orderBy: { order: 'asc' },
        take: 10
      },
      reviews: {
        include: {
          user: true
        }
      }
    }
  })

  if (!tvShow) {
    notFound()
  }

  // Get similar TV shows based on genres
  const similarTvShows = await prisma.tvShow.findMany({
    where: {
      AND: [
        { id: { not: tvShowId } }, // Exclude current TV show
        { isVisible: true }, // Only visible TV shows
        {
          genres: {
            hasSome: tvShow.genres // TV shows with at least one matching genre
          }
        }
      ]
    },
    select: {
      id: true,
      tmdbId: true,
      name: true,
      originalName: true,
      firstAirDate: true,
      numberOfSeasons: true,
      numberOfEpisodes: true,
      posterPath: true,
      posterUrl: true,
      backdropPath: true,
      backdropUrl: true,
      doubanRating: true,
      watchStatus: true,
      isVisible: true,
      createdAt: true,
      genres: true,
    },
    take: 10, // Limit to 10 similar TV shows for initial load
    orderBy: { createdAt: 'desc' }
  })

  // Get total count for hasMore calculation
  const totalSimilarTvShows = await prisma.tvShow.count({
    where: {
      AND: [
        { id: { not: tvShowId } },
        { isVisible: true },
        {
          genres: {
            hasSome: tvShow.genres
          }
        }
      ]
    }
  })

  const hasMoreSimilarTvShows = totalSimilarTvShows > 10

  const getStatusColor = (status: WatchStatus) => {
    switch (status) {
      case WatchStatus.WATCHING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/30'
      case WatchStatus.WATCHED:
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30'
      case WatchStatus.DROPPED:
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-gray-500/20 dark:text-gray-300 dark:border-gray-500/30'
    }
  }

  const getStatusText = (status: WatchStatus) => {
    switch (status) {
      case WatchStatus.WATCHING:
        return '观看中'
      case WatchStatus.WATCHED:
        return '已观看'
      case WatchStatus.DROPPED:
        return '弃剧'
      default:
        return '未观看'
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative">
      {/* Background Image */}
      {tvShow.backdropUrl && (
        <>
          <div 
            className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
            style={{
              backgroundImage: `url(${tvShow.backdropUrl})`,
            }}
          />
          <div className="fixed inset-0 bg-black/40 dark:bg-black/60 z-0" />
        </>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <div className="mb-6">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-white hover:text-slate-200 transition-colors bg-black/40 backdrop-blur-sm px-3 py-2 rounded-lg"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>返回首页</span>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Poster */}
            <div className="lg:col-span-1">
              <div className="aspect-[2/3] relative rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800">
                {tvShow.posterUrl || tvShow.posterPath ? (
                  <Image
                    src={tvShow.posterUrl || `https://image.tmdb.org/t/p/w500${tvShow.posterPath}`}
                    alt={tvShow.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center">
                    <Tv className="h-16 w-16 text-slate-500 dark:text-slate-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="lg:col-span-2">
              <div className="space-y-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg p-6">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{tvShow.name}</h1>
                  {tvShow.originalName && tvShow.originalName !== tvShow.name && (
                    <p className="text-slate-600 dark:text-slate-300 mb-4">{tvShow.originalName}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-4 mb-6">
                    <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(tvShow.watchStatus)}`}>
                      {getStatusText(tvShow.watchStatus)}
                    </div>
                    
                    {tvShow.doubanRating && (
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm font-medium">豆瓣 {Number(tvShow.doubanRating).toFixed(1)}</span>
                      </div>
                    )}
                    
                    {tvShow.tmdbRating && (
                      <div className="flex items-center gap-1 text-blue-400">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm font-medium">TMDb {Number(tvShow.tmdbRating).toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-6 text-sm text-slate-600 dark:text-slate-300 mb-6">
                    {tvShow.firstAirDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>首播: {new Date(tvShow.firstAirDate).toLocaleDateString('zh-CN')}</span>
                      </div>
                    )}
                    
                    {tvShow.lastAirDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>完结: {new Date(tvShow.lastAirDate).toLocaleDateString('zh-CN')}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-6 text-sm text-slate-600 dark:text-slate-300 mb-6">
                    {tvShow.numberOfSeasons && (
                      <div className="flex items-center gap-1">
                        <Tv className="h-4 w-4" />
                        <span>{tvShow.numberOfSeasons} 季</span>
                      </div>
                    )}
                    
                    {tvShow.numberOfEpisodes && (
                      <div className="flex items-center gap-1">
                        <Tv className="h-4 w-4" />
                        <span>{tvShow.numberOfEpisodes} 集</span>
                      </div>
                    )}
                  </div>

                  {tvShow.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {tvShow.genres.map((genre) => (
                        <span key={genre} className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-sm">
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}

                  {tvShow.overview && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">剧情简介</h3>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{tvShow.overview}</p>
                    </div>
                  )}

                  {tvShow.summary && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">一句话总结</h3>
                      <p className="text-slate-700 dark:text-slate-300">{tvShow.summary}</p>
                    </div>
                  )}

                  {tvShow.playUrl && (
                    <div className="mb-8 flex justify-center">
                      <a
                        href={tvShow.playUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative w-64 h-14 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full flex items-center justify-center gap-3 text-lg font-semibold shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 overflow-hidden"
                      >
                        {/* Breathing animation background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full animate-pulse opacity-50 group-hover:opacity-0 transition-opacity duration-300"></div>
                        
                        {/* Button content */}
                        <div className="relative z-10 flex items-center gap-3">
                          <Play className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" fill="currentColor" />
                          <span className="transition-all duration-300 group-hover:tracking-wider">观看剧集</span>
                        </div>
                        
                        {/* Shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
                      </a>
                    </div>
                  )}
                </div>

                {/* Cast */}
                {tvShow.cast.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      演员阵容
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {tvShow.cast.map((cast) => (
                        <Link 
                          key={cast.id} 
                          href={`/search?actor=${cast.actor.id}`}
                          className="text-center group cursor-pointer"
                        >
                          <div className="aspect-[2/3] relative rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 mb-2 transition-transform duration-300 group-hover:scale-105">
                            {cast.actor.profileUrl || cast.actor.profilePath ? (
                              <Image
                                src={cast.actor.profileUrl || `https://image.tmdb.org/t/p/w185${cast.actor.profilePath}`}
                                alt={cast.actor.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center">
                                <Users className="h-8 w-8 text-slate-500 dark:text-slate-400" />
                              </div>
                            )}
                          </div>
                          <p className="text-slate-900 dark:text-white text-sm font-medium truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{cast.actor.name}</p>
                          {cast.character && (
                            <p className="text-slate-600 dark:text-slate-400 text-xs truncate">{cast.character}</p>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reviews */}
                {tvShow.reviews.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">观看评价</h3>
                    <div className="space-y-4">
                      {tvShow.reviews.map((review) => (
                        <div key={review.id} className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-slate-900 dark:text-white font-medium">{review.user.name}</span>
                            {review.rating && (
                              <div className="flex items-center gap-1 text-yellow-500">
                                <Star className="h-3 w-3 fill-current" />
                                <span className="text-sm">{review.rating}</span>
                              </div>
                            )}
                          </div>
                          {review.review && (
                            <p className="text-slate-700 dark:text-slate-300">{review.review}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Similar TV Shows Section */}
        <SimilarTvShows 
          tvShowId={tvShowId}
          initialTvShows={similarTvShows as any}
          initialHasMore={hasMoreSimilarTvShows}
        />
      </div>
    </div>
  )
}