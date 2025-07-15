import { prisma } from '@/lib/prisma'
import HomePageClient from '@/components/HomePageClient'
import { generateSEO, seoConfigs } from '@/lib/seo'

export const metadata = generateSEO(seoConfigs.home)

export default async function HomePage() {
  const [tvShows, movies] = await Promise.all([
    prisma.tvShow.findMany({
      where: { isVisible: true },
      orderBy: { createdAt: 'desc' }, // Default sort
      select: {
        id: true,
        tmdbId: true,
        name: true,
        originalName: true,
        firstAirDate: true,
        numberOfSeasons: true,
        numberOfEpisodes: true,
        posterPath: true,
        posterUrl: true,
        backdropPath: true,
        backdropUrl: true,
        doubanRating: true,
        watchStatus: true,
        isVisible: true,
        createdAt: true,
        genres: true,
      }
    }),
    prisma.movie.findMany({
      where: { isVisible: true },
      orderBy: { createdAt: 'desc' }, // Default sort
      select: {
        id: true,
        tmdbId: true,
        title: true,
        originalTitle: true,
        releaseDate: true,
        posterPath: true,
        posterUrl: true,
        backdropPath: true,
        backdropUrl: true,
        doubanRating: true,
        watchStatus: true,
        isVisible: true,
        createdAt: true,
        genres: true,
      }
    })
  ])

  // Extract all unique genres from both TV shows and movies
  const allGenres = new Set<string>()
  
  tvShows.forEach(show => {
    show.genres.forEach(genre => allGenres.add(genre))
  })
  
  movies.forEach(movie => {
    movie.genres.forEach(genre => allGenres.add(genre))
  })

  const availableGenres = Array.from(allGenres).sort()

  return (
    <HomePageClient
      initialTvShows={tvShows}
      initialMovies={movies}
      availableGenres={availableGenres}
    />
  )
}