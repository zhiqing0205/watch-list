import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { WatchStatus } from '@prisma/client'

// Update watch status for a TV show
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tvShowId = parseInt(id, 10)
    
    if (isNaN(tvShowId)) {
      return NextResponse.json({ error: 'Invalid TV show ID' }, { status: 400 })
    }

    const { watchStatus, userId } = await request.json()

    if (!watchStatus || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!Object.values(WatchStatus).includes(watchStatus)) {
      return NextResponse.json({ error: 'Invalid watch status' }, { status: 400 })
    }

    const tvShow = await prisma.tvShow.update({
      where: { id: tvShowId },
      data: { watchStatus }
    })

    // Create operation log
    await prisma.operationLog.create({
      data: {
        userId: parseInt(userId, 10),
        action: 'UPDATE_WATCH_STATUS',
        entityType: 'TV_SHOW',
        entityId: tvShow.id,
        tvShowId: tvShow.id,
        description: `更新电视剧观看状态: ${tvShow.name} -> ${watchStatus}`,
      }
    })

    return NextResponse.json({ tvShow })
  } catch (error) {
    console.error('Error updating TV show watch status:', error)
    return NextResponse.json({ error: 'Failed to update watch status' }, { status: 500 })
  }
}

// Get TV show watch status
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

    const tvShow = await prisma.tvShow.findUnique({
      where: { id: tvShowId },
      select: {
        id: true,
        name: true,
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

    if (!tvShow) {
      return NextResponse.json({ error: 'TV show not found' }, { status: 404 })
    }

    return NextResponse.json({ tvShow })
  } catch (error) {
    console.error('Error fetching TV show watch status:', error)
    return NextResponse.json({ error: 'Failed to fetch TV show' }, { status: 500 })
  }
}