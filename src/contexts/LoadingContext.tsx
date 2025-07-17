'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface LoadingContextType {
  isNavigating: boolean
  setNavigating: (loading: boolean) => void
  navigateToPage: (url: string) => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false)
  const router = useRouter()

  const setNavigating = (loading: boolean) => {
    setIsNavigating(loading)
  }

  const navigateToPage = (url: string) => {
    setIsNavigating(true)
    // 添加短暂延迟确保loading效果能够显示
    setTimeout(() => {
      router.push(url)
    }, 100)
  }

  useEffect(() => {
    // 监听路由变化
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setIsNavigating(false)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return (
    <LoadingContext.Provider value={{ isNavigating, setNavigating, navigateToPage }}>
      {children}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}