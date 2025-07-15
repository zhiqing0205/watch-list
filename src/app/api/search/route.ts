import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  const actorId = searchParams.get('actor')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '12')
  
  if (!query && !actorId) {
    return NextResponse.json({ error: 'Search query or actor ID is required' }, { status: 400 })
  }

  try {
    const skip = (page - 1) * limit

    let movieWhere: any = { isVisible: true }
    let tvWhere: any = { isVisible: true }

    if (actorId) {
      // 按演员搜索
      const actorIdNum = parseInt(actorId)
      movieWhere.cast = {
        some: {
          actorId: actorIdNum
        }
      }
      tvWhere.cast = {
        some: {
          actorId: actorIdNum
        }
      }
    } else if (query) {
      // 模糊搜索
      const searchCondition = {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { originalTitle: { contains: query, mode: 'insensitive' } }
        ]
      }
      const tvSearchCondition = {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { originalName: { contains: query, mode: 'insensitive' } }
        ]
      }
      
      movieWhere = { ...movieWhere, ...searchCondition }
      tvWhere = { ...tvWhere, ...tvSearchCondition }
    }

    // 分别查询电影和电视剧
    const [movies, moviesTotal, tvShows, tvShowsTotal] = await Promise.all([
      prisma.movie.findMany({
        where: movieWhere,
        include: {
          cast: {
            include: {
              actor: true
            },
            take: 5
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.movie.count({ where: movieWhere }),
      prisma.tvShow.findMany({
        where: tvWhere,
        include: {
          cast: {
            include: {
              actor: true
            },
            take: 5
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.tvShow.count({ where: tvWhere })
    ])

    // 如果是按演员搜索，获取演员信息
    let actor = null
    if (actorId) {
      actor = await prisma.actor.findUnique({
        where: { id: parseInt(actorId) }
      })
    }

    return NextResponse.json({
      movies,
      tvShows,
      actor,
      pagination: {
        page,
        limit,
        total: {
          movies: moviesTotal,
          tvShows: tvShowsTotal,
          all: moviesTotal + tvShowsTotal
        },
        totalPages: {
          movies: Math.ceil(moviesTotal / limit),
          tvShows: Math.ceil(tvShowsTotal / limit),
          all: Math.ceil((moviesTotal + tvShowsTotal) / limit)
        }
      }
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}