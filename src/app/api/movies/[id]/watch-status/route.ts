import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { WatchStatus } from '@prisma/client'

// Update watch status for a movie
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { watchStatus, userId } = await request.json()

    if (!watchStatus || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!Object.values(WatchStatus).includes(watchStatus)) {
      return NextResponse.json({ error: 'Invalid watch status' }, { status: 400 })
    }

    const movie = await prisma.movie.update({
      where: { id: params.id },
      data: { watchStatus }
    })

    // Create operation log
    await prisma.operationLog.create({
      data: {
        userId,
        action: 'UPDATE_WATCH_STATUS',
        entityType: 'MOVIE',
        entityId: movie.id,
        movieId: movie.id,
        description: `更新电影观看状态: ${movie.title} -> ${watchStatus}`,
      }
    })

    return NextResponse.json({ movie })
  } catch (error) {
    console.error('Error updating movie watch status:', error)
    return NextResponse.json({ error: 'Failed to update watch status' }, { status: 500 })
  }
}

// Get movie watch status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const movie = await prisma.movie.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        watchStatus: true,
        reviews: {
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
        }
      }
    })

    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 })
    }

    return NextResponse.json({ movie })
  } catch (error) {
    console.error('Error fetching movie watch status:', error)
    return NextResponse.json({ error: 'Failed to fetch movie' }, { status: 500 })
  }
}