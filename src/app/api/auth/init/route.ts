import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthUtils } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { username, name, password } = await request.json()

    // 验证输入
    if (!username || !name || !password) {
      return NextResponse.json({ error: '所有字段都是必填的' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: '密码长度至少6位' }, { status: 400 })
    }

    // 检查是否已经存在用户
    const existingUserCount = await prisma.user.count()
    if (existingUserCount > 0) {
      return NextResponse.json({ error: '系统已经初始化，无法重复初始化' }, { status: 400 })
    }

    // 检查用户名是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUser) {
      return NextResponse.json({ error: '用户名已存在' }, { status: 400 })
    }

    // 加密密码
    const hashedPassword = await AuthUtils.hashPassword(password)

    // 创建管理员用户
    const user = await prisma.user.create({
      data: {
        username,
        name,
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    // 创建操作日志
    await prisma.operationLog.create({
      data: {
        userId: user.id,
        action: 'SYSTEM_INIT',
        entityType: 'USER',
        entityId: user.id,
        description: '系统初始化，创建管理员账户',
      },
    })

    return NextResponse.json({
      success: true,
      message: '系统初始化成功',
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('System init error:', error)
    return NextResponse.json({ error: '系统初始化失败' }, { status: 500 })
  }
}