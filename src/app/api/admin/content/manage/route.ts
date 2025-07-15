import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-server'

export async function PUT(request: NextRequest) {
  try {
    // 验证用户认证和权限
    const user = requireAdmin(request)
    
    const { id, type, data } = await request.json()

    if (!id || !type || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['movie', 'tv'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    let result
    if (type === 'movie') {
      result = await prisma.movie.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      })
    } else {
      result = await prisma.tvShow.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      })
    }

    // Create operation log
    await prisma.operationLog.create({
      data: {
        userId: user.userId,
        action: 'UPDATE_CONTENT',
        entityType: type === 'movie' ? 'MOVIE' : 'TV_SHOW',
        entityId: id,
        movieId: type === 'movie' ? id : undefined,
        tvShowId: type === 'tv' ? id : undefined,
        description: `更新${type === 'movie' ? '电影' : '电视剧'}信息`,
      }
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Authentication required' || error.message === 'Admin access required')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error updating content:', error)
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 验证用户认证和权限
    const user = requireAdmin(request)
    
    const { searchParams } = new URL(request.url)
    const idParam = searchParams.get('id')
    const type = searchParams.get('type')

    if (!idParam || !type) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    if (!['movie', 'tv'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    const id = parseInt(idParam, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    if (type === 'movie') {
      await prisma.movie.delete({
        where: { id }
      })
    } else {
      await prisma.tvShow.delete({
        where: { id }
      })
    }

    // Create operation log
    await prisma.operationLog.create({
      data: {
        userId: user.userId,
        action: 'DELETE_CONTENT',
        entityType: type === 'movie' ? 'MOVIE' : 'TV_SHOW',
        entityId: id,
        description: `删除${type === 'movie' ? '电影' : '电视剧'}`,
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Authentication required' || error.message === 'Admin access required')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error deleting content:', error)
    return NextResponse.json({ error: 'Failed to delete content' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // 验证用户认证和权限
    const user = requireAdmin(request)
    
    const { id, type, field, value } = await request.json()

    if (!id || !type || !field || value === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['movie', 'tv'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    let result
    if (type === 'movie') {
      result = await prisma.movie.update({
        where: { id },
        data: {
          [field]: value,
          updatedAt: new Date()
        }
      })
    } else {
      result = await prisma.tvShow.update({
        where: { id },
        data: {
          [field]: value,
          updatedAt: new Date()
        }
      })
    }

    // Create operation log
    await prisma.operationLog.create({
      data: {
        userId: user.userId,
        action: 'UPDATE_FIELD',
        entityType: type === 'movie' ? 'MOVIE' : 'TV_SHOW',
        entityId: id,
        movieId: type === 'movie' ? id : undefined,
        tvShowId: type === 'tv' ? id : undefined,
        description: `更新${type === 'movie' ? '电影' : '电视剧'}字段: ${field}`,
      }
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Authentication required' || error.message === 'Admin access required')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error updating field:', error)
    return NextResponse.json({ error: 'Failed to update field' }, { status: 500 })
  }
}