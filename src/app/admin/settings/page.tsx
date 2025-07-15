import { Suspense } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { SettingsPanel } from '@/components/admin/SettingsPanel'
import { Settings, Cog } from 'lucide-react'

export default function AdminSettings() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      <AdminSidebar />
      <main className="flex-1 h-screen overflow-hidden flex flex-col">
        {/* 固定头部 */}
        <div className="flex-shrink-0 p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">系统设置</h1>
              <p className="text-slate-600 dark:text-slate-400">配置系统参数和偏好设置</p>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Cog className="h-5 w-5" />
              <span>管理员设置</span>
            </div>
          </div>
        </div>
        
        {/* 可滚动内容区域 */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto scrollbar-custom px-6 py-6">
            <div className="max-w-4xl mx-auto">
              <Suspense fallback={<div className="text-slate-900 dark:text-slate-50">Loading settings...</div>}>
                <SettingsPanel />
              </Suspense>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}