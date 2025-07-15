import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { WatchStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const watchStatus = searchParams.get('watchStatus') as WatchStatus | null
    const genre = searchParams.get('genre')
    const sortBy = searchParams.get('sortBy') || 'default'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const baseWhere = {
      isVisible: true,
    }

    const whereClause = {
      ...baseWhere,
      ...(watchStatus && { watchStatus }),
      ...(genre && {
        genres: {
          has: genre
        }
      })
    }

    // Determine sort configuration
    let orderBy: any = { createdAt: 'desc' } // default

    switch (sortBy) {
      case 'rating':
        orderBy = { doubanRating: sortOrder }
        break
      case 'year':
        orderBy = [
          { releaseDate: sortOrder }, // for movies
          { firstAirDate: sortOrder }  // for TV shows
        ]
        break
      case 'name':
        orderBy = [
          { title: sortOrder }, // for movies
          { name: sortOrder }   // for TV shows
        ]
        break
      default:
        orderBy = { createdAt: sortOrder }
        break
    }

    const [tvShows, movies] = await Promise.all([
      prisma.tvShow.findMany({
        where: whereClause,
        orderBy: sortBy === 'year' ? { firstAirDate: sortOrder } :
                sortBy === 'name' ? { name: sortOrder } :
                sortBy === 'rating' ? { doubanRating: sortOrder } :
                { createdAt: sortOrder },
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
        }
      }),
      prisma.movie.findMany({
        where: whereClause,
        orderBy: sortBy === 'year' ? { releaseDate: sortOrder } :
                sortBy === 'name' ? { title: sortOrder } :
                sortBy === 'rating' ? { doubanRating: sortOrder } :
                { createdAt: sortOrder },
        select: {
          id: true,
          tmdbId: true,
          title: true,
          originalTitle: true,
          releaseDate: true,
          posterPath: true,
          posterUrl: true,
          backdropPath: true,
          backdropUrl: true,
          doubanRating: true,
          watchStatus: true,
          isVisible: true,
          createdAt: true,
          genres: true,
        }
      })
    ])

    return NextResponse.json({
      tvShows,
      movies
    })
  } catch (error) {
    console.error('Error fetching filtered content:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    )
  }
}