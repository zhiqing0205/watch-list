import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { WatchStatus } from '@prisma/client'

export async function GET() {
  try {
    const stats = await prisma.$transaction([
      prisma.movie.count(),
      prisma.tvShow.count(),
      prisma.movie.count({ where: { watchStatus: WatchStatus.WATCHED } }),
      prisma.tvShow.count({ where: { watchStatus: WatchStatus.WATCHED } }),
      prisma.movie.count({ where: { watchStatus: WatchStatus.WATCHING } }),
      prisma.tvShow.count({ where: { watchStatus: WatchStatus.WATCHING } }),
      prisma.actor.count(),
      prisma.user.count(),
    ])

    return NextResponse.json({
      totalMovies: stats[0],
      totalTvShows: stats[1],
      watchedMovies: stats[2],
      watchedTvShows: stats[3],
      watchingMovies: stats[4],
      watchingTvShows: stats[5],
      totalActors: stats[6],
      totalUsers: stats[7],
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}