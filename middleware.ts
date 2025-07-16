import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // API路由不需要在这里处理
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // 静态文件和 Next.js 内部路由不处理
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon.ico')) {
    return NextResponse.next()
  }

  // 检查是否需要系统初始化（所有路径都需要检查，除了 /init）
  if (pathname !== '/init') {
    try {
      // 检查是否有用户存在
      const response = await fetch(`${request.nextUrl.origin}/api/auth/check-init`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      
      if (!data.initialized) {
        return NextResponse.redirect(new URL('/init', request.url))
      }
    } catch (error) {
      console.error('Middleware init check error:', error)
      // 如果检查失败，为了安全起见，跳转到初始化页面
      return NextResponse.redirect(new URL('/init', request.url))
    }
  }

  // Admin 路径的认证检查已经移到 AuthProvider 中处理
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}