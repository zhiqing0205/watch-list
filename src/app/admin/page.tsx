import { Suspense } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminStats } from '@/components/admin/AdminStats'
import { RecentActivity } from '@/components/admin/RecentActivity'

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="flex h-screen">
        <AdminSidebar />
        <main className="flex-1 p-6 overflow-hidden">
          <div className="h-full flex flex-col max-w-7xl mx-auto">
            <div className="mb-6 flex-shrink-0">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">管理面板</h1>
              <p className="text-slate-600 dark:text-slate-400">欢迎回来，管理员</p>
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