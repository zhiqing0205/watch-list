'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn, Eye, EyeOff, User, Lock, Home, Github, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { AnimatedGradientBackground } from '@/components/AnimatedGradientBackground'
import { systemConfig } from '@/config/system'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // 检查用户是否已经登录
  useEffect(() => {
    const checkAuthentication = () => {
      const token = localStorage.getItem('token')
      
      if (!token) {
        setIsCheckingAuth(false)
        return
      }

      try {
        // 验证 token 是否有效
        const payload = JSON.parse(atob(token.split('.')[1]))
        const currentTime = Date.now() / 1000
        
        if (payload.exp && payload.exp < currentTime) {
          // Token 已过期，清除并继续显示登录页
          localStorage.removeItem('token')
          setIsCheckingAuth(false)
          return
        }

        // 检查是否是管理员
        if (payload.role === 'ADMIN') {
          // 用户已登录且是管理员，跳转到后台首页
          router.replace('/admin')
          return
        }
      } catch (error) {
        // Token 无效，清除并继续显示登录页
        localStorage.removeItem('token')
      }
      
      setIsCheckingAuth(false)
    }

    checkAuthentication()
  }, [router])

  // 如果正在检查认证状态，显示加载界面
  if (isCheckingAuth) {
    return (
      <AnimatedGradientBackground className="min-h-screen">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-slate-600 dark:text-slate-400 mt-4">验证登录状态...</p>
          </div>
        </div>
      </AnimatedGradientBackground>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.username.trim()) {
      toast.error('请输入用户名')
      return
    }
    
    if (!formData.password) {
      toast.error('请输入密码')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username.trim(),
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // 设置token到cookie和localStorage
        document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
        localStorage.setItem('token', data.token)
        
        toast.success('登录成功！', {
          description: '正在跳转到管理后台...'
        })
        setTimeout(() => {
          router.push('/admin')
        }, 1000)
      } else {
        toast.error('登录失败', {
          description: data.error || '用户名或密码错误'
        })
      }
    } catch (err) {
      console.error('Login error:', err)
      toast.error('登录失败', {
        description: '网络错误或服务器异常'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatedGradientBackground className="min-h-screen">
      <div className="min-h-screen flex flex-col">
        {/* 顶部导航栏 */}
        <div className="relative z-20 flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(systemConfig.homeUrl)}
              className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/20 dark:hover:bg-slate-800/20"
            >
              <Home className="h-4 w-4 mr-2" />
              回到首页
            </Button>
          </div>
          <div>
            <ThemeToggle />
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-2xl border border-white/20 dark:border-slate-700/20 p-8">
              {/* 头部 */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mb-6 shadow-lg">
                  <LogIn className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  {systemConfig.title}
                </h1>
                <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  {systemConfig.adminTitle}
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  请使用管理员账户登录系统
                </p>
              </div>

              {/* 表单 */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    用户名
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="请输入用户名"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    密码
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full pl-10 pr-12 py-3 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="请输入密码"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
                >
                  {loading ? '登录中...' : '登录'}
                </Button>
              </form>

              {/* 底部说明 */}
              <div className="mt-6 text-center">
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  忘记密码？请联系系统管理员重置
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 底部 Footer */}
        <footer className="relative z-20 mt-8 py-6 px-4 border-t border-white/20 dark:border-slate-700/20 bg-white/5 dark:bg-slate-800/5 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
              {/* 系统信息 */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  {systemConfig.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {systemConfig.description}
                </p>
              </div>

              {/* 联系信息 */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  联系方式
                </h3>
                <div className="space-y-1">
                  <a
                    href={`mailto:${systemConfig.contact.email}`}
                    className="flex items-center justify-center md:justify-start text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  >
                    <Mail className="w-3 h-3 mr-1" />
                    {systemConfig.contact.email}
                  </a>
                  <a
                    href={systemConfig.contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center md:justify-start text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  >
                    <Home className="w-3 h-3 mr-1" />
                    官方网站
                  </a>
                </div>
              </div>

              {/* 版权信息 */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  关于我们
                </h3>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {systemConfig.copyright}
                  </p>
                  <div className="flex items-center justify-center md:justify-start space-x-2">
                    <a
                      href={systemConfig.social.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                    >
                      <Github className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </AnimatedGradientBackground>
  )
}