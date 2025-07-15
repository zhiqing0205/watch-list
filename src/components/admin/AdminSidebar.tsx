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
  BarChart3, 
  Plus,
  List,
  LogOut,
  User,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'
import { toast } from 'sonner'

const navigation = [
  { name: '仪表板', href: '/admin', icon: Home },
  { name: '电视剧', href: '/admin/tv', icon: Tv },
  { name: '电影', href: '/admin/movies', icon: Film },
  { name: '演员', href: '/admin/actors', icon: Users },
  { name: '添加内容', href: '/admin/add', icon: Plus },
  { name: '操作日志', href: '/admin/logs', icon: List },
  { name: '设置', href: '/admin/settings', icon: Settings },
  { name: '访问网站', href: '/', icon: ExternalLink },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const [username, setUsername] = useState('Admin')

  useEffect(() => {
    // 从 localStorage 或 cookie 获取用户信息
    const token = localStorage.getItem('auth-token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUsername(payload.username || 'Admin')
      } catch {
        setUsername('Admin')
      }
    }
  }, [])

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
    <Card className="w-64 h-screen bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-700 rounded-none flex flex-col border-r border-l-0 border-t-0 border-b-0">
      <CardContent className="p-6 flex-1 overflow-y-auto scrollbar-custom">
        <div className="flex items-center gap-2 mb-8">
          <BarChart3 className="h-8 w-8 text-blue-500" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">管理面板</h2>
        </div>
        
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Button
                key={item.name}
                asChild
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  'w-full justify-start gap-3 text-sm font-medium',
                  isActive
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-50'
                )}
              >
                <Link href={item.href}>
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
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
  )
}