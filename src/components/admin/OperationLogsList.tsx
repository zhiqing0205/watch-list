'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { User, Film, Tv, Users, Calendar, MessageSquare, Database, Settings } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Pagination } from '@/components/ui/Pagination'

interface OperationLog {
  id: number
  userId: number
  operatorName: string
  action: string
  entityType: string
  resourceId: number | null
  resourceName: string | null
  resourceType: string | null
  description: string | null
  metadata: any
  createdAt: Date
  user: {
    name: string
    username: string
    email: string | null
  }
}

interface OperationLogsListProps {
  initialLogs: OperationLog[]
  totalCount: number
}

const ITEMS_PER_PAGE = 20

export function OperationLogsList({ initialLogs, totalCount }: OperationLogsListProps) {
  const [logs, setLogs] = useState<OperationLog[]>(initialLogs)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  const fetchLogs = async (page: number) => {
    if (page === 1 && logs.length > 0) return // Already have first page data
    
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/logs?page=${page}&limit=${ITEMS_PER_PAGE}`)
      const data = await response.json()
      setLogs(data.logs)
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchLogs(page)
  }

  const getEntityIcon = (entityType: string, resourceType?: string) => {
    const type = resourceType || entityType;
    
    switch (type) {
      case 'MOVIE':
        return <Film className="h-4 w-4 text-blue-400" />
      case 'TV_SHOW':
        return <Tv className="h-4 w-4 text-green-400" />
      case 'ACTOR':
        return <Users className="h-4 w-4 text-purple-400" />
      case 'USER':
        return <User className="h-4 w-4 text-yellow-400" />
      case 'SYSTEM':
      case 'DATABASE':
        return <Database className="h-4 w-4 text-indigo-400" />
      default:
        return <Settings className="h-4 w-4 text-gray-400" />
    }
  }

  const getActionVariant = (action: string) => {
    if (action.includes('CREATE') || action.includes('IMPORT')) return 'default'
    if (action.includes('UPDATE')) return 'secondary'
    if (action.includes('DELETE')) return 'destructive'
    if (action.includes('BACKUP')) return 'outline'
    return 'outline'
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'IMPORT_FROM_TMDB':
      case 'IMPORT_MOVIE':
      case 'IMPORT_TV_SHOW':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'DELETE_CONTENT':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'UPDATE_CONTENT':
      case '更新观看状态':
      case '更新评分':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'LOGIN':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'LOGOUT':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'SCHEDULED_BACKUP':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'PROCESS_IMAGES':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
    }
  }

  const formatActionText = (action: string) => {
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

    return actionMap[action] || action.replace(/_/g, ' ');
  }

  const getResourceName = (log: OperationLog) => {
    if (log.resourceName) {
      return log.resourceName;
    }
    
    if (log.resourceId) {
      return `ID: ${log.resourceId}`;
    }
    
    return '-';
  }

  if (logs.length === 0) {
    return (
      <div className="space-y-4">
        <Card className="bg-white dark:bg-slate-800/50 backdrop-blur-sm border-slate-200 dark:border-slate-700">
          <CardContent className="text-center py-8">
            <p className="text-slate-600 dark:text-slate-400">暂无操作日志</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="bg-white dark:bg-slate-800/50 backdrop-blur-sm border-slate-200 dark:border-slate-700 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-50">操作日志</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading && (
            <div className="absolute inset-0 bg-white dark:bg-slate-800/50 flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}
          <div className="overflow-x-auto scrollbar-custom relative">
            <table className="w-full">
              <thead className="bg-slate-100 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    操作员
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    操作
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    资源
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    描述
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <Calendar className="h-4 w-4" />
                        <div>
                          <div>{format(new Date(log.createdAt), 'MM-dd HH:mm', { locale: zhCN })}</div>
                          <div className="text-xs text-slate-500">
                            {format(new Date(log.createdAt), 'yyyy', { locale: zhCN })}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <UserAvatar 
                        name={log.user?.name || log.operatorName} 
                        username={log.user?.username || log.operatorName} 
                        size="sm" 
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={`text-xs ${getActionColor(log.action)}`}>
                        {formatActionText(log.action)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getEntityIcon(log.entityType, log.resourceType)}
                        <div className="text-sm text-slate-900 dark:text-slate-50 max-w-32 truncate" title={getResourceName(log)}>
                          {getResourceName(log)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-700 dark:text-slate-300 max-w-64">
                        {log.description || '-'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalItems={totalCount}
        itemsPerPage={ITEMS_PER_PAGE}
      />
    </div>
  )
}