'use client'

import { WatchStatus } from '@prisma/client'
import { Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ContentFilterProps {
  watchStatusFilter: WatchStatus | 'ALL'
  genreFilter: string
  availableGenres: string[]
  onWatchStatusChange: (status: WatchStatus | 'ALL') => void
  onGenreChange: (genre: string) => void
}

export function ContentFilter({
  watchStatusFilter,
  genreFilter,
  availableGenres,
  onWatchStatusChange,
  onGenreChange
}: ContentFilterProps) {
  const watchStatusOptions = [
    { value: 'ALL', label: '全部状态' },
    { value: WatchStatus.UNWATCHED, label: '未观看' },
    { value: WatchStatus.WATCHING, label: '观看中' },
    { value: WatchStatus.WATCHED, label: '已观看' },
    { value: WatchStatus.DROPPED, label: '弃剧' }
  ]

  const hasActiveFilters = watchStatusFilter !== 'ALL' || genreFilter !== ''

  const clearAllFilters = () => {
    onWatchStatusChange('ALL')
    onGenreChange('')
  }

  const getStatusBadgeStyle = (value: string) => {
    const isActive = watchStatusFilter === value
    switch (value) {
      case WatchStatus.WATCHING:
        return isActive 
          ? 'bg-yellow-500 text-white hover:bg-yellow-600 border-yellow-500 shadow-md' 
          : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100 border-yellow-300 dark:bg-yellow-900/10 dark:text-yellow-400 dark:hover:bg-yellow-900/20 dark:border-yellow-700'
      case WatchStatus.WATCHED:
        return isActive 
          ? 'bg-green-500 text-white hover:bg-green-600 border-green-500 shadow-md' 
          : 'bg-green-50 text-green-600 hover:bg-green-100 border-green-300 dark:bg-green-900/10 dark:text-green-400 dark:hover:bg-green-900/20 dark:border-green-700'
      case WatchStatus.DROPPED:
        return isActive 
          ? 'bg-red-500 text-white hover:bg-red-600 border-red-500 shadow-md' 
          : 'bg-red-50 text-red-600 hover:bg-red-100 border-red-300 dark:bg-red-900/10 dark:text-red-400 dark:hover:bg-red-900/20 dark:border-red-700'
      case WatchStatus.UNWATCHED:
        return isActive 
          ? 'bg-slate-500 text-white hover:bg-slate-600 border-slate-500 shadow-md' 
          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:border-slate-600'
      default: // ALL
        return isActive 
          ? 'bg-blue-500 text-white hover:bg-blue-600 border-blue-500 shadow-md' 
          : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-300 dark:bg-blue-900/10 dark:text-blue-400 dark:hover:bg-blue-900/20 dark:border-blue-700'
    }
  }

  const getGenreBadgeStyle = (genre: string) => {
    const isActive = genreFilter === genre
    return isActive 
      ? 'bg-purple-500 text-white hover:bg-purple-600 border-purple-500 shadow-md' 
      : 'bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-300 dark:bg-purple-900/10 dark:text-purple-400 dark:hover:bg-purple-900/20 dark:border-purple-700'
  }

  return (
    <div className="mb-8 p-5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
            <Filter className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">筛选条件</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">点击标签进行筛选</p>
          </div>
        </div>
        
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            <X className="h-3 w-3 mr-1" />
            清除全部
          </Button>
        )}
      </div>

      {/* Watch Status Tags */}
      <div className="mb-5">
        <h4 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          观看状态
        </h4>
        <div className="flex flex-wrap gap-3">
          {watchStatusOptions.map((option) => (
            <Badge
              key={option.value}
              variant="outline"
              className={`cursor-pointer transition-all duration-200 text-sm px-4 py-2 font-medium border-2 ${getStatusBadgeStyle(option.value)}`}
              onClick={() => onWatchStatusChange(option.value as WatchStatus | 'ALL')}
            >
              {option.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Genre Tags */}
      {availableGenres.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            类型标签
          </h4>
          <div className="flex flex-wrap gap-3">
            <Badge
              variant="outline"
              className={`cursor-pointer transition-all duration-200 text-sm px-4 py-2 font-medium border-2 ${getGenreBadgeStyle('')}`}
              onClick={() => onGenreChange('')}
            >
              全部类型
            </Badge>
            {availableGenres.map((genre) => (
              <Badge
                key={genre}
                variant="outline"
                className={`cursor-pointer transition-all duration-200 text-sm px-4 py-2 font-medium border-2 ${getGenreBadgeStyle(genre)}`}
                onClick={() => onGenreChange(genre)}
              >
                {genre}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}