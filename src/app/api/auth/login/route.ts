import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthUtils } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // 验证输入
    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码都是必填的' }, { status: 400 })
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        password: true,
        role: true,
        isActive: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }

    // 检查用户是否激活
    if (!user.isActive) {
      return NextResponse.json({ error: '账户已被禁用' }, { status: 401 })
    }

    // 验证密码
    const isPasswordValid = await AuthUtils.verifyPassword(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }

    // 生成JWT token
    const token = AuthUtils.generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    })

    // 更新最后登录时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    // 创建操作日志
    await prisma.operationLog.create({
      data: {
        userId: user.id,
        operatorName: user.name || user.username,
        action: 'LOGIN',
        entityType: 'USER',
        resourceType: 'USER',
        description: '用户登录',
      },
    })

    return NextResponse.json({
      success: true,
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: '登录失败' }, { status: 500 })
  }
}