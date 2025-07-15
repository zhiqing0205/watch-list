import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest) {
  try {
    const { id, type, rating } = await request.json()

    if (!id || !type) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }

    if (type === 'movie') {
      await prisma.movie.update({
        where: { id: parseInt(id) },
        data: { doubanRating: rating }
      })
    } else if (type === 'tv') {
      await prisma.tvShow.update({
        where: { id: parseInt(id) },
        data: { doubanRating: rating }
      })
    } else {
      return NextResponse.json(
        { error: '无效的内容类型' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update rating error:', error)
    return NextResponse.json(
      { error: '更新失败' },
      { status: 500 }
    )
  }
}