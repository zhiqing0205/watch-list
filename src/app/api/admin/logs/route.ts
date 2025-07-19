import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

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
            username: true,
            email: true,
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
    const { action, entityType, resourceId, resourceName, resourceType, description, metadata } = await request.json()

    if (!action || !entityType) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // Convert resourceId to integer if provided
    let numericResourceId: number | null = null
    if (resourceId) {
      numericResourceId = parseInt(resourceId, 10)
      if (isNaN(numericResourceId)) {
        return NextResponse.json(
          { error: '无效的资源ID' },
          { status: 400 }
        )
      }
    }

    // Get user info from cookies or session
    let userId = 1 // Default admin user ID
    let operatorName = 'SYSTEM'

    // Try to get user from cookies if available
    const cookieStore = cookies()
    const userCookie = cookieStore.get('user')
    if (userCookie) {
      try {
        const user = JSON.parse(userCookie.value)
        userId = user.id
        operatorName = user.username || user.name || 'Unknown'
      } catch (e) {
        // Use default if parsing fails
      }
    }

    // Prepare the data object with new schema
    const logData: any = {
      action,
      entityType,
      resourceId: numericResourceId,
      resourceName,
      resourceType,
      description,
      metadata,
      userId,
      operatorName,
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