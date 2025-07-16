import { prisma } from '@/lib/prisma'
import { EntityType } from '@prisma/client'

export interface LogOperationParams {
  userId: number
  action: string
  entityType: EntityType
  entityId?: number
  movieId?: number
  tvShowId?: number
  description?: string
  details?: Record<string, any>
}

export async function logOperation(params: LogOperationParams) {
  try {
    await prisma.operationLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        movieId: params.movieId,
        tvShowId: params.tvShowId,
        description: params.description || `${params.action} ${params.entityType}`,
      }
    })
  } catch (error) {
    console.error('Failed to log operation:', error)
    // 不抛出错误，避免影响主要功能
  }
}

// 常用的日志操作常量
export const LOG_ACTIONS = {
  // 内容管理
  CREATE_CONTENT: 'CREATE_CONTENT',
  UPDATE_CONTENT: 'UPDATE_CONTENT',
  DELETE_CONTENT: 'DELETE_CONTENT',
  TOGGLE_VISIBILITY: 'TOGGLE_VISIBILITY',
  
  // 批量操作
  BATCH_UPDATE_STATUS: 'BATCH_UPDATE_STATUS',
  BATCH_TOGGLE_VISIBILITY: 'BATCH_TOGGLE_VISIBILITY',
  BATCH_DELETE: 'BATCH_DELETE',
  
  // 图片管理
  PROCESS_IMAGES: 'PROCESS_IMAGES',
  BATCH_PROCESS_IMAGES: 'BATCH_PROCESS_IMAGES',
  UPLOAD_IMAGE: 'UPLOAD_IMAGE',
  DELETE_IMAGE: 'DELETE_IMAGE',
  
  // 观看状态
  UPDATE_WATCH_STATUS: 'UPDATE_WATCH_STATUS',
  UPDATE_RATING: 'UPDATE_RATING',
  
  // 导入操作
  IMPORT_FROM_TMDB: 'IMPORT_FROM_TMDB',
  BATCH_IMPORT: 'BATCH_IMPORT',
  
  // 元数据管理
  REFRESH_TMDB_METADATA: 'REFRESH_TMDB_METADATA',
  BATCH_REFRESH_TMDB: 'BATCH_REFRESH_TMDB',
  SCHEDULE_METADATA_UPDATE: 'SCHEDULE_METADATA_UPDATE',
  
  // 用户认证
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_INIT: 'USER_INIT',
  
  // 评论管理
  CREATE_REVIEW: 'CREATE_REVIEW',
  UPDATE_REVIEW: 'UPDATE_REVIEW',
  DELETE_REVIEW: 'DELETE_REVIEW',
} as const

export type LogAction = typeof LOG_ACTIONS[keyof typeof LOG_ACTIONS]

// 观看状态标准化
export const WATCH_STATUS_LABELS = {
  UNWATCHED: 'Unwatched',
  WATCHING: 'Watching',
  WATCHED: 'Watched',
  DROPPED: 'Dropped',
} as const

// 日志描述生成器
export class LogDescriptionBuilder {
  /**
   * 生成单个操作的日志描述
   */
  static single(action: string, entityType: EntityType, entityName: string, details?: string): string {
    const typeLabel = entityType === 'MOVIE' ? 'movie' : 'TV show'
    const baseDescription = `${action} ${typeLabel} "${entityName}"`
    return details ? `${baseDescription} ${details}` : baseDescription
  }

  /**
   * 生成批量操作的日志描述
   */
  static batch(action: string, entityType: EntityType, entityName: string, totalCount: number, details?: string): string {
    const typeLabel = entityType === 'MOVIE' ? 'movie' : 'TV show'
    const baseDescription = `Batch ${action} ${typeLabel} "${entityName}" (${totalCount} items)`
    return details ? `${baseDescription} ${details}` : baseDescription
  }

  /**
   * 生成观看状态更新的日志描述
   */
  static watchStatus(entityType: EntityType, entityName: string, oldStatus: string, newStatus: string): string {
    const typeLabel = entityType === 'MOVIE' ? 'movie' : 'TV show'
    const oldLabel = WATCH_STATUS_LABELS[oldStatus as keyof typeof WATCH_STATUS_LABELS] || oldStatus
    const newLabel = WATCH_STATUS_LABELS[newStatus as keyof typeof WATCH_STATUS_LABELS] || newStatus
    return `Updated ${typeLabel} "${entityName}" watch status from ${oldLabel} to ${newLabel}`
  }

