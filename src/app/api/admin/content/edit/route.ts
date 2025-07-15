import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-server'
import { logOperation, LOG_ACTIONS } from '@/lib/operation-logger'
import { EntityType } from '@prisma/client'

export async function PATCH(request: NextRequest) {
  try {
    // 验证用户认证和权限
    const user = requireAdmin(request)

    const { id, type, data } = await request.json()

    if (!id || !type || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: id, type, data' },
        { status: 400 }
      )
    }

    let updatedContent
    if (type === 'movie') {
      updatedContent = await prisma.movie.update({
        where: { id: parseInt(id) },
        data
      })
      
      // 记录操作日志
      await logOperation({
        userId: user.userId,
        action: LOG_ACTIONS.UPDATE_CONTENT,
        entityType: EntityType.MOVIE,
        entityId: parseInt(id),
        movieId: parseInt(id),
        description: `编辑电影《${updatedContent.title}》的信息`,
      })
    } else if (type === 'tv') {
      updatedContent = await prisma.tvShow.update({
        where: { id: parseInt(id) },
        data
      })
      
      // 记录操作日志
      await logOperation({
        userId: user.userId,
        action: LOG_ACTIONS.UPDATE_CONTENT,
        entityType: EntityType.TV_SHOW,
        entityId: parseInt(id),
        tvShowId: parseInt(id),
        description: `编辑电视剧《${updatedContent.name}》的信息`,
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
    console.error('Error updating content:', error)
    
    if (error instanceof Error && (error.message === 'Authentication required' || error.message === 'Admin access required')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    )
  }
}