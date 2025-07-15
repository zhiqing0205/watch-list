import { prisma } from '@/lib/prisma'
import { MovieCard } from '@/components/MovieCard'
import { TvCard } from '@/components/TvCard'
import { Navbar } from '@/components/Navbar'
import { WatchStatus } from '@prisma/client'
import { generateSEO, seoConfigs } from '@/lib/seo'

export const metadata = generateSEO(seoConfigs.movies)

export default async function MoviesPage() {
  const recentMovies = await prisma.movie.findMany({
    where: { isVisible: true },
    orderBy: { createdAt: 'desc' },
    take: 8,
  })

  const recentTvShows = await prisma.tvShow.findMany({
    where: { isVisible: true },
    orderBy: { createdAt: 'desc' },
    take: 8,
  })

  const watchingMovies = await prisma.movie.findMany({
    where: { 
      isVisible: true,
      watchStatus: WatchStatus.WATCHING
    },
    orderBy: { updatedAt: 'desc' },
    take: 4,
  })

  const watchingTvShows = await prisma.tvShow.findMany({
    where: { 
      isVisible: true,
      watchStatus: WatchStatus.WATCHING
    },
    orderBy: { updatedAt: 'desc' },
    take: 4,
  })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <div className="container mx-auto px-4 py-8">

        {/* Currently Watching */}
        {(watchingMovies.length > 0 || watchingTvShows.length > 0) && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6">正在观看</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {watchingMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
              {watchingTvShows.map((tvShow) => (
                <TvCard key={tvShow.id} tvShow={tvShow} />
              ))}
            </div>
          </section>
        )}

        {/* Recent Movies */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6">最新电影</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </section>

        {/* Recent TV Shows */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6">最新电视剧</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentTvShows.map((tvShow) => (
              <TvCard key={tvShow.id} tvShow={tvShow} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}