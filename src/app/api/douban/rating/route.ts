import { NextRequest, NextResponse } from 'next/server'
import { getDoubanRatingByTitle } from '@/lib/douban'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const title = searchParams.get('title')
    const type = searchParams.get('type') as 'movie' | 'tv'

    if (!title || !type) {
      return NextResponse.json({ error: 'Title and type parameters are required' }, { status: 400 })
    }

    if (!['movie', 'tv'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
    }

    const rating = await getDoubanRatingByTitle(title, type)
    
    return NextResponse.json({ rating })
  } catch (error) {
    console.error('Error fetching Douban rating:', error)
    return NextResponse.json({ error: 'Failed to fetch Douban rating' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { contentId, contentType, title } = await request.json()

    if (!contentId || !contentType || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['movie', 'tv'].includes(contentType)) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
    }

    const { updateDoubanRating } = await import('@/lib/douban')
    const rating = await updateDoubanRating(contentId, contentType, title)
    
    return NextResponse.json({ rating })
  } catch (error) {
    console.error('Error updating Douban rating:', error)
    return NextResponse.json({ error: 'Failed to update Douban rating' }, { status: 500 })
  }
}