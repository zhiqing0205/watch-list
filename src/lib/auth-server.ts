import { NextRequest } from 'next/server'
import { AuthUtils, JWTPayload } from '@/lib/auth'

export interface AuthenticatedUser {
  userId: number
  username: string
  role: string
}

export function getAuthenticatedUser(request: NextRequest): AuthenticatedUser | null {
  try {
    // 从Authorization header获取token
    const authHeader = request.headers.get('authorization')
    let token = authHeader?.replace('Bearer ', '')

    // 如果没有Authorization header，尝试从cookie获取
    if (!token) {
      token = request.cookies.get('auth-token')?.value
    }

    if (!token) {
      return null
    }

    const payload = AuthUtils.verifyToken(token)
    if (!payload) {
      return null
    }

    return {
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
    }
  } catch (error) {
    console.error('Get authenticated user error:', error)
    return null
  }
}

export function requireAuth(request: NextRequest): AuthenticatedUser {
  const user = getAuthenticatedUser(request)
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

export function requireAdmin(request: NextRequest): AuthenticatedUser {
  const user = requireAuth(request)
  if (user.role !== 'ADMIN') {
    throw new Error('Admin access required')
  }
  return user
}