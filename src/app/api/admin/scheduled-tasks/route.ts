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
      console.log('🕒 开始执行定时任务...')
      
      try {
        // 1. 执行数据库备份
        console.log('📦 开始数据库备份...')
        const { scheduledBackup } = require('../../../../../scripts/scheduled-backup.js')
        await scheduledBackup()
        console.log('✅ 数据库备份完成')
        
        // 2. 检查是否启用TMDB更新
        const isTmdbUpdateEnabled = process.env.TMDB_AUTO_UPDATE_ENABLED === 'true'
        
        if (isTmdbUpdateEnabled) {
          console.log('🎬 开始TMDB元数据更新...')
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
            console.log(`✅ TMDB更新完成: ${result.results.success} 成功, ${result.results.failed} 失败`)
            
            // 记录定时任务执行日志
            await logAdminOperation({
              action: LOG_ACTIONS.SCHEDULE_METADATA_UPDATE,
              entityType: EntityType.SYSTEM,
              description: `定时任务完成: 数据库备份成功, TMDB更新 ${result.results.success} 成功 ${result.results.failed} 失败`
            })
          } else {
            console.warn('⚠️ TMDB更新失败')
          }
        } else {
          console.log('ℹ️ TMDB自动更新已禁用')
          
          // 记录定时任务执行日志（仅备份）
          await logAdminOperation({
            action: LOG_ACTIONS.SCHEDULE_METADATA_UPDATE,
            entityType: EntityType.SYSTEM,
            description: '定时任务完成: 数据库备份成功'
          })
        }
        
        return NextResponse.json({
          success: true,
          message: 'Scheduled tasks completed successfully',
          completed: {
            backup: true,
            tmdbUpdate: isTmdbUpdateEnabled
          }
        })
        
      } catch (backupError) {
        console.error('❌ 定时任务执行失败:', backupError)
        
        // 记录错误日志
        await logAdminOperation({
          action: 'SCHEDULED_TASK_FAILED',
          entityType: EntityType.SYSTEM,
          description: `定时任务失败: ${backupError.message}`
        })
        
        return NextResponse.json({
          success: false,
          message: 'Scheduled tasks failed',
          error: backupError.message
        }, { status: 500 })
      }
    }
    
    if (action === 'execute') {
      // 手动执行定时任务 - 刷新所有内容的TMDB元数据
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
          description: `手动执行TMDB刷新完成: ${result.results.success} 成功, ${result.results.failed} 失败`
        })
        
        return NextResponse.json({
          success: true,
          message: 'Manual refresh completed',
          results: result.results
        })
      } else {
        throw new Error('Failed to execute manual refresh')
      }
    }
    
    if (action === 'backup') {
      // 手动执行数据库备份
      try {
        const { scheduledBackup } = require('../../../../../scripts/scheduled-backup.js')
        await scheduledBackup()
        
        return NextResponse.json({
          success: true,
          message: 'Database backup completed successfully'
        })
      } catch (backupError) {
        console.error('备份失败:', backupError)
        return NextResponse.json({
          success: false,
          message: 'Database backup failed',
          error: backupError.message
        }, { status: 500 })
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