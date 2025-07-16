import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logAdminOperation, LOG_ACTIONS, LogDescriptionBuilder } from '@/lib/operation-logger'
import { EntityType } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { action, cronExpression, enabled } = await request.json()
    
    if (action === 'configure') {
      // 配置定时任务
      // 在实际应用中，你需要配置一个真正的cron job系统
      // 这里只是模拟保存配置
      
      // 记录配置更改的日志
      await logAdminOperation({
        action: LOG_ACTIONS.SCHEDULE_METADATA_UPDATE,
        entityType: EntityType.MOVIE, // 使用MOVIE作为默认类型
        description: LogDescriptionBuilder.scheduledUpdate(cronExpression, enabled)
      })
      
      return NextResponse.json({
        success: true,
        message: enabled ? 'Scheduled task enabled' : 'Scheduled task disabled',
        cronExpression,
        enabled
      })
    }
    
    // 为 Vercel Cron Jobs 添加支持
    // 如果没有 action 参数，说明是 Vercel Cron 调用
    if (!action) {
      // 检查是否启用定时更新
      const isEnabled = process.env.TMDB_AUTO_UPDATE_ENABLED === 'true'
      
      if (!isEnabled) {
        return NextResponse.json({
          success: false,
          message: 'Scheduled update is disabled'
        })
      }
      
      // 执行定时任务 - 刷新所有内容的TMDB元数据
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      const refreshResponse = await fetch(`${baseUrl}/api/admin/content/refresh-tmdb`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshAll: true
        })
      })
      
      if (refreshResponse.ok) {
        const result = await refreshResponse.json()
        
        // 记录定时任务执行日志
        await logAdminOperation({
          action: LOG_ACTIONS.SCHEDULE_METADATA_UPDATE,
          entityType: EntityType.MOVIE,
          description: `Scheduled TMDB refresh completed: ${result.results.success} success, ${result.results.failed} failed`
        })
        
        return NextResponse.json({
          success: true,
          message: 'Scheduled refresh completed',
          results: result.results
        })
      } else {
        throw new Error('Failed to execute scheduled refresh')
      }
    }
    
    if (action === 'execute') {
      // 执行定时任务 - 刷新所有内容的TMDB元数据
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      const refreshResponse = await fetch(`${baseUrl}/api/admin/content/refresh-tmdb`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshAll: true
        })
      })
      
      if (refreshResponse.ok) {
        const result = await refreshResponse.json()
        
        // 记录定时任务执行日志
        await logAdminOperation({
          action: LOG_ACTIONS.SCHEDULE_METADATA_UPDATE,
          entityType: EntityType.MOVIE,
          description: `Scheduled TMDB refresh completed: ${result.results.success} success, ${result.results.failed} failed`
        })
        
        return NextResponse.json({
          success: true,
          message: 'Scheduled refresh completed',
          results: result.results
        })
      } else {
        throw new Error('Failed to execute scheduled refresh')
      }
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    
  } catch (error) {
    console.error('Error in scheduled task:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // 获取定时任务状态
    // 在实际应用中，你需要从数据库或配置文件中读取
    const cronStatus = {
      enabled: false,
      cronExpression: '0 2 * * *',
      lastRun: null,
      nextRun: null
    }
    
    return NextResponse.json(cronStatus)
  } catch (error) {
    console.error('Error getting cron status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}