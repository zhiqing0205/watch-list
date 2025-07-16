import { NextRequest, NextResponse } from 'next/server'
import { tmdbClient } from '@/lib/tmdb'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const movieId = parseInt(id)
    
    if (isNaN(movieId)) {
      return NextResponse.json({ error: 'Invalid movie ID' }, { status: 400 })
    }

    const [movie, credits] = await Promise.all([
      tmdbClient.getMovieDetails(movieId),
      tmdbClient.getMovieCredits(movieId)
    ])

    return NextResponse.json({ movie, credits })
  } catch (error) {
    console.error('Error fetching movie details:', error)
    return NextResponse.json({ error: 'Failed to fetch movie details' }, { status: 500 })
  }
}