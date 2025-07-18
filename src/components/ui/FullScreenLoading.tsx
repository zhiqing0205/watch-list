'use client'

import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FullScreenLoadingProps {
  isVisible: boolean
  message?: string
  className?: string
}

export function FullScreenLoading({ 
  isVisible, 
  message = '页面加载中...', 
  className 
}: FullScreenLoadingProps) {
  // 防止背景滚动
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center",
      "bg-black/50 backdrop-blur-sm",
      "transition-all duration-300 ease-in-out",
      className
    )}>
      {/* Loading Card */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-8 mx-4 max-w-sm w-full">
        <div className="flex flex-col items-center space-y-4">
          {/* 旋转的加载图标 */}
          <div className="relative">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            <div className="absolute inset-0 rounded-full border-2 border-blue-200 dark:border-blue-800"></div>
          </div>
          
          {/* 加载文本 */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {message}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              请稍候片刻
            </p>
          </div>
          
          {/* 进度条动画 */}
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse">
              <div className="h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}