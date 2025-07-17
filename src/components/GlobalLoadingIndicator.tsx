'use client'

import { useLoading } from '@/contexts/LoadingContext'
import { Loader2 } from 'lucide-react'

export function GlobalLoadingIndicator() {
  const { isNavigating } = useLoading()

  if (!isNavigating) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
        <p className="text-white text-lg font-medium">页面加载中...</p>
      </div>
    </div>
  )
}