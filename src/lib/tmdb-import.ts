import { prisma } from '@/lib/prisma'
import { tmdbClient, TMDbMovie, TMDbTVShow, TMDbCredits } from '@/lib/tmdb'

// 检查是否为中文文本的函数
function isChineseText(text: string): boolean {
  // 中文字符的Unicode范围
  const chineseRegex = /[\u4e00-\u9fa5]/
  return chineseRegex.test(text)
}

// 过滤标签，只保留中文标签
function filterChineseGenres(genres: { name: string }[]): string[] {
  return genres
    .map(g => g.name)
    .filter(name => isChineseText(name))
}

export async function importMovieFromTMDb(tmdbId: number, userId: string) {
  try {
    // Check if movie already exists
    const existingMovie = await prisma.movie.findUnique({
      where: { tmdbId }
    })

    if (existingMovie) {
      throw new Error('Movie already exists in database')
    }

    // Fetch movie data and credits from TMDb
    const [movieData, creditsData] = await Promise.all([
      tmdbClient.getMovieDetails(tmdbId),
      tmdbClient.getMovieCredits(tmdbId)
    ])

    // Create movie record (without OSS image URL initially)
    const movie = await prisma.movie.create({
      data: {
        tmdbId: movieData.id,
        title: movieData.title,
        originalTitle: movieData.original_title,
        overview: movieData.overview,
        releaseDate: movieData.release_date ? new Date(movieData.release_date) : null,
        runtime: movieData.runtime,
        genres: filterChineseGenres(movieData.genres || []),
        posterPath: movieData.poster_path,
        backdropPath: movieData.backdrop_path,
        imdbId: movieData.imdb_id,
        tmdbRating: movieData.vote_average,
      }
    })

    // Import cast members (without OSS image URLs initially)
    await importCastMembers(creditsData.cast, movie.id, 'movie')

    // 移除重复的操作日志记录，由 API 层统一处理

    return movie
  } catch (error) {
    console.error('Error importing movie from TMDb:', error)
    throw error
  }
}

export async function importTVShowFromTMDb(tmdbId: number, userId: string) {
  try {
    // Check if TV show already exists
    const existingTVShow = await prisma.tvShow.findUnique({
      where: { tmdbId }
    })

    if (existingTVShow) {
      throw new Error('TV show already exists in database')
    }

    // Fetch TV show data and credits from TMDb
    const [tvShowData, creditsData] = await Promise.all([
      tmdbClient.getTVShowDetails(tmdbId),
      tmdbClient.getTVShowCredits(tmdbId)
    ])

    // Create TV show record (without OSS image URL initially)
    const tvShow = await prisma.tvShow.create({
      data: {
        tmdbId: tvShowData.id,
        name: tvShowData.name,
        originalName: tvShowData.original_name,
        overview: tvShowData.overview,
        firstAirDate: tvShowData.first_air_date ? new Date(tvShowData.first_air_date) : null,
        lastAirDate: tvShowData.last_air_date ? new Date(tvShowData.last_air_date) : null,
        numberOfSeasons: tvShowData.number_of_seasons,
        numberOfEpisodes: tvShowData.number_of_episodes,
        genres: filterChineseGenres(tvShowData.genres || []),
        posterPath: tvShowData.poster_path,
        backdropPath: tvShowData.backdrop_path,
        tmdbRating: tvShowData.vote_average,
      }
    })

    // Import cast members (without OSS image URLs initially)
    await importCastMembers(creditsData.cast, tvShow.id, 'tv')

    // 移除重复的操作日志记录，由 API 层统一处理

    return tvShow
  } catch (error) {
    console.error('Error importing TV show from TMDb:', error)
    throw error
  }
}

async function importCastMembers(cast: any[], contentId: string, type: 'movie' | 'tv') {
  const castData = cast.slice(0, 10) // Limit to first 10 cast members

  for (const member of castData) {
    try {
      // Check if actor already exists
      let actor = await prisma.actor.findUnique({
        where: { tmdbId: member.id }
      })

      if (!actor) {
        // Create new actor (without OSS image URL initially)
        actor = await prisma.actor.create({
          data: {
            tmdbId: member.id,
            name: member.name,
            profilePath: member.profile_path,
          }
        })
      }

      // Check if cast relationship already exists
      const existingCast = type === 'movie' 
        ? await prisma.movieCast.findUnique({
            where: { movieId_actorId: { movieId: contentId, actorId: actor.id } }
          })
        : await prisma.tvCast.findUnique({
            where: { tvShowId_actorId: { tvShowId: contentId, actorId: actor.id } }
          })

      if (!existingCast) {
        // Create cast relationship
        if (type === 'movie') {
          await prisma.movieCast.create({
            data: {
              movieId: contentId,
              actorId: actor.id,
              character: member.character,
              order: member.order,
            }
          })
        } else {
          await prisma.tvCast.create({
            data: {
              tvShowId: contentId,
              actorId: actor.id,
              character: member.character,
              order: member.order,
            }
          })
        }
      }
    } catch (error) {
      console.error(`Error importing cast member ${member.name}:`, error)
      // Continue with next cast member
    }
  }
}