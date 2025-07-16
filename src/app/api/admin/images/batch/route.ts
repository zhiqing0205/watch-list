import { NextRequest, NextResponse } from 'next/server'
import { batchProcessImages } from '@/lib/image-processor'
import { requireAdmin } from '@/lib/auth-server'
import { logOperation, LOG_ACTIONS } from '@/lib/operation-logger'
import { EntityType } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    // 验证用户认证和权限
    const user = requireAdmin(request)
    
    const { limit } = await request.json()

    const results = await batchProcessImages(limit || 10)

    // 记录操作日志
    await logOperation({
      userId: user.userId,
      action: LOG_ACTIONS.PROCESS_IMAGES,
      entityType: EntityType.USER,
      description: `批量处理图片，处理内容: ${results.processedContent}个，处理演员: ${results.processedActors}个，错误: ${results.errors.length}个`,
    })

    return NextResponse.json({
      success: true,
      results: {
        processedContent: results.processedContent,
        processedActors: results.processedActors,
        errors: results.errors
      }
    })
  } catch (error: any) {
    if (error instanceof Error && (error.message === 'Authentication required' || error.message === 'Admin access required')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error in batch processing:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to batch process images' 
    }, { status: 500 })
  }
}