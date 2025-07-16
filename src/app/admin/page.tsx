import { Suspense } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminStats } from '@/components/admin/AdminStats'
import { RecentActivity } from '@/components/admin/RecentActivity'
import { UserGreeting } from '@/components/admin/UserGreeting'

export const metadata = {
  title: '管理后台 - 剧海拾遗',
  description: '剧海拾遗管理后台，管理影视内容、用户和系统设置',
}

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="flex h-screen">
        <AdminSidebar />
        <main className="flex-1 p-6 overflow-hidden">
          <div className="h-full flex flex-col max-w-7xl mx-auto">
            <div className="mb-6 flex-shrink-0">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">剧海拾遗 管理后台</h1>
              <UserGreeting />
            </div>
            
            <div className="mb-6 flex-shrink-0">
              <Suspense fallback={<div className="text-slate-900 dark:text-slate-50">Loading stats...</div>}>
                <AdminStats />
              </Suspense>
            </div>
            
            <div className="flex-1 min-h-0 overflow-hidden">
              <Suspense fallback={<div className="text-slate-900 dark:text-slate-50 h-full flex items-center justify-center bg-white dark:bg-slate-800 rounded-lg">Loading activity...</div>}>
                <RecentActivity />
              </Suspense>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}