import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tvShowId = parseInt(id, 10)
    
    if (isNaN(tvShowId)) {
      return NextResponse.json({ error: 'Invalid TV show ID' }, { status: 400 })
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
      return NextResponse.json({ error: 'TV show not found' }, { status: 404 })
    }

    // Get similar TV shows
    const similarTvShows = await prisma.tvShow.findMany({
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
      take: 10,
      orderBy: { createdAt: 'desc' }
    })

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

    return NextResponse.json({
      tvShow,
      similarTvShows,
      hasMoreSimilarTvShows: totalSimilarTvShows > 10
    })
  } catch (error) {
    console.error('Error fetching TV show:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}