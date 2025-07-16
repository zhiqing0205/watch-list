import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logAdminOperation, LOG_ACTIONS, LogDescriptionBuilder } from '@/lib/operation-logger'
import { EntityType } from '@prisma/client'

// TMDB API 配置
const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

interface TMDBMovieResponse {
  id: number
  title: string
  original_title: string
  overview: string
  release_date: string
  poster_path: string | null
  backdrop_path: string | null
  vote_average: number
  genres: { id: number; name: string }[]
  runtime: number | null
}

interface TMDBTVResponse {
  id: number
  name: string
  original_name: string
  overview: string
  first_air_date: string
  last_air_date: string
  poster_path: string | null
  backdrop_path: string | null
  vote_average: number
  genres: { id: number; name: string }[]
  number_of_episodes: number
  number_of_seasons: number
}

// 获取TMDB电影数据
async function fetchTMDBMovie(tmdbId: number): Promise<TMDBMovieResponse> {
  const response = await fetch(`${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=zh-CN`)
  if (!response.ok) {
    throw new Error(`Failed to fetch TMDB movie data: ${response.status}`)
  }
  return response.json()
}

// 获取TMDB电视剧数据
async function fetchTMDBTV(tmdbId: number): Promise<TMDBTVResponse> {
  const response = await fetch(`${TMDB_BASE_URL}/tv/${tmdbId}?api_key=${TMDB_API_KEY}&language=zh-CN`)
  if (!response.ok) {
    throw new Error(`Failed to fetch TMDB TV data: ${response.status}`)
  }
  return response.json()
}

// 更新电影元数据
async function updateMovieMetadata(movieId: number, tmdbData: TMDBMovieResponse) {
  const genreNames = tmdbData.genres.map(g => g.name).filter(name => 
    // 过滤掉英文类型，只保留中文
    !/^[a-zA-Z\s]+$/.test(name)
  )

  return prisma.movie.update({
    where: { id: movieId },
    data: {
      title: tmdbData.title,
      originalTitle: tmdbData.original_title,
      overview: tmdbData.overview,
      releaseDate: tmdbData.release_date ? new Date(tmdbData.release_date) : null,
      posterPath: tmdbData.poster_path,
      backdropPath: tmdbData.backdrop_path,
      tmdbRating: tmdbData.vote_average,
      runtime: tmdbData.runtime,
      genres: genreNames,
    }
  })
}

// 更新电视剧元数据
async function updateTVMetadata(tvId: number, tmdbData: TMDBTVResponse) {
  const genreNames = tmdbData.genres.map(g => g.name).filter(name => 
    // 过滤掉英文类型，只保留中文
    !/^[a-zA-Z\s]+$/.test(name)
  )

  return prisma.tvShow.update({
    where: { id: tvId },
    data: {
      name: tmdbData.name,
      originalName: tmdbData.original_name,
      overview: tmdbData.overview,
      firstAirDate: tmdbData.first_air_date ? new Date(tmdbData.first_air_date) : null,
      lastAirDate: tmdbData.last_air_date ? new Date(tmdbData.last_air_date) : null,
      posterPath: tmdbData.poster_path,
      backdropPath: tmdbData.backdrop_path,
      tmdbRating: tmdbData.vote_average,
      numberOfEpisodes: tmdbData.number_of_episodes,
      numberOfSeasons: tmdbData.number_of_seasons,
      genres: genreNames,
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const { movieIds, tvShowIds, refreshAll } = await request.json()

    if (!movieIds && !tvShowIds && !refreshAll) {
      return NextResponse.json({ error: 'No content IDs provided' }, { status: 400 })
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    let moviesToRefresh = movieIds || []
    let tvShowsToRefresh = tvShowIds || []

    // 如果是刷新所有内容，获取所有有效的内容ID
    if (refreshAll) {
      const [movies, tvShows] = await Promise.all([
        prisma.movie.findMany({
          where: { isVisible: true },
          select: { id: true }
        }),
        prisma.tvShow.findMany({
          where: { isVisible: true },
          select: { id: true }
        })
      ])
      
      moviesToRefresh = movies.map(m => m.id)
      tvShowsToRefresh = tvShows.map(t => t.id)
    }

    // 处理电影
    if (moviesToRefresh.length > 0) {
      for (const movieId of moviesToRefresh) {
        try {
          const movie = await prisma.movie.findUnique({
            where: { id: movieId },
            select: { id: true, title: true, tmdbId: true }
          })

          if (!movie) {
            results.errors.push(`Movie with ID ${movieId} not found`)
            results.failed++
            continue
          }

          const tmdbData = await fetchTMDBMovie(movie.tmdbId)
          await updateMovieMetadata(movieId, tmdbData)
          
          // 记录操作日志
          await logAdminOperation({
            action: LOG_ACTIONS.REFRESH_TMDB_METADATA,
            entityType: EntityType.MOVIE,
            entityId: movieId,
            movieId: movieId,
            description: LogDescriptionBuilder.tmdbRefresh(EntityType.MOVIE, movie.title, moviesToRefresh.length > 1)
          })

          results.success++
        } catch (error) {
          console.error(`Error refreshing movie ${movieId}:`, error)
          results.errors.push(`Failed to refresh movie ${movieId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          results.failed++
        }
      }
    }

    // 处理电视剧
    if (tvShowsToRefresh.length > 0) {
      for (const tvShowId of tvShowsToRefresh) {
        try {
          const tvShow = await prisma.tvShow.findUnique({
            where: { id: tvShowId },
            select: { id: true, name: true, tmdbId: true }
          })

          if (!tvShow) {
            results.errors.push(`TV show with ID ${tvShowId} not found`)
            results.failed++
            continue
          }

          const tmdbData = await fetchTMDBTV(tvShow.tmdbId)
          await updateTVMetadata(tvShowId, tmdbData)
          
          // 记录操作日志
          await logAdminOperation({
            action: LOG_ACTIONS.REFRESH_TMDB_METADATA,
            entityType: EntityType.TV_SHOW,
            entityId: tvShowId,
            tvShowId: tvShowId,
            description: LogDescriptionBuilder.tmdbRefresh(EntityType.TV_SHOW, tvShow.name, tvShowsToRefresh.length > 1)
          })

          results.success++
        } catch (error) {
          console.error(`Error refreshing TV show ${tvShowId}:`, error)
          results.errors.push(`Failed to refresh TV show ${tvShowId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          results.failed++
        }
      }
    }

    return NextResponse.json({
      message: `Refreshed ${results.success} items, ${results.failed} failed`,
      results
    })

  } catch (error) {
    console.error('Error in TMDB refresh:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}