import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await params
    const tvShowId = parseInt(resolvedParams.id, 10)
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const offset = (page - 1) * limit

    // Get the current TV show to access its genres
    const currentTvShow = await prisma.tvShow.findUnique({
      where: { id: tvShowId },
      select: { genres: true }
    })

    if (!currentTvShow) {
      return NextResponse.json({ error: 'TV show not found' }, { status: 404 })
    }

    // Get similar TV shows based on genres
    const similarTvShows = await prisma.tvShow.findMany({
      where: {
        AND: [
          { id: { not: tvShowId } }, // Exclude current TV show
          { isVisible: true }, // Only visible TV shows
          {
            genres: {
              hasSome: currentTvShow.genres // TV shows with at least one matching genre
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
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' }
    })

    // Get total count for hasMore calculation
    const totalCount = await prisma.tvShow.count({
      where: {
        AND: [
          { id: { not: tvShowId } },
          { isVisible: true },
          {
            genres: {
              hasSome: currentTvShow.genres
            }
          }
        ]
      }
    })

    const hasMore = offset + limit < totalCount

    return NextResponse.json({
      tvShows: similarTvShows,
      hasMore,
      total: totalCount
    })
  } catch (error) {
    console.error('Error fetching similar TV shows:', error)
    return NextResponse.json(
      { error: 'Failed to fetch similar TV shows' },
      { status: 500 }
    )
  }
}