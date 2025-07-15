import { Suspense } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { MoviesList } from '@/components/admin/MoviesList'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'

async function getMovies() {
  return await prisma.movie.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      _count: {
        select: {
          reviews: true,
        },
      },
    },
  })
}

export default async function AdminMovies() {
  const movies = await getMovies()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      <AdminSidebar />
      <main className="flex-1 h-screen overflow-hidden flex flex-col">
        {/* 固定头部 */}
        <div className="flex-shrink-0 p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">电影管理</h1>
              <p className="text-slate-600 dark:text-slate-400">管理您的电影收藏</p>
            </div>
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
              <Link href="/admin/add?type=movie">
                <Plus className="h-4 w-4 mr-2" />
                添加电影
              </Link>
            </Button>
          </div>
        </div>
        
        {/* 可滚动内容区域 */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto scrollbar-custom px-6 py-6">
            <div className="max-w-7xl mx-auto">
              <MoviesList movies={movies} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}