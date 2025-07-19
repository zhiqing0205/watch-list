import { prisma } from '@/lib/prisma'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { Clock, User, Film, Tv, Users, ExternalLink, Settings, Database } from 'lucide-react'
import { UserAvatar } from '@/components/ui/user-avatar'
import Link from 'next/link'

// 配置 dayjs
dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

export async function RecentActivity() {
  const recentLogs = await prisma.operationLog.findMany({
    include: {
      user: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  })

  const getEntityIcon = (entityType: string, resourceType?: string) => {
    // 优先使用resourceType，回退到entityType
    const type = resourceType || entityType;
    
    switch (type) {
      case 'MOVIE':
        return <Film className="h-4 w-4" />
      case 'TV_SHOW':
        return <Tv className="h-4 w-4" />
      case 'ACTOR':
        return <Users className="h-4 w-4" />
      case 'USER':
        return <User className="h-4 w-4" />
      case 'SYSTEM':
      case 'DATABASE':
        return <Database className="h-4 w-4" />
      default:
        return <Settings className="h-4 w-4" />
    }
  }

  const getResourceName = (log: any) => {
    // 使用新的resourceName字段，如果没有则使用描述的一部分
    if (log.resourceName) {
      return log.resourceName;
    }
    
    // 从描述中提取资源名称（兼容旧数据）
    if (log.description) {
      const match = log.description.match(/《([^》]+)》/);
      if (match) {
        return match[1];
      }
      
      // 如果描述太长，截取前20个字符
      if (log.description.length > 20) {
        return log.description.substring(0, 20) + '...';
      }
      
      return log.description;
    }
    
    return log.action || '未知操作';
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'IMPORT_FROM_TMDB':
      case 'IMPORT_MOVIE':
      case 'IMPORT_TV_SHOW':
        return 'text-green-600 dark:text-green-400';
      case 'DELETE_CONTENT':
        return 'text-red-600 dark:text-red-400';
      case 'UPDATE_CONTENT':
      case '更新观看状态':
      case '更新评分':
        return 'text-blue-600 dark:text-blue-400';
      case 'LOGIN':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'LOGOUT':
        return 'text-orange-600 dark:text-orange-400';
      case 'SCHEDULED_BACKUP':
        return 'text-purple-600 dark:text-purple-400';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  }

  const formatActionText = (action: string, description?: string) => {
    // 映射操作类型到中文显示
    const actionMap: { [key: string]: string } = {
      'IMPORT_FROM_TMDB': '导入内容',
      'IMPORT_MOVIE': '导入电影',
      'IMPORT_TV_SHOW': '导入电视剧',
      'DELETE_CONTENT': '删除内容',
      'UPDATE_CONTENT': '更新内容',
      'TOGGLE_VISIBILITY': '切换显示',
      'PROCESS_IMAGES': '处理图片',
      'LOGIN': '登录',
      'LOGOUT': '登出',
      'SCHEDULED_BACKUP': '定时备份',
      'BACKUP_FAILED': '备份失败',
      'REFRESH_TMDB_METADATA': '刷新元数据'
    };

    return actionMap[action] || action;
  }

  if (recentLogs.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm h-full flex flex-col">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">最近活动</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-600 dark:text-slate-400">暂无活动记录</p>
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
          <Link 
            href="/admin/logs" 
            className="flex items-center justify-center gap-2 w-full py-2 px-4 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <span>查看全部日志</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm h-full flex flex-col">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">最近活动</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-custom min-h-0">
        <div className="p-4">
          {recentLogs.map((log) => (
            <div key={log.id} className="grid grid-cols-12 gap-3 items-center py-3 px-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors border-b border-slate-100 dark:border-slate-700 last:border-b-0">
              {/* 用户信息 */}
              <div className="col-span-2">
                <UserAvatar 
                  name={log.user?.name || log.operatorName} 
                  username={log.user?.username || log.operatorName} 
                  size="sm" 
                  className="w-full"
                />
              </div>
              
              {/* 图标 + 资源名称 */}
              <div className="col-span-4 flex items-center gap-2">
                <div className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full flex-shrink-0">
                  {getEntityIcon(log.entityType, log.resourceType)}
                </div>
                <span className="text-slate-700 dark:text-slate-300 text-sm truncate" title={getResourceName(log)}>
                  {getResourceName(log)}
                </span>
              </div>
              
              {/* 操作描述 */}
              <div className="col-span-4">
                <div className="flex flex-col">
                  <span className={`text-sm font-medium ${getActionColor(log.action)}`}>
                    {formatActionText(log.action)}
                  </span>
                  {log.description && log.description !== log.action && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate" title={log.description}>
                      {log.description}
                    </span>
                  )}
                </div>
              </div>
              
              {/* 相对时间 */}
              <div className="col-span-2 flex items-center gap-1 text-slate-500 dark:text-slate-400 justify-end">
                <Clock className="h-3 w-3" />
                <span className="text-xs whitespace-nowrap" title={dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss')}>
                  {dayjs(log.createdAt).fromNow()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 查看全部日志 - 固定在底部 */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
        <Link 
          href="/admin/logs" 
          className="flex items-center justify-center gap-2 w-full py-2 px-4 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
        >
          <span>查看全部日志</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}