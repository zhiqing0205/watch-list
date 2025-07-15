import { prisma } from '@/lib/prisma'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { Clock, User, Film, Tv, Users, ExternalLink } from 'lucide-react'
import Link from 'next/link'

// 配置 dayjs
dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

export async function RecentActivity() {
  const recentLogs = await prisma.operationLog.findMany({
    include: {
      user: true,
      movie: true,
      tvShow: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  })

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'MOVIE':
        return <Film className="h-4 w-4" />
      case 'TV_SHOW':
        return <Tv className="h-4 w-4" />
      case 'ACTOR':
        return <Users className="h-4 w-4" />
      case 'USER':
        return <User className="h-4 w-4" />
      default:
        return null
    }
  }

  const getEntityName = (log: any) => {
    if (log.movie) return log.movie.title
    if (log.tvShow) return log.tvShow.name
    return String(log.entityId).slice(0, 8)
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
              {/* 用户名 */}
              <div className="col-span-2">
                <span className="text-slate-900 dark:text-slate-50 font-medium text-sm truncate block" title={log.user.name}>
                  {log.user.name}
                </span>
              </div>
              
              {/* 图标 + 影视剧名字 */}
              <div className="col-span-4 flex items-center gap-2">
                <div className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full flex-shrink-0">
                  {getEntityIcon(log.entityType)}
                </div>
                <span className="text-slate-700 dark:text-slate-300 text-sm truncate" title={getEntityName(log)}>
                  {getEntityName(log)}
                </span>
              </div>
              
              {/* 描述 */}
              <div className="col-span-4">
                <span className="text-slate-600 dark:text-slate-400 text-sm truncate block" title={log.description || log.action}>
                  {log.description || log.action}
                </span>
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