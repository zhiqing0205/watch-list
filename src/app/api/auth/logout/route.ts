import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthUtils } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // 获取token
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('token')?.value
    const token = authHeader?.replace('Bearer ', '') || cookieToken

    if (token) {
      // 验证token并获取用户信息
      const payload = AuthUtils.verifyToken(token)
      
      if (payload) {
        // 获取用户信息用于日志记录
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: { id: true, name: true, username: true }
        })
        
        if (user) {
          // 创建操作日志
          await prisma.operationLog.create({
            data: {
              userId: user.id,
              operatorName: user.name || user.username,
              action: 'LOGOUT',
              entityType: 'USER',
              resourceType: 'USER',
              description: '用户登出',
            },
          })
        }
      }
    }

    // 创建响应并清除cookie
    const response = NextResponse.json({
      success: true,
      message: '登出成功',
    })

    // 清除token cookie
    response.cookies.set('token', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: '登出失败' }, { status: 500 })
  }
}