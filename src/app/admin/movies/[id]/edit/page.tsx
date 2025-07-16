import { notFound } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { EditContentForm } from '@/components/admin/EditContentForm'
import { prisma } from '@/lib/prisma'

interface EditMoviePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditMoviePage({ params }: EditMoviePageProps) {
  const { id } = await params
  const movieId = parseInt(id, 10)
  
  if (isNaN(movieId)) {
    notFound()
  }

  const movie = await prisma.movie.findUnique({
    where: { id: movieId },
    include: {
      cast: {
        include: {
          actor: true
        },
        orderBy: { order: 'asc' }
      }
    }
  })

  if (!movie) {
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
                编辑电影：{movie.title}
              </h1>
              <p className="text-slate-400">修改电影信息和设置</p>
            </div>
            
            <EditContentForm content={movie} type="movie" />
          </div>
        </main>
      </div>
    </div>
  )
}