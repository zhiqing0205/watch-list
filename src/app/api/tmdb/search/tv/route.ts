import { NextRequest, NextResponse } from 'next/server'
import { tmdbClient } from '@/lib/tmdb'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const page = searchParams.get('page') || '1'

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
    }

    const results = await tmdbClient.searchTVShows(query, parseInt(page))
    return NextResponse.json(results)
  } catch (error) {
    console.error('Error searching TV shows:', error)
    return NextResponse.json({ error: 'Failed to search TV shows' }, { status: 500 })
  }
}