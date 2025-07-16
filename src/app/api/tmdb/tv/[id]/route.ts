import { NextRequest, NextResponse } from 'next/server'
import { tmdbClient } from '@/lib/tmdb'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tvId = parseInt(id)
    
    if (isNaN(tvId)) {
      return NextResponse.json({ error: 'Invalid TV show ID' }, { status: 400 })
    }

    const [tvShow, credits] = await Promise.all([
      tmdbClient.getTVShowDetails(tvId),
      tmdbClient.getTVShowCredits(tvId)
    ])

    return NextResponse.json({ tvShow, credits })
  } catch (error) {
    console.error('Error fetching TV show details:', error)
    return NextResponse.json({ error: 'Failed to fetch TV show details' }, { status: 500 })
  }
}