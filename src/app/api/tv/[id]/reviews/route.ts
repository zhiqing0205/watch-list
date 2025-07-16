import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Create or update a TV show review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tvShowId = parseInt(id, 10)
    
    if (isNaN(tvShowId)) {
      return NextResponse.json({ error: 'Invalid TV show ID' }, { status: 400 })
    }

    const { userId, rating, review } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (rating && (rating < 1 || rating > 10)) {
      return NextResponse.json({ error: 'Rating must be between 1 and 10' }, { status: 400 })
    }

    const tvReview = await prisma.tvReview.upsert({
      where: {
        tvShowId_userId: {
          tvShowId: tvShowId,
          userId: parseInt(userId, 10)
        }
      },
      update: {
        rating: rating || null,
        review: review || null,
        updatedAt: new Date()
      },
      create: {
        tvShowId: tvShowId,
        userId: parseInt(userId, 10),
        rating: rating || null,
        review: review || null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Create operation log
    await prisma.operationLog.create({
      data: {
        userId: parseInt(userId, 10),
        action: 'CREATE_REVIEW',
        entityType: 'TV_SHOW',
        entityId: tvShowId,
        tvShowId: tvShowId,
        description: `${rating ? '评分' : ''}${review ? '评论' : ''}电视剧`,
      }
    })

    return NextResponse.json({ review: tvReview })
  } catch (error) {
    console.error('Error creating TV show review:', error)
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
  }
}

// Get TV show reviews
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

    const reviews = await prisma.tvReview.findMany({
      where: { tvShowId: tvShowId },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error('Error fetching TV show reviews:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

// Delete a TV show review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tvShowId = parseInt(id, 10)
    
    if (isNaN(tvShowId)) {
      return NextResponse.json({ error: 'Invalid TV show ID' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    await prisma.tvReview.delete({
      where: {
        tvShowId_userId: {
          tvShowId: tvShowId,
          userId: parseInt(userId, 10)
        }
      }
    })

    // Create operation log
    await prisma.operationLog.create({
      data: {
        userId: parseInt(userId, 10),
        action: 'DELETE_REVIEW',
        entityType: 'TV_SHOW',
        entityId: tvShowId,
        tvShowId: tvShowId,
        description: '删除电视剧评论',
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting TV show review:', error)
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 })
  }
}