import { NextRequest, NextResponse } from 'next/server'
import { importMovieFromTMDb, importTVShowFromTMDb } from '@/lib/tmdb-import'
import { requireAdmin } from '@/lib/auth-server'
import { logOperation, LOG_ACTIONS } from '@/lib/operation-logger'
import { EntityType } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    // 验证用户认证和权限
    const user = requireAdmin(request)
    
    const { tmdbId, type } = await request.json()

    if (!tmdbId || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['movie', 'tv'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    let result
    if (type === 'movie') {
      result = await importMovieFromTMDb(tmdbId, user.userId)
      
      // 记录操作日志
      await logOperation({
        userId: user.userId,
        action: LOG_ACTIONS.IMPORT_FROM_TMDB,
        entityType: EntityType.MOVIE,
        entityId: result.id,
        movieId: result.id,
        description: `从 TMDb 导入电影《${result.title}》 (TMDb ID: ${tmdbId})`,
      })
    } else {
      result = await importTVShowFromTMDb(tmdbId, user.userId)
      
      // 记录操作日志
      await logOperation({
        userId: user.userId,
        action: LOG_ACTIONS.IMPORT_FROM_TMDB,
        entityType: EntityType.TV_SHOW,
        entityId: result.id,
        tvShowId: result.id,
        description: `从 TMDb 导入电视剧《${result.name}》 (TMDb ID: ${tmdbId})`,
      })
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    if (error instanceof Error && (error.message === 'Authentication required' || error.message === 'Admin access required')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error importing content:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to import content' 
    }, { status: 500 })
  }
}