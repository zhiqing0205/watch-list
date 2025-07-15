import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const logs = await prisma.operationLog.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        movie: {
          select: {
            title: true,
          },
        },
        tvShow: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    })

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Failed to fetch logs:', error)
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, entityType, entityId, description } = await request.json()

    if (!action || !entityType) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // Convert entityId to integer if provided
    let numericEntityId: number | null = null
    if (entityId) {
      numericEntityId = parseInt(entityId, 10)
      if (isNaN(numericEntityId)) {
        return NextResponse.json(
          { error: '无效的实体ID' },
          { status: 400 }
        )
      }
    }

    // Get user info from cookies or session
    // For now, we'll use a default admin user
    let userId = 1 // Default admin user ID

    // Try to get user from cookies if available
    const cookieStore = cookies()
    const userCookie = cookieStore.get('user')
    if (userCookie) {
      try {
        const user = JSON.parse(userCookie.value)
        userId = user.id
      } catch (e) {
        // Use default if parsing fails
      }
    }

    // Prepare the data object based on entity type
    const logData: any = {
      action,
      entityType,
      description,
      userId,
    }

    // Set the appropriate foreign key based on entity type
    if (numericEntityId) {
      logData.entityId = numericEntityId
      
      if (entityType === 'MOVIE') {
        logData.movieId = numericEntityId
      } else if (entityType === 'TV_SHOW') {
        logData.tvShowId = numericEntityId
      }
    }

    await prisma.operationLog.create({
      data: logData
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Log operation error:', error)
    return NextResponse.json(
      { error: '记录日志失败' },
      { status: 500 }
    )
  }
}