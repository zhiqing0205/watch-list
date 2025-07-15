import { NextRequest, NextResponse } from 'next/server'
import { uploadTMDbImage } from '@/lib/oss-server'

export async function POST(request: NextRequest) {
  try {
    const { tmdbImagePath, type, tmdbId } = await request.json()

    if (!tmdbImagePath || !type || !tmdbId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['movie', 'tv', 'actor'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    const url = await uploadTMDbImage(tmdbImagePath, type, tmdbId)

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Error uploading TMDb image:', error)
    return NextResponse.json({ error: 'Failed to upload TMDb image' }, { status: 500 })
  }
}