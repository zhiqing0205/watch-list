import { prisma } from '@/lib/prisma'
import { uploadFromUrl } from '@/lib/oss-server'

export async function processMovieImages(movieId: number): Promise<void> {
  const movie = await prisma.movie.findUnique({
    where: { id: movieId },
    select: { 
      id: true, 
      tmdbId: true, 
      posterPath: true, 
      backdropPath: true, 
      posterUrl: true,
      backdropUrl: true 
    }
  })
  
  if (!movie) {
    throw new Error(`Movie with ID ${movieId} not found`)
  }
  
  const updates: any = {}
  
  if (movie.posterPath && !movie.posterUrl) {
    const posterTmdbUrl = `https://image.tmdb.org/t/p/w500${movie.posterPath}`
    const posterOssPath = `movie/${movie.tmdbId}/poster.jpg`
    
    try {
      const posterOssUrl = await uploadFromUrl(posterTmdbUrl, posterOssPath)
      updates.posterUrl = posterOssUrl
    } catch (error) {
      console.error(`Failed to process poster for movie ${movie.id}:`, error)
    }
  }
  
  if (movie.backdropPath && !movie.backdropUrl) {
    const backdropTmdbUrl = `https://image.tmdb.org/t/p/w1280${movie.backdropPath}`
    const backdropOssPath = `movie/${movie.tmdbId}/backdrop.jpg`
    
    try {
      const backdropOssUrl = await uploadFromUrl(backdropTmdbUrl, backdropOssPath)
      updates.backdropUrl = backdropOssUrl
    } catch (error) {
      console.error(`Failed to process backdrop for movie ${movie.id}:`, error)
    }
  }
  
  if (Object.keys(updates).length > 0) {
    await prisma.movie.update({
      where: { id: movieId },
      data: updates
    })
  }
}

export async function processTvShowImages(tvShowId: number): Promise<void> {
  const tvShow = await prisma.tvShow.findUnique({
    where: { id: tvShowId },
    select: { 
      id: true, 
      tmdbId: true, 
      posterPath: true, 
      backdropPath: true, 
      posterUrl: true,
      backdropUrl: true 
    }
  })
  
  if (!tvShow) {
    throw new Error(`TV Show with ID ${tvShowId} not found`)
  }
  
  const updates: any = {}
  
  if (tvShow.posterPath && !tvShow.posterUrl) {
    const posterTmdbUrl = `https://image.tmdb.org/t/p/w500${tvShow.posterPath}`
    const posterOssPath = `tv/${tvShow.tmdbId}/poster.jpg`
    
    try {
      const posterOssUrl = await uploadFromUrl(posterTmdbUrl, posterOssPath)
      updates.posterUrl = posterOssUrl
    } catch (error) {
      console.error(`Failed to process poster for TV show ${tvShow.id}:`, error)
    }
  }
  
  if (tvShow.backdropPath && !tvShow.backdropUrl) {
    const backdropTmdbUrl = `https://image.tmdb.org/t/p/w1280${tvShow.backdropPath}`
    const backdropOssPath = `tv/${tvShow.tmdbId}/backdrop.jpg`
    
    try {
      const backdropOssUrl = await uploadFromUrl(backdropTmdbUrl, backdropOssPath)
      updates.backdropUrl = backdropOssUrl
    } catch (error) {
      console.error(`Failed to process backdrop for TV show ${tvShow.id}:`, error)
    }
  }
  
  if (Object.keys(updates).length > 0) {
    await prisma.tvShow.update({
      where: { id: tvShowId },
      data: updates
    })
  }
}

export async function processActorImages(actorId: number): Promise<void> {
  const actor = await prisma.actor.findUnique({
    where: { id: actorId },
    select: { 
      id: true, 
      tmdbId: true, 
      profilePath: true, 
      profileUrl: true 
    }
  })
  
  if (!actor) {
    throw new Error(`Actor with ID ${actorId} not found`)
  }
  
  if (actor.profilePath && !actor.profileUrl) {
    const profileTmdbUrl = `https://image.tmdb.org/t/p/w276_and_h350_face${actor.profilePath}`
    const profileOssPath = `actor/${actor.tmdbId}/profile.jpg`
    
    try {
      const profileOssUrl = await uploadFromUrl(profileTmdbUrl, profileOssPath)
      
      await prisma.actor.update({
        where: { id: actorId },
        data: { profileUrl: profileOssUrl }
      })
    } catch (error) {
      console.error(`Failed to process profile for actor ${actor.id}:`, error)
    }
  }
}

