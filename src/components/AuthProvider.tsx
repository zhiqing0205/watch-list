'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = () => {
      // 如果不是 admin 路径或者是登录页，直接通过
      if (!pathname.startsWith('/admin') || pathname === '/admin/login') {
        setIsChecking(false)
        setIsAuthenticated(true)
        return
      }

      // 检查 localStorage 中的 token
      const token = localStorage.getItem('token')
      
      if (!token) {
        router.push('/admin/login')
        return
      }

      // 验证 token 是否有效
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const currentTime = Date.now() / 1000
        
        if (payload.exp && payload.exp < currentTime) {
          localStorage.removeItem('token')
          router.push('/admin/login')
          return
        }

        // 检查是否是管理员
        if (payload.role !== 'ADMIN') {
          router.push('/admin/login')
          return
        }

        setIsAuthenticated(true)
      } catch (error) {
        console.error('Token validation error:', error)
        localStorage.removeItem('token')
        router.push('/admin/login')
        return
      }
      
      setIsChecking(false)
    }

    checkAuth()
  }, [pathname, router])

  // 如果正在检查认证状态，显示 loading
  if (isChecking) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-slate-600 dark:text-slate-400 mt-4">验证中...</p>
        </div>
      </div>
    )
  }

  // 如果未认证且是 admin 路径，不渲染子组件
  if (!isAuthenticated && pathname.startsWith('/admin') && pathname !== '/admin/login') {
    return null
  }

  return <>{children}</>
}