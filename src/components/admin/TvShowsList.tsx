'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Edit, Trash2, Eye, EyeOff, Star, Download, RefreshCw, Search } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Pagination } from '@/components/ui/Pagination'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { logAdminOperation, LOG_ACTIONS, LogDescriptionBuilder } from '@/lib/operation-logger'
import { EntityType } from '@prisma/client'

interface TvShow {
  id: number
  tmdbId: number
  name: string
  originalName: string | null
  firstAirDate: Date | null
  numberOfSeasons: number | null
  numberOfEpisodes: number | null
  posterPath: string | null
  backdropPath: string | null
  posterUrl: string | null
  backdropUrl: string | null
  doubanRating: number | null
  watchStatus: string
  isVisible: boolean
  createdAt: Date
  _count: {
    reviews: number
  }
}

interface TvShowsListProps {
  tvShows: TvShow[]
}

const ITEMS_PER_PAGE = 10

const WATCH_STATUS_OPTIONS = [
  { value: 'UNWATCHED', label: '未观看', color: 'bg-gray-100 text-gray-800' },
  { value: 'WATCHING', label: '观看中', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'WATCHED', label: '已观看', color: 'bg-green-100 text-green-800' },
  { value: 'DROPPED', label: '弃剧', color: 'bg-red-100 text-red-800' },
]

