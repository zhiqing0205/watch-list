import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-server'
import { logOperation, LOG_ACTIONS } from '@/lib/operation-logger'
import { EntityType } from '@prisma/client'

export async function PATCH(request: NextRequest) {
  try {
    // 验证用户认证和权限
    const user = requireAdmin(request)

    const { id, type, isVisible } = await request.json()

    if (!id || !type || typeof isVisible !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: id, type, isVisible' },
        { status: 400 }
      )
    }

    let updatedContent
    if (type === 'movie') {
      updatedContent = await prisma.movie.update({
        where: { id: parseInt(id) },
        data: { isVisible }
      })
      
      // 记录操作日志
      await logOperation({
        userId: user.userId,
        action: LOG_ACTIONS.TOGGLE_VISIBILITY,
        entityType: EntityType.MOVIE,
        entityId: parseInt(id),
        movieId: parseInt(id),
        description: `${isVisible ? '显示' : '隐藏'}电影《${updatedContent.title}》`,
      })
    } else if (type === 'tv') {
      updatedContent = await prisma.tvShow.update({
        where: { id: parseInt(id) },
        data: { isVisible }
      })
      
      // 记录操作日志
      await logOperation({
        userId: user.userId,
        action: LOG_ACTIONS.TOGGLE_VISIBILITY,
        entityType: EntityType.TV_SHOW,
        entityId: parseInt(id),
        tvShowId: parseInt(id),
        description: `${isVisible ? '显示' : '隐藏'}电视剧《${updatedContent.name}》`,
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      content: updatedContent
    })
  } catch (error) {
    console.error('Error toggling visibility:', error)
    
    if (error instanceof Error && (error.message === 'Authentication required' || error.message === 'Admin access required')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Failed to update visibility' },
      { status: 500 }
    )
  }
}