'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Home, 
  Film, 
  Tv, 
  Users, 
  Settings, 
  Plus,
  List,
  LogOut,
  User,
  ExternalLink,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'
import { FullScreenLoading } from '@/components/ui/FullScreenLoading'
import { toast } from 'sonner'

const navigation = [
  { name: '仪表板', href: '/admin', icon: Home },
  { name: '电视剧', href: '/admin/tv', icon: Tv },
  { name: '电影', href: '/admin/movies', icon: Film },
  { name: '演员', href: '/admin/actors', icon: Users },
  { name: '添加影视剧', href: '/admin/add', icon: Plus },
  { name: '操作日志', href: '/admin/logs', icon: List },
  { name: '设置', href: '/admin/settings', icon: Settings },
  { name: '访问网站', href: '/', icon: ExternalLink },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const [username, setUsername] = useState('Admin')
  const [navigating, setNavigating] = useState<string | null>(null)

  useEffect(() => {
    // 从 localStorage 或 cookie 获取用户信息
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUsername(payload.username || 'Admin')
      } catch {
        setUsername('Admin')
      }
    }
  }, [])

  const handleNavigation = (href: string, itemName: string) => {
    if (href === pathname) return // 如果是当前页面，不做任何操作
    
    setNavigating(href)
    
    // 添加延迟以显示loading效果，并根据页面类型设置不同的延迟
    const delay = href.includes('/admin/add') ? 800 : 600
    setTimeout(() => {
      router.push(href)
    }, delay)
  }

  // 监听路由变化，取消loading状态
  useEffect(() => {
    setNavigating(null)
  }, [pathname])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        // 清除localStorage中的token
        localStorage.removeItem('token')
        
        toast.success('登出成功', {
          description: '正在跳转到登录页面...'
        })
        setTimeout(() => {
          router.push('/admin/login')
        }, 1000)
      } else {
        toast.error('登出失败', {
          description: '请重试'
        })
      }
    } catch (err) {
      console.error('Logout error:', err)
      toast.error('登出失败', {
        description: '网络错误'
      })
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <>
      <FullScreenLoading 
        isVisible={!!navigating} 
        message={navigating ? `正在前往${navigation.find(item => item.href === navigating)?.name || '页面'}...` : '页面加载中...'}
      />
      <Card className="w-64 h-screen bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-700 rounded-none flex flex-col border-r border-l-0 border-t-0 border-b-0">
        <CardContent className="p-6 flex-1 overflow-y-auto scrollbar-custom">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">剧</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">剧海拾遗后台</h2>
        </div>
        
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const isNavigating = navigating === item.href
            return (
              <Button
                key={item.name}
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  'w-full justify-start gap-3 text-sm font-medium',
                  isActive
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-50',
                  isNavigating && 'opacity-75'
                )}
                onClick={() => handleNavigation(item.href, item.name)}
                disabled={!!navigating}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Button>
            )
          })}
        </nav>
      </CardContent>

      {/* 主题切换和用户信息 */}
      <CardContent className="p-6 border-t border-slate-200 dark:border-slate-700 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
            <User className="h-5 w-5" />
            <span className="text-sm">{username}</span>
            <Badge variant="outline" className="text-xs">管理员</Badge>
          </div>
          <ThemeToggle />
        </div>
        
        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
          <LogOut className="h-5 w-5" />
          <Button
            onClick={handleLogout}
            disabled={loggingOut}
            variant="ghost"
            className="p-0 h-auto text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-transparent hover:text-slate-900 dark:hover:text-slate-50"
          >
            {loggingOut ? '登出中...' : '登出'}
          </Button>
        </div>
      </CardContent>
    </Card>
    </>
  )
}