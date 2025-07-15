import { Suspense } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { ActorsList } from '@/components/admin/ActorsList'
import { Users } from 'lucide-react'
import { prisma } from '@/lib/prisma'

async function getActors() {
  return await prisma.actor.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      _count: {
        select: {
          movieRoles: true,
          tvRoles: true,
        },
      },
    },
  })
}

export default async function AdminActors() {
  const actors = await getActors()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      <AdminSidebar />
      <main className="flex-1 h-screen overflow-hidden flex flex-col">
        {/* 固定头部 */}
        <div className="flex-shrink-0 p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">演员管理</h1>
              <p className="text-slate-600 dark:text-slate-400">管理演员信息 (共 {actors.length} 位演员)</p>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Users className="h-5 w-5" />
              <span>演员通过电影/电视剧自动导入</span>
            </div>
          </div>
        </div>
        
        {/* 可滚动内容区域 */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto scrollbar-custom px-6 py-6">
            <div className="max-w-7xl mx-auto">
              <ActorsList actors={actors} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}