export function TvShowsList({ tvShows: initialTvShows }: TvShowsListProps) {
  const [tvShows, setTvShows] = useState<TvShow[]>(initialTvShows)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTvShows, setSelectedTvShows] = useState<number[]>([])
  const [processing, setProcessing] = useState(false)
  const [batchProcessing, setBatchProcessing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; tvShow: TvShow | null }>({
    isOpen: false,
    tvShow: null
  })
  const [deleting, setDeleting] = useState(false)
  const [togglingVisibility, setTogglingVisibility] = useState<number | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null)
  const [updatingRating, setUpdatingRating] = useState<number | null>(null)

  // 根据搜索条件过滤电视剧
  const filteredTvShows = useMemo(() => {
    if (!searchTerm.trim()) {
      return tvShows
    }
    
    return tvShows.filter(tvShow => 
      tvShow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tvShow.originalName && tvShow.originalName.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [tvShows, searchTerm])

  const totalPages = Math.ceil(filteredTvShows.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentTvShows = filteredTvShows.slice(startIndex, endIndex)

  // 当搜索条件改变时重置到第一页
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
    setSelectedTvShows([]) // 清空选择
  }, [])

  // 更新观看状态
  const handleStatusChange = async (tvShowId: number, newStatus: string) => {
    const tvShow = tvShows.find(t => t.id === tvShowId)
    if (!tvShow || tvShow.watchStatus === newStatus) return

    setUpdatingStatus(tvShowId)
    try {
      const response = await fetch('/api/admin/content/update-status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: tvShowId,
          type: 'tv',
          watchStatus: newStatus,
        }),
      })

      if (response.ok) {
        setTvShows(prev => prev.map(t => 
          t.id === tvShowId ? { ...t, watchStatus: newStatus } : t
        ))
        
        // 使用标准化日志记录
        await logAdminOperation({
          action: LOG_ACTIONS.UPDATE_WATCH_STATUS,
          entityType: EntityType.TV_SHOW,
          entityId: tvShowId,
          tvShowId: tvShowId,
          description: LogDescriptionBuilder.watchStatus(EntityType.TV_SHOW, tvShow.name, tvShow.watchStatus, newStatus)
        })
        
        toast.success('观看状态更新成功')
      } else {
        const errorData = await response.json()
        toast.error('更新失败', {
          description: errorData.error || '未知错误'
        })
      }
    } catch (err) {
      console.error('Update status error:', err)
      toast.error('更新失败', {
        description: '网络错误或服务器异常'
      })
    } finally {
      setUpdatingStatus(null)
    }
  }

  // 防抖定时器引用
  const ratingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 更新评分 - 实际API调用
  const updateRatingAPI = useCallback(async (tvShowId: number, newRating: string) => {
    const tvShow = tvShows.find(t => t.id === tvShowId)
    if (!tvShow) return

    const rating = newRating ? parseFloat(newRating) : null
    if (rating !== null && (rating < 0 || rating > 10)) {
      toast.error('评分范围应在0-10之间')
      return
    }

    setUpdatingRating(tvShowId)
    try {
      const response = await fetch('/api/admin/content/update-rating', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: tvShowId,
          type: 'tv',
          rating: rating,
        }),
      })

      if (response.ok) {
        const oldRating = tvShow.doubanRating
        
        // 使用标准化日志记录
        await logAdminOperation({
          action: LOG_ACTIONS.UPDATE_RATING,
          entityType: EntityType.TV_SHOW,
          entityId: tvShowId,
          tvShowId: tvShowId,
          description: LogDescriptionBuilder.rating(EntityType.TV_SHOW, tvShow.name, oldRating, rating)
        })
        
        toast.success('评分更新成功')
      } else {
        const errorData = await response.json()
        toast.error('更新失败', {
          description: errorData.error || '未知错误'
        })
      }
    } catch (err) {
      console.error('Update rating error:', err)
      toast.error('更新失败', {
        description: '网络错误或服务器异常'
      })
    } finally {
      setUpdatingRating(null)
    }
  }, [tvShows])

  // 防抖处理的评分更新
  const handleRatingChange = useCallback((tvShowId: number, newRating: string) => {
    // 立即更新UI状态
    const rating = newRating ? parseFloat(newRating) : null
    setTvShows(prev => prev.map(t => 
      t.id === tvShowId ? { ...t, doubanRating: rating } : t
    ))

    // 清除之前的定时器
    if (ratingTimeoutRef.current) {
      clearTimeout(ratingTimeoutRef.current)
    }

    // 设置防抖定时器
    ratingTimeoutRef.current = setTimeout(() => {
      updateRatingAPI(tvShowId, newRating)
    }, 800) // 800ms 防抖延迟
  }, [updateRatingAPI])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTvShows(currentTvShows.map(tvShow => tvShow.id))
    } else {
      setSelectedTvShows([])
    }
  }

  const handleSelectTvShow = (tvShowId: number, checked: boolean) => {
    if (checked) {
      setSelectedTvShows(prev => [...prev, tvShowId])
    } else {
      setSelectedTvShows(prev => prev.filter(id => id !== tvShowId))
    }
  }

  // 批量更新观看状态
  const handleBatchStatusChange = async (newStatus: string) => {
    if (selectedTvShows.length === 0) return
    
    setBatchProcessing(true)
    try {
      const promises = selectedTvShows.map(async (tvShowId) => {
        const response = await fetch('/api/admin/content/update-status', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: tvShowId,
            type: 'tv',
            watchStatus: newStatus,
          }),
        })
        return { tvShowId, success: response.ok }
      })
      
      const results = await Promise.all(promises)
      const successCount = results.filter(r => r.success).length
      
      if (successCount > 0) {
        const newStatusLabel = WATCH_STATUS_OPTIONS.find(opt => opt.value === newStatus)?.label || newStatus
        setTvShows(prev => prev.map(s => 
          selectedTvShows.includes(s.id) ? { ...s, watchStatus: newStatus } : s
        ))
        
        // 使用标准化日志记录
        for (const tvShowId of selectedTvShows) {
          const tvShow = tvShows.find(s => s.id === tvShowId)
          if (tvShow) {
            await logAdminOperation({
              action: LOG_ACTIONS.BATCH_UPDATE_STATUS,
              entityType: EntityType.TV_SHOW,
              entityId: tvShowId,
              tvShowId: tvShowId,
              description: LogDescriptionBuilder.batchWatchStatus(EntityType.TV_SHOW, tvShow.name, newStatus, selectedTvShows.length)
            })
          }
        }
        
        toast.success(`成功更新 ${successCount} 部电视剧的观看状态`)
        setSelectedTvShows([])
      }
    } catch (error) {
      toast.error('批量更新失败')
    } finally {
      setBatchProcessing(false)
    }
  }

  // 批量切换显示状态
  const handleBatchToggleVisibility = async (isVisible: boolean) => {
    if (selectedTvShows.length === 0) return
    
    setBatchProcessing(true)
    try {
      const promises = selectedTvShows.map(async (tvShowId) => {
        const response = await fetch('/api/admin/content/toggle-visibility', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: tvShowId,
            type: 'tv',
            isVisible: isVisible
          })
        })
        return { tvShowId, success: response.ok }
      })
      
      const results = await Promise.all(promises)
      const successCount = results.filter(r => r.success).length
      
      if (successCount > 0) {
        setTvShows(prev => prev.map(s => 
          selectedTvShows.includes(s.id) ? { ...s, isVisible: isVisible } : s
        ))
        
        // 使用标准化日志记录
        for (const tvShowId of selectedTvShows) {
          const tvShow = tvShows.find(s => s.id === tvShowId)
          if (tvShow) {
            await logAdminOperation({
              action: LOG_ACTIONS.BATCH_TOGGLE_VISIBILITY,
              entityType: EntityType.TV_SHOW,
              entityId: tvShowId,
              tvShowId: tvShowId,
              description: LogDescriptionBuilder.batchVisibility(EntityType.TV_SHOW, tvShow.name, isVisible, selectedTvShows.length)
            })
          }
        }
        
        toast.success(`成功${isVisible ? '显示' : '隐藏'} ${successCount} 部电视剧`)
        setSelectedTvShows([])
      }
    } catch (error) {
      toast.error('批量操作失败')
    } finally {
      setBatchProcessing(false)
    }
  }

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedTvShows.length === 0) return
    
    setBatchProcessing(true)
    try {
      const promises = selectedTvShows.map(async (tvShowId) => {
        const response = await fetch(`/api/admin/content/manage?id=${tvShowId}&type=tv`, {
          method: 'DELETE',
        })
        return { tvShowId, success: response.ok }
      })
      
      const results = await Promise.all(promises)
      const successCount = results.filter(r => r.success).length
      
      if (successCount > 0) {
        // 使用标准化日志记录
        for (const tvShowId of selectedTvShows) {
          const tvShow = tvShows.find(s => s.id === tvShowId)
          if (tvShow) {
            await logAdminOperation({
              action: LOG_ACTIONS.BATCH_DELETE,
              entityType: EntityType.TV_SHOW,
              entityId: tvShowId,
              tvShowId: tvShowId,
              description: LogDescriptionBuilder.batchDelete(EntityType.TV_SHOW, tvShow.name, selectedTvShows.length)
            })
          }
        }
        
        setTvShows(prev => prev.filter(s => !selectedTvShows.includes(s.id)))
        toast.success(`成功删除 ${successCount} 部电视剧`)
        setSelectedTvShows([])
      }
    } catch (error) {
      toast.error('批量删除失败')
    } finally {
      setBatchProcessing(false)
    }
  }

  const handleToggleVisibility = async (tvShow: TvShow) => {
    setTogglingVisibility(tvShow.id)
    try {
      const response = await fetch(`/api/admin/content/toggle-visibility`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: tvShow.id,
          type: 'tv',
          isVisible: !tvShow.isVisible
        })
      })

      if (response.ok) {
        setTvShows(prev => prev.map(t => 
          t.id === tvShow.id ? { ...t, isVisible: !t.isVisible } : t
        ))
        
        // 使用标准化日志记录
        await logAdminOperation({
          action: LOG_ACTIONS.TOGGLE_VISIBILITY,
          entityType: EntityType.TV_SHOW,
          entityId: tvShow.id,
          tvShowId: tvShow.id,
          description: LogDescriptionBuilder.visibility(EntityType.TV_SHOW, tvShow.name, !tvShow.isVisible)
        })
        
        toast.success('更新成功', {
          description: `电视剧《${tvShow.name}》${!tvShow.isVisible ? '已显示' : '已隐藏'}`
        })
      } else {
        const errorData = await response.json()
        toast.error('更新失败', {
          description: errorData.error || '未知错误'
        })
      }
    } catch (err) {
      console.error('Toggle visibility error:', err)
      toast.error('更新失败', {
        description: '网络错误或服务器异常'
      })
    } finally {
      setTogglingVisibility(null)
    }
  }

  const handleBatchProcessImages = async () => {
    if (selectedTvShows.length === 0) {
      toast.warning('请先选择要处理的电视剧')
      return
    }

    setProcessing(true)
    let successCount = 0
    let errorCount = 0

    try {
      for (const tvShowId of selectedTvShows) {
        try {
          const response = await fetch('/api/admin/images/process', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contentId: tvShowId,
              contentType: 'tv',
            })
          })

          if (response.ok) {
            successCount++
          } else {
            errorCount++
          }
        } catch (error) {
          errorCount++
        }
      }

      if (errorCount === 0) {
        toast.success('批量处理完成！', {
          description: `成功处理 ${successCount} 个电视剧`
        })
      } else {
        toast.warning('批量处理完成', {
          description: `成功: ${successCount} 个，失败: ${errorCount} 个`
        })
      }
      
      // 清空选择并刷新页面
      setSelectedTvShows([])
      window.location.reload()
    } catch (error) {
      toast.error('批量处理过程中出现错误')
    } finally {
      setProcessing(false)
    }
  }

  const handleDeleteClick = (tvShow: TvShow) => {
    setDeleteDialog({ isOpen: true, tvShow })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.tvShow) return

    setDeleting(true)
    try {
      const response = await fetch(
        `/api/admin/content/manage?id=${deleteDialog.tvShow.id}&type=tv`,
        {
          method: 'DELETE',
        }
      )

      if (response.ok) {
        toast.success('删除成功', {
          description: `电视剧《${deleteDialog.tvShow.name}》已删除`
        })
        setTvShows(prev => prev.filter(t => t.id !== deleteDialog.tvShow!.id))
        setDeleteDialog({ isOpen: false, tvShow: null })
      } else {
        const errorData = await response.json()
        toast.error('删除失败', {
          description: errorData.error || '未知错误'
        })
      }
    } catch (err) {
      console.error('Delete error:', err)
      toast.error('删除失败', {
        description: '网络错误或服务器异常'
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, tvShow: null })
  }

  const tvShowsNeedingImages = currentTvShows.filter(tvShow => 
    (tvShow.posterPath && !tvShow.posterUrl) || (tvShow.backdropPath && !tvShow.backdropUrl)
  )
  const allSelected = currentTvShows.length > 0 && 
    currentTvShows.every(tvShow => selectedTvShows.includes(tvShow.id))

  if (tvShows.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg p-8 text-center border border-slate-200 dark:border-slate-700">
        <p className="text-slate-600 dark:text-slate-400">暂无电视剧数据</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 批量操作工具栏 */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-3 gap-4 items-center min-h-[40px]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-blue-600 focus:ring-blue-500"
              />
              <span>全选当前页面 ({currentTvShows.length} 个)</span>
            </div>
            {selectedTvShows.length > 0 && (
              <span className="text-blue-400 text-sm">
                已选择 {selectedTvShows.length} 部电视剧
              </span>
            )}
          </div>

          {/* 搜索栏 */}
          <div className="flex justify-center">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索电视剧名称..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 justify-end">
            {selectedTvShows.length > 0 && (
              <>
                {/* 批量观看状态 */}
                <Select onValueChange={handleBatchStatusChange} disabled={batchProcessing}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue placeholder="设置状态" />
                  </SelectTrigger>
                  <SelectContent>
                    {WATCH_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${option.color}`}>
                          {option.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* 批量显示/隐藏 */}
                <Button
                  onClick={() => handleBatchToggleVisibility(true)}
                  disabled={batchProcessing}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  显示
                </Button>
                
                <Button
                  onClick={() => handleBatchToggleVisibility(false)}
                  disabled={batchProcessing}
                  variant="outline"
                  size="sm" 
                  className="h-8 text-xs"
                >
                  <EyeOff className="h-3 w-3 mr-1" />
                  隐藏
                </Button>
                
                {/* 批量删除 */}
                <Button
                  onClick={handleBatchDelete}
                  disabled={batchProcessing}
                  variant="destructive"
                  size="sm"
                  className="h-8 text-xs"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  删除
                </Button>
                
                {/* 批量处理图片 */}
                {tvShowsNeedingImages.some(s => selectedTvShows.includes(s.id)) && (
                  <Button
                    onClick={handleBatchProcessImages}
                    disabled={processing || batchProcessing}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                  >
                    {processing ? (
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Download className="h-3 w-3 mr-1" />
                    )}
                    处理图片
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 电视剧列表 */}
      <div className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider w-20">
                  选择
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  电视剧
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  评分
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  季数/集数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  评论数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  添加时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  显示
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {currentTvShows.map((tvShow) => {
                const needsImage = (tvShow.posterPath && !tvShow.posterUrl) || (tvShow.backdropPath && !tvShow.backdropUrl)
                return (
                  <tr key={tvShow.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedTvShows.includes(tvShow.id)}
                          onChange={(e) => handleSelectTvShow(tvShow.id, e.target.checked)}
                          className="rounded border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-blue-600 focus:ring-blue-500"
                        />
                        {needsImage && (
                          <div className="w-2 h-2 bg-yellow-500 rounded-full" title="需要处理图片" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-16 w-12 relative">
                          {tvShow.posterUrl || tvShow.posterPath ? (
                            <>
                              <Image
                                src={tvShow.posterUrl || `https://image.tmdb.org/t/p/w92${tvShow.posterPath}`}
                                alt={tvShow.name}
                                width={48}
                                height={64}
                                className="rounded object-cover"
                              />
                              {!tvShow.posterUrl && tvShow.posterPath && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border border-slate-800" 
                                     title="需要爬取到OSS" />
                              )}
                            </>
                          ) : (
                            <div className="w-12 h-16 bg-slate-600 rounded flex items-center justify-center">
                              <span className="text-slate-600 dark:text-slate-400 text-xs">无图</span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-50">
                            {tvShow.name}
                          </div>
                          {tvShow.originalName && tvShow.originalName !== tvShow.name && (
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              {tvShow.originalName}
                            </div>
                          )}
                          {tvShow.firstAirDate && (
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              {new Date(tvShow.firstAirDate).getFullYear()}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Select 
                        value={tvShow.watchStatus} 
                        onValueChange={(value) => handleStatusChange(tvShow.id, value)}
                        disabled={updatingStatus === tvShow.id}
                      >
                        <SelectTrigger className="w-28 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {WATCH_STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${option.color}`}>
                                {option.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-400" />
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          value={tvShow.doubanRating || ''}
                          onChange={(e) => handleRatingChange(tvShow.id, e.target.value)}
                          disabled={updatingRating === tvShow.id}
                          placeholder="评分"
                          className="w-16 px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 disabled:opacity-50"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                      <div className="space-y-1">
                        {tvShow.numberOfSeasons && (
                          <div>{tvShow.numberOfSeasons} 季</div>
                        )}
                        {tvShow.numberOfEpisodes && (
                          <div>{tvShow.numberOfEpisodes} 集</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                      {tvShow._count.reviews}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                      {format(new Date(tvShow.createdAt), 'yyyy-MM-dd', { locale: zhCN })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleVisibility(tvShow)}
                        disabled={togglingVisibility === tvShow.id}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                      >
                        {togglingVisibility === tvShow.id ? (
                          <RefreshCw className="h-4 w-4 text-slate-600 dark:text-slate-400 animate-spin" />
                        ) : tvShow.isVisible ? (
                          <Eye className="h-4 w-4 text-green-500 hover:text-green-400" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-red-500 hover:text-red-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/tv/${tvShow.id}/edit`}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button 
                          onClick={() => handleDeleteClick(tvShow)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 分页 */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredTvShows.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />

      {/* 删除确认对话框 */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="删除电视剧"
        message={
          deleteDialog.tvShow ? (
            <span>
              确定要删除电视剧《<strong>{deleteDialog.tvShow.name}</strong>》吗？
              <br />
              <span className="text-slate-600 dark:text-slate-400 text-xs mt-1 block">
                此操作不可撤销，将同时删除相关的评论和操作记录
              </span>
            </span>
          ) : ''
        }
        confirmText="删除"
        cancelText="取消"
        type="danger"
        loading={deleting}
      />
    </div>
  )
}