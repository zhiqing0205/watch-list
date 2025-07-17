import { prisma } from '@/lib/prisma'
import { uploadFromUrl } from '@/lib/oss-server'

export async function processMovieImages(movieId: number): Promise<void> {
  console.log(`Processing movie images for ID: ${movieId}`)
  
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
  
  console.log(`Movie ${movieId} data:`, {
    tmdbId: movie.tmdbId,
    posterPath: movie.posterPath,
    backdropPath: movie.backdropPath,
    posterUrl: movie.posterUrl,
    backdropUrl: movie.backdropUrl
  })
  
  const updates: any = {}
  
  // 处理 poster 图片
  if (movie.posterPath && !movie.posterUrl) {
    const posterTmdbUrl = `https://image.tmdb.org/t/p/w500${movie.posterPath}`
    const posterOssPath = `movie/${movie.tmdbId}/poster.jpg`
    
    console.log(`Processing poster for movie ${movieId}:`, {
      posterTmdbUrl,
      posterOssPath
    })
    
    try {
      const posterOssUrl = await uploadFromUrl(posterTmdbUrl, posterOssPath)
      console.log(`Successfully uploaded poster for movie ${movieId}, URL: ${posterOssUrl}`)
      updates.posterUrl = posterOssUrl
    } catch (error) {
      console.error(`Failed to process poster for movie ${movie.id}:`, error)
    }
  }
  
  // 处理 backdrop 图片
  if (movie.backdropPath && !movie.backdropUrl) {
    const backdropTmdbUrl = `https://image.tmdb.org/t/p/w1280${movie.backdropPath}`
    const backdropOssPath = `movie/${movie.tmdbId}/backdrop.jpg`
    
    console.log(`Processing backdrop for movie ${movieId}:`, {
      backdropTmdbUrl,
      backdropOssPath
    })
    
    try {
      const backdropOssUrl = await uploadFromUrl(backdropTmdbUrl, backdropOssPath)
      console.log(`Successfully uploaded backdrop for movie ${movieId}, URL: ${backdropOssUrl}`)
      updates.backdropUrl = backdropOssUrl
    } catch (error) {
      console.error(`Failed to process backdrop for movie ${movie.id}:`, error)
    }
  }
  
  // 更新数据库
  if (Object.keys(updates).length > 0) {
    await prisma.movie.update({
      where: { id: movieId },
      data: updates
    })
    console.log(`Updated movie ${movieId} with:`, updates)
  } else {
    console.log(`No updates needed for movie ${movieId}`)
  }
}

export async function processTvShowImages(tvShowId: number): Promise<void> {
  console.log(`Processing TV show images for ID: ${tvShowId}`)
  
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
  
  console.log(`TV Show ${tvShowId} data:`, {
    tmdbId: tvShow.tmdbId,
    posterPath: tvShow.posterPath,
    backdropPath: tvShow.backdropPath,
    posterUrl: tvShow.posterUrl,
    backdropUrl: tvShow.backdropUrl
  })
  
  const updates: any = {}
  
  // 处理 poster 图片
  if (tvShow.posterPath && !tvShow.posterUrl) {
    const posterTmdbUrl = `https://image.tmdb.org/t/p/w500${tvShow.posterPath}`
    const posterOssPath = `tv/${tvShow.tmdbId}/poster.jpg`
    
    console.log(`Processing poster for TV show ${tvShowId}:`, {
      posterTmdbUrl,
      posterOssPath
    })
    
    try {
      const posterOssUrl = await uploadFromUrl(posterTmdbUrl, posterOssPath)
      console.log(`Successfully uploaded poster for TV show ${tvShowId}, URL: ${posterOssUrl}`)
      updates.posterUrl = posterOssUrl
    } catch (error) {
      console.error(`Failed to process poster for TV show ${tvShow.id}:`, error)
    }
  }
  
  // 处理 backdrop 图片
  if (tvShow.backdropPath && !tvShow.backdropUrl) {
    const backdropTmdbUrl = `https://image.tmdb.org/t/p/w1280${tvShow.backdropPath}`
    const backdropOssPath = `tv/${tvShow.tmdbId}/backdrop.jpg`
    
    console.log(`Processing backdrop for TV show ${tvShowId}:`, {
      backdropTmdbUrl,
      backdropOssPath
    })
    
    try {
      const backdropOssUrl = await uploadFromUrl(backdropTmdbUrl, backdropOssPath)
      console.log(`Successfully uploaded backdrop for TV show ${tvShowId}, URL: ${backdropOssUrl}`)
      updates.backdropUrl = backdropOssUrl
    } catch (error) {
      console.error(`Failed to process backdrop for TV show ${tvShow.id}:`, error)
    }
  }
  
  // 更新数据库
  if (Object.keys(updates).length > 0) {
    await prisma.tvShow.update({
      where: { id: tvShowId },
      data: updates
    })
    console.log(`Updated TV show ${tvShowId} with:`, updates)
  } else {
    console.log(`No updates needed for TV show ${tvShowId}`)
  }
}

