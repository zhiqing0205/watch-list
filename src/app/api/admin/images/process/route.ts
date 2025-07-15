import { NextRequest, NextResponse } from 'next/server'
import { processContentImages } from '@/lib/image-processor'
import { requireAdmin } from '@/lib/auth-server'
import { logOperation, LOG_ACTIONS } from '@/lib/operation-logger'
import { EntityType } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    // 验证用户认证和权限
    const user = requireAdmin(request)
    
    const { contentId, contentType } = await request.json()

    if (!contentId || !contentType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['movie', 'tv'].includes(contentType)) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
    }

    await processContentImages(contentId, contentType as 'movie' | 'tv')

    // 记录操作日志
    const description = `处理${contentType === 'movie' ? '电影' : '电视剧'}图片完成`
    
    await logOperation({
      userId: user.userId,
      action: LOG_ACTIONS.PROCESS_IMAGES,
      entityType: contentType === 'movie' ? EntityType.MOVIE : EntityType.TV_SHOW,
      entityId: parseInt(contentId),
      movieId: contentType === 'movie' ? parseInt(contentId) : undefined,
      tvShowId: contentType === 'tv' ? parseInt(contentId) : undefined,
      description,
    })

    return NextResponse.json({
      success: true,
      message: description
    })
  } catch (error: any) {
    if (error instanceof Error && (error.message === 'Authentication required' || error.message === 'Admin access required')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error processing images:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to process images' 
    }, { status: 500 })
  }
}