export async function processAllImages(): Promise<void> {
  console.log('Starting image processing...')
  
  const movies = await prisma.movie.findMany({
    where: {
      OR: [
        { posterPath: { not: null }, posterUrl: null },
        { backdropPath: { not: null }, backdropUrl: null }
      ]
    },
    select: { id: true }
  })
  
  console.log(`Processing ${movies.length} movies...`)
  for (const movie of movies) {
    try {
      await processMovieImages(movie.id)
      console.log(`Processed movie ${movie.id}`)
    } catch (error) {
      console.error(`Failed to process movie ${movie.id}:`, error)
    }
  }
  
  const tvShows = await prisma.tvShow.findMany({
    where: {
      OR: [
        { posterPath: { not: null }, posterUrl: null },
        { backdropPath: { not: null }, backdropUrl: null }
      ]
    },
    select: { id: true }
  })
  
  console.log(`Processing ${tvShows.length} TV shows...`)
  for (const tvShow of tvShows) {
    try {
      await processTvShowImages(tvShow.id)
      console.log(`Processed TV show ${tvShow.id}`)
    } catch (error) {
      console.error(`Failed to process TV show ${tvShow.id}:`, error)
    }
  }
  
  const actors = await prisma.actor.findMany({
    where: {
      profilePath: { not: null },
      profileUrl: null
    },
    select: { id: true }
  })
  
  console.log(`Processing ${actors.length} actors...`)
  for (const actor of actors) {
    try {
      await processActorImages(actor.id)
      console.log(`Processed actor ${actor.id}`)
    } catch (error) {
      console.error(`Failed to process actor ${actor.id}:`, error)
    }
  }
  
  console.log('Image processing completed!')
}

export async function batchProcessImages(limit: number = 10) {
  console.log('Starting batch image processing...')
  
  const results = {
    processedContent: 0,
    processedActors: 0,
    errors: [] as string[]
  }
  
  try {
    // Process movies
    const movies = await prisma.movie.findMany({
      where: {
        OR: [
          { posterPath: { not: null }, posterUrl: null },
          { backdropPath: { not: null }, backdropUrl: null }
        ]
      },
      select: { id: true },
      take: Math.ceil(limit / 2)
    })
    
    for (const movie of movies) {
      try {
        await processMovieImages(movie.id)
        results.processedContent++
      } catch (error) {
        results.errors.push(`Movie ${movie.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    
    // Process TV shows
    const tvShows = await prisma.tvShow.findMany({
      where: {
        OR: [
          { posterPath: { not: null }, posterUrl: null },
          { backdropPath: { not: null }, backdropUrl: null }
        ]
      },
      select: { id: true },
      take: Math.ceil(limit / 2)
    })
    
    for (const tvShow of tvShows) {
      try {
        await processTvShowImages(tvShow.id)
        results.processedContent++
      } catch (error) {
        results.errors.push(`TV Show ${tvShow.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    
    // Process actors
    const actors = await prisma.actor.findMany({
      where: {
        profilePath: { not: null },
        profileUrl: null
      },
      select: { id: true },
      take: Math.min(limit, 5)
    })
    
    for (const actor of actors) {
      try {
        await processActorImages(actor.id)
        results.processedActors++
      } catch (error) {
        results.errors.push(`Actor ${actor.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    
    console.log('Batch image processing completed!')
    return results
  } catch (error) {
    console.error('Error in batch image processing:', error)
    results.errors.push(`Batch processing error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return results
  }
}

export async function processContentImages(contentId: number, contentType: 'movie' | 'tv'): Promise<void> {
  if (contentType === 'movie') {
    await processMovieImages(contentId)
  } else {
    await processTvShowImages(contentId)
  }
}