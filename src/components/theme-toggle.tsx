'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const [isDark, setIsDark] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    
    // 检查当前 HTML 是否有 dark 类
    const htmlHasDark = document.documentElement.classList.contains('dark')
    setIsDark(htmlHasDark)
    
    console.log('ThemeToggle 初始化:', { 
      htmlHasDark, 
      stored: localStorage.getItem('watch-list-theme'),
      systemDark: window.matchMedia('(prefers-color-scheme: dark)').matches
    })
  }, [])

  const toggleTheme = () => {
    console.log('点击切换主题, 当前状态:', isDark)
    
    const newIsDark = !isDark
    const html = document.documentElement
    
    if (newIsDark) {
      html.classList.add('dark')
      localStorage.setItem('watch-list-theme', 'dark')
    } else {
      html.classList.remove('dark')
      localStorage.setItem('watch-list-theme', 'light')
    }
    
    setIsDark(newIsDark)
    
    console.log('切换后:', { 
      newIsDark, 
      htmlClasses: html.className,
      stored: localStorage.getItem('watch-list-theme')
    })
  }

  if (!mounted) {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        disabled
        className="text-slate-700 dark:text-slate-300"
      >
        <Sun className="h-4 w-4" />
        <span className="sr-only">切换主题</span>
      </Button>
    )
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={toggleTheme}
      className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
    >
      {isDark ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
      <span className="sr-only">切换主题 (当前: {isDark ? '暗色' : '亮色'})</span>
    </Button>
  )
}