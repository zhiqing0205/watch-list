'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { User, Film, Tv, Users, Calendar, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Pagination } from '@/components/ui/Pagination'

interface OperationLog {
  id: string
  userId: string
  action: string
  entityType: string
  entityId: number
  description: string | null
  createdAt: Date
  user: {
    name: string
    email: string
  }
  movie?: {
    title: string
  } | null
  tvShow?: {
    name: string
  } | null
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

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'MOVIE':
        return <Film className="h-4 w-4 text-blue-400" />
      case 'TV_SHOW':
        return <Tv className="h-4 w-4 text-green-400" />
      case 'ACTOR':
        return <Users className="h-4 w-4 text-purple-400" />
      case 'USER':
        return <User className="h-4 w-4 text-yellow-400" />
      default:
        return <MessageSquare className="h-4 w-4 text-gray-400" />
    }
  }

  const getActionVariant = (action: string) => {
    if (action.includes('CREATE') || action.includes('IMPORT')) return 'default'
    if (action.includes('UPDATE')) return 'secondary'
    if (action.includes('DELETE')) return 'destructive'
    return 'outline'
  }

  const getEntityName = (log: any) => {
    if (log.movie) return log.movie.title
    if (log.tvShow) return log.tvShow.name
    return log.entityId ? `ID: ${String(log.entityId).slice(0, 8)}...` : '-'
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
                    用户
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    操作
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    类型
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    对象
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
                      <div className="text-sm">
                        <div className="text-slate-900 dark:text-slate-50 font-medium">{log.user.name}</div>
                        <div className="text-slate-600 dark:text-slate-400 text-xs">{log.user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getActionVariant(log.action)} className="text-xs">
                        {log.action.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getEntityIcon(log.entityType)}
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {log.entityType.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900 dark:text-slate-50 max-w-32 truncate">
                        {getEntityName(log)}
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