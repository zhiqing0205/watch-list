import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Create or update a movie review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const movieId = parseInt(id, 10)
    
    if (isNaN(movieId)) {
      return NextResponse.json({ error: 'Invalid movie ID' }, { status: 400 })
    }

    const { userId, rating, review } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (rating && (rating < 1 || rating > 10)) {
      return NextResponse.json({ error: 'Rating must be between 1 and 10' }, { status: 400 })
    }

    const movieReview = await prisma.movieReview.upsert({
      where: {
        movieId_userId: {
          movieId: movieId,
          userId: parseInt(userId, 10)
        }
      },
      update: {
        rating: rating || null,
        review: review || null,
        updatedAt: new Date()
      },
      create: {
        movieId: movieId,
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
        entityType: 'MOVIE',
        entityId: movieId,
        movieId: movieId,
        description: `${rating ? '评分' : ''}${review ? '评论' : ''}电影`,
      }
    })

    return NextResponse.json({ review: movieReview })
  } catch (error) {
    console.error('Error creating movie review:', error)
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
  }
}

// Get movie reviews
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

    const reviews = await prisma.movieReview.findMany({
      where: { movieId: movieId },
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
    console.error('Error fetching movie reviews:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

// Delete a movie review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const movieId = parseInt(id, 10)
    
    if (isNaN(movieId)) {
      return NextResponse.json({ error: 'Invalid movie ID' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    await prisma.movieReview.delete({
      where: {
        movieId_userId: {
          movieId: movieId,
          userId: parseInt(userId, 10)
        }
      }
    })

    // Create operation log
    await prisma.operationLog.create({
      data: {
        userId: parseInt(userId, 10),
        action: 'DELETE_REVIEW',
        entityType: 'MOVIE',
        entityId: movieId,
        movieId: movieId,
        description: '删除电影评论',
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting movie review:', error)
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 })
  }
}