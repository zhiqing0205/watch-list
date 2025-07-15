import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await params
    const movieId = parseInt(resolvedParams.id, 10)
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const offset = (page - 1) * limit

    // Get the current movie to access its genres
    const currentMovie = await prisma.movie.findUnique({
      where: { id: movieId },
      select: { genres: true }
    })

    if (!currentMovie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 })
    }

    // Get similar movies based on genres
    const similarMovies = await prisma.movie.findMany({
      where: {
        AND: [
          { id: { not: movieId } }, // Exclude current movie
          { isVisible: true }, // Only visible movies
          {
            genres: {
              hasSome: currentMovie.genres // Movies with at least one matching genre
            }
          }
        ]
      },
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
      },
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' }
    })

    // Get total count for hasMore calculation
    const totalCount = await prisma.movie.count({
      where: {
        AND: [
          { id: { not: movieId } },
          { isVisible: true },
          {
            genres: {
              hasSome: currentMovie.genres
            }
          }
        ]
      }
    })

    const hasMore = offset + limit < totalCount

    return NextResponse.json({
      movies: similarMovies,
      hasMore,
      total: totalCount
    })
  } catch (error) {
    console.error('Error fetching similar movies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch similar movies' },
      { status: 500 }
    )
  }
}