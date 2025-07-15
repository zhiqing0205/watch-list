import { Suspense } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { OperationLogsList } from '@/components/admin/OperationLogsList'
import { List, FileText } from 'lucide-react'
import { prisma } from '@/lib/prisma'

export default async function AdminLogs() {
  const ITEMS_PER_PAGE = 20
  
  // Get initial logs and total count
  const [logs, totalCount] = await Promise.all([
    prisma.operationLog.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        movie: {
          select: {
            title: true,
          },
        },
        tvShow: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: ITEMS_PER_PAGE,
    }),
    prisma.operationLog.count(),
  ])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      <AdminSidebar />
      <main className="flex-1 h-screen overflow-hidden flex flex-col">
        {/* 固定头部 */}
        <div className="flex-shrink-0 p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">操作日志</h1>
              <p className="text-slate-600 dark:text-slate-400">查看系统操作记录</p>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <FileText className="h-5 w-5" />
              <span>自动记录所有操作</span>
            </div>
          </div>
        </div>
        
        {/* 可滚动内容区域 */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto scrollbar-custom px-6 py-6">
            <div className="max-w-7xl mx-auto">
              <OperationLogsList initialLogs={logs} totalCount={totalCount} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}