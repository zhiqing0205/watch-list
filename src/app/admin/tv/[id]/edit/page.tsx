import { notFound } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { EditContentForm } from '@/components/admin/EditContentForm'
import { prisma } from '@/lib/prisma'

interface EditTvShowPageProps {
  params: {
    id: string
  }
}

export default async function EditTvShowPage({ params }: EditTvShowPageProps) {
  const tvShowId = parseInt(params.id, 10)
  
  if (isNaN(tvShowId)) {
    notFound()
  }

  const tvShow = await prisma.tvShow.findUnique({
    where: { id: tvShowId },
    include: {
      cast: {
        include: {
          actor: true
        },
        orderBy: { order: 'asc' }
      }
    }
  })

  if (!tvShow) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                编辑电视剧：{tvShow.name}
              </h1>
              <p className="text-slate-400">修改电视剧信息和设置</p>
            </div>
            
            <EditContentForm content={tvShow} type="tv" />
          </div>
        </main>
      </div>
    </div>
  )
}