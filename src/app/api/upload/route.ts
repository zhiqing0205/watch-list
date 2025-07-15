import { NextRequest, NextResponse } from 'next/server'
import { uploadFile, deleteFile, generateFilePath } from '@/lib/oss-server'
import { requireAdmin } from '@/lib/auth-server'
import { logOperation, LOG_ACTIONS } from '@/lib/operation-logger'
import { EntityType } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    // 验证用户认证和权限
    const user = requireAdmin(request)
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string
    const id = formData.get('id') as string

    if (!file || !type || !id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['movie', 'tv', 'actor'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    const path = generateFilePath(type as 'movie' | 'tv' | 'actor', id, file.name)
    const url = await uploadFile(file, path)

    // 记录操作日志
    await logOperation({
      userId: user.userId,
      action: LOG_ACTIONS.UPLOAD_IMAGE,
      entityType: type === 'movie' ? EntityType.MOVIE : type === 'tv' ? EntityType.TV_SHOW : EntityType.ACTOR,
      entityId: parseInt(id),
      movieId: type === 'movie' ? parseInt(id) : undefined,
      tvShowId: type === 'tv' ? parseInt(id) : undefined,
      description: `上传${type === 'movie' ? '电影' : type === 'tv' ? '电视剧' : '演员'}图片: ${file.name}`,
    })

    return NextResponse.json({ url })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Authentication required' || error.message === 'Admin access required')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 验证用户认证和权限
    const user = requireAdmin(request)
    
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')

    if (!path) {
      return NextResponse.json({ error: 'Path parameter is required' }, { status: 400 })
    }

    await deleteFile(path)
    
    // 记录操作日志
    await logOperation({
      userId: user.userId,
      action: 'DELETE_IMAGE',
      entityType: EntityType.USER, // 文件删除操作
      description: `删除文件: ${path}`,
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Authentication required' || error.message === 'Admin access required')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error deleting file:', error)
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
  }
}