export async function processActorImages(actorId: number): Promise<void> {
  console.log(`Processing actor images for ID: ${actorId}`)
  
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
  
  console.log(`Actor ${actorId} data:`, {
    tmdbId: actor.tmdbId,
    profilePath: actor.profilePath,
    profileUrl: actor.profileUrl
  })
  
  if (actor.profilePath && !actor.profileUrl) {
    const profileTmdbUrl = `https://image.tmdb.org/t/p/w276_and_h350_face${actor.profilePath}`
    const profileOssPath = `actor/${actor.tmdbId}/profile.jpg`
    
    console.log(`Processing profile for actor ${actorId}:`, {
      profileTmdbUrl,
      profileOssPath
    })
    
    try {
      const profileOssUrl = await uploadFromUrl(profileTmdbUrl, profileOssPath)
      console.log(`Successfully uploaded profile for actor ${actorId}, URL: ${profileOssUrl}`)
      
      await prisma.actor.update({
        where: { id: actorId },
        data: { profileUrl: profileOssUrl }
      })
      
      console.log(`Updated actor ${actorId} with profileUrl`)
    } catch (error) {
      console.error(`Failed to process profile for actor ${actor.id}:`, error)
      throw error
    }
  } else {
    if (!actor.profilePath) {
      console.log(`Actor ${actorId} has no profile path`)
    }
    if (actor.profileUrl) {
      console.log(`Actor ${actorId} already has profileUrl, skipping`)
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

export async function processContentWithActorsImages(contentId: number, contentType: 'movie' | 'tv'): Promise<{
  contentImages: number
  actorImages: number
  errors: string[]
}> {
  const results = {
    contentImages: 0,
    actorImages: 0,
    errors: [] as string[]
  }

  try {
    // 处理影视剧图片
    await processContentImages(contentId, contentType)
    
    // 检查是否真的处理了图片
    if (contentType === 'movie') {
      const movie = await prisma.movie.findUnique({
        where: { id: contentId },
        select: { posterUrl: true, backdropUrl: true }
      })
      if (movie?.posterUrl || movie?.backdropUrl) {
        results.contentImages = 1
      }
    } else {
      const tvShow = await prisma.tvShow.findUnique({
        where: { id: contentId },
        select: { posterUrl: true, backdropUrl: true }
      })
      if (tvShow?.posterUrl || tvShow?.backdropUrl) {
        results.contentImages = 1
      }
    }
  } catch (error) {
    results.errors.push(`Content ${contentId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  // 获取相关演员并处理图片
  try {
    const actors = contentType === 'movie' 
      ? await prisma.movieCast.findMany({
          where: { movieId: contentId },
          include: { actor: true }
        })
      : await prisma.tvCast.findMany({
          where: { tvShowId: contentId },
          include: { actor: true }
        })

    for (const castMember of actors) {
      try {
        const beforeProcessing = await prisma.actor.findUnique({
          where: { id: castMember.actor.id },
          select: { profileUrl: true }
        })
        
        await processActorImages(castMember.actor.id)
        
        const afterProcessing = await prisma.actor.findUnique({
          where: { id: castMember.actor.id },
          select: { profileUrl: true }
        })
        
        // 只有在实际处理了图片时才计数
        if (!beforeProcessing?.profileUrl && afterProcessing?.profileUrl) {
          results.actorImages++
        }
      } catch (error) {
        results.errors.push(`Actor ${castMember.actor.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  } catch (error) {
    results.errors.push(`Failed to fetch actors: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return results
}