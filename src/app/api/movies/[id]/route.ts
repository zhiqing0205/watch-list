import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const movieId = parseInt(id, 10)
    
    if (isNaN(movieId)) {
      return NextResponse.json({ error: 'Invalid movie ID' }, { status: 400 })
    }

    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
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

    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 })
    }

    // Get similar movies
    const similarMovies = await prisma.movie.findMany({
      where: {
        AND: [
          { id: { not: movieId } },
          { isVisible: true },
          {
            genres: {
              hasSome: movie.genres
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
      take: 10,
      orderBy: { createdAt: 'desc' }
    })

    const totalSimilarMovies = await prisma.movie.count({
      where: {
        AND: [
          { id: { not: movieId } },
          { isVisible: true },
          {
            genres: {
              hasSome: movie.genres
            }
          }
        ]
      }
    })

    return NextResponse.json({
      movie,
      similarMovies,
      hasMoreSimilarMovies: totalSimilarMovies > 10
    })
  } catch (error) {
    console.error('Error fetching movie:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}