  /**
   * 生成批量观看状态更新的日志描述
   */
  static batchWatchStatus(entityType: EntityType, entityName: string, newStatus: string, totalCount: number): string {
    const typeLabel = entityType === 'MOVIE' ? 'movie' : 'TV show'
    const statusLabel = WATCH_STATUS_LABELS[newStatus as keyof typeof WATCH_STATUS_LABELS] || newStatus
    return `Batch updated ${typeLabel} "${entityName}" watch status to ${statusLabel} (${totalCount} items)`
  }

  /**
   * 生成可见性切换的日志描述
   */
  static visibility(entityType: EntityType, entityName: string, isVisible: boolean): string {
    const typeLabel = entityType === 'MOVIE' ? 'movie' : 'TV show'
    const action = isVisible ? 'shown' : 'hidden'
    return `${typeLabel} "${entityName}" has been ${action}`
  }

  /**
   * 生成批量可见性切换的日志描述
   */
  static batchVisibility(entityType: EntityType, entityName: string, isVisible: boolean, totalCount: number): string {
    const typeLabel = entityType === 'MOVIE' ? 'movie' : 'TV show'
    const action = isVisible ? 'shown' : 'hidden'
    return `Batch ${action} ${typeLabel} "${entityName}" (${totalCount} items)`
  }

  /**
   * 生成删除的日志描述
   */
  static delete(entityType: EntityType, entityName: string): string {
    const typeLabel = entityType === 'MOVIE' ? 'movie' : 'TV show'
    return `Deleted ${typeLabel} "${entityName}"`
  }

  /**
   * 生成批量删除的日志描述
   */
  static batchDelete(entityType: EntityType, entityName: string, totalCount: number): string {
    const typeLabel = entityType === 'MOVIE' ? 'movie' : 'TV show'
    return `Batch deleted ${typeLabel} "${entityName}" (${totalCount} items)`
  }

  /**
   * 生成评分更新的日志描述
   */
  static rating(entityType: EntityType, entityName: string, oldRating: number | null, newRating: number | null): string {
    const typeLabel = entityType === 'MOVIE' ? 'movie' : 'TV show'
    if (oldRating === null && newRating !== null) {
      return `Set ${typeLabel} "${entityName}" rating to ${newRating}`
    } else if (oldRating !== null && newRating === null) {
      return `Removed ${typeLabel} "${entityName}" rating`
    } else if (oldRating !== null && newRating !== null) {
      return `Updated ${typeLabel} "${entityName}" rating from ${oldRating} to ${newRating}`
    }
    return `Updated ${typeLabel} "${entityName}" rating`
  }

  /**
   * 生成图片处理的日志描述
   */
  static imageProcessing(entityType: EntityType, entityName: string, isBatch: boolean = false): string {
    const typeLabel = entityType === 'MOVIE' ? 'movie' : 'TV show'
    const action = isBatch ? 'Batch processed' : 'Processed'
    return `${action} images for ${typeLabel} "${entityName}"`
  }

  /**
   * 生成TMDB元数据刷新的日志描述
   */
  static tmdbRefresh(entityType: EntityType, entityName: string, isBatch: boolean = false): string {
    const typeLabel = entityType === 'MOVIE' ? 'movie' : 'TV show'
    const action = isBatch ? 'Batch refreshed' : 'Refreshed'
    return `${action} TMDB metadata for ${typeLabel} "${entityName}"`
  }

  /**
   * 生成定时任务的日志描述
   */
  static scheduledUpdate(cronExpression: string, isEnabled: boolean): string {
    const action = isEnabled ? 'Enabled' : 'Disabled'
    return `${action} scheduled TMDB metadata update (${cronExpression})`
  }
}

// 便捷的日志记录函数，自动获取用户ID
export async function logAdminOperation(params: Omit<LogOperationParams, 'userId'>) {
  // 这里可以从session或cookie中获取用户ID
  // 暂时使用默认管理员ID
  const userId = 1
  
  return logOperation({
    ...params,
    userId,
  })
}