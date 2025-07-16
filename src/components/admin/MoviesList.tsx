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

interface Movie {
  id: number
  tmdbId: number
  title: string
  originalTitle: string | null
  releaseDate: Date | null
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

interface MoviesListProps {
  movies: Movie[]
}

const ITEMS_PER_PAGE = 10

const WATCH_STATUS_OPTIONS = [
  { value: 'UNWATCHED', label: '未观看', color: 'bg-gray-100 text-gray-800' },
  { value: 'WATCHING', label: '观看中', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'WATCHED', label: '已观看', color: 'bg-green-100 text-green-800' },
  { value: 'DROPPED', label: '弃剧', color: 'bg-red-100 text-red-800' },
]

export function MoviesList({ movies: initialMovies }: MoviesListProps) {
  const [movies, setMovies] = useState<Movie[]>(initialMovies)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedMovies, setSelectedMovies] = useState<number[]>([])
  const [processing, setProcessing] = useState(false)
  const [batchProcessing, setBatchProcessing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; movie: Movie | null }>({
    isOpen: false,
    movie: null
  })
  const [deleting, setDeleting] = useState(false)
  const [togglingVisibility, setTogglingVisibility] = useState<number | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null)
  const [updatingRating, setUpdatingRating] = useState<number | null>(null)

  // 根据搜索条件过滤电影
  const filteredMovies = useMemo(() => {
    if (!searchTerm.trim()) {
      return movies
    }
    
    return movies.filter(movie => 
      movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (movie.originalTitle && movie.originalTitle.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [movies, searchTerm])

  const totalPages = Math.ceil(filteredMovies.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentMovies = filteredMovies.slice(startIndex, endIndex)

  // 当搜索条件改变时重置到第一页
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
    setSelectedMovies([]) // 清空选择
  }, [])


  // 更新观看状态
  const handleStatusChange = async (movieId: number, newStatus: string) => {
    const movie = movies.find(m => m.id === movieId)
    if (!movie || movie.watchStatus === newStatus) return

    setUpdatingStatus(movieId)
    try {
      const response = await fetch('/api/admin/content/update-status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: movieId,
          type: 'movie',
          watchStatus: newStatus,
        }),
      })

      if (response.ok) {
        setMovies(prev => prev.map(m => 
          m.id === movieId ? { ...m, watchStatus: newStatus } : m
        ))
        
        // 使用标准化日志记录
        await logAdminOperation({
          action: LOG_ACTIONS.UPDATE_WATCH_STATUS,
          entityType: EntityType.MOVIE,
          entityId: movieId,
          movieId: movieId,
          description: LogDescriptionBuilder.watchStatus(EntityType.MOVIE, movie.title, movie.watchStatus, newStatus)
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
  const updateRatingAPI = useCallback(async (movieId: number, newRating: string) => {
    const movie = movies.find(m => m.id === movieId)
    if (!movie) return

    const rating = newRating ? parseFloat(newRating) : null
    if (rating !== null && (rating < 0 || rating > 10)) {
      toast.error('评分范围应在0-10之间')
      return
    }

    setUpdatingRating(movieId)
    try {
      const response = await fetch('/api/admin/content/update-rating', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: movieId,
          type: 'movie',
          rating: rating,
        }),
      })

      if (response.ok) {
        const oldRating = movie.doubanRating
        
        // 使用标准化日志记录
        await logAdminOperation({
          action: LOG_ACTIONS.UPDATE_RATING,
          entityType: EntityType.MOVIE,
          entityId: movieId,
          movieId: movieId,
          description: LogDescriptionBuilder.rating(EntityType.MOVIE, movie.title, oldRating, rating)
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
  }, [movies])

  // 防抖处理的评分更新
  const handleRatingChange = useCallback((movieId: number, newRating: string) => {
    // 立即更新UI状态
    const rating = newRating ? parseFloat(newRating) : null
    setMovies(prev => prev.map(m => 
      m.id === movieId ? { ...m, doubanRating: rating } : m
    ))

    // 清除之前的定时器
    if (ratingTimeoutRef.current) {
      clearTimeout(ratingTimeoutRef.current)
    }

    // 设置防抖定时器
    ratingTimeoutRef.current = setTimeout(() => {
      updateRatingAPI(movieId, newRating)
    }, 800) // 800ms 防抖延迟
  }, [updateRatingAPI])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMovies(currentMovies.map(movie => movie.id))
    } else {
      setSelectedMovies([])
    }
  }

  const handleSelectMovie = (movieId: number, checked: boolean) => {
    if (checked) {
      setSelectedMovies(prev => [...prev, movieId])
    } else {
      setSelectedMovies(prev => prev.filter(id => id !== movieId))
    }
  }

  // 批量更新观看状态
  const handleBatchStatusChange = async (newStatus: string) => {
    if (selectedMovies.length === 0) return
    
    setBatchProcessing(true)
    try {
      const promises = selectedMovies.map(async (movieId) => {
        const response = await fetch('/api/admin/content/update-status', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: movieId,
            type: 'movie',
            watchStatus: newStatus,
          }),
        })
        return { movieId, success: response.ok }
      })
      
      const results = await Promise.all(promises)
      const successCount = results.filter(r => r.success).length
      
      if (successCount > 0) {
        setMovies(prev => prev.map(m => 
          selectedMovies.includes(m.id) ? { ...m, watchStatus: newStatus } : m
        ))
        
        // 使用标准化日志记录
        for (const movieId of selectedMovies) {
          const movie = movies.find(m => m.id === movieId)
          if (movie) {
            await logAdminOperation({
              action: LOG_ACTIONS.BATCH_UPDATE_STATUS,
              entityType: EntityType.MOVIE,
              entityId: movieId,
              movieId: movieId,
              description: LogDescriptionBuilder.batchWatchStatus(EntityType.MOVIE, movie.title, newStatus, selectedMovies.length)
            })
          }
        }
        
        toast.success(`成功更新 ${successCount} 部电影的观看状态`)
        setSelectedMovies([])
      }
    } catch (error) {
      toast.error('批量更新失败')
    } finally {
      setBatchProcessing(false)
    }
  }

  // 批量切换显示状态
  const handleBatchToggleVisibility = async (isVisible: boolean) => {
    if (selectedMovies.length === 0) return
    
    setBatchProcessing(true)
    try {
      const promises = selectedMovies.map(async (movieId) => {
        const response = await fetch('/api/admin/content/toggle-visibility', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: movieId,
            type: 'movie',
            isVisible: isVisible
          })
        })
        return { movieId, success: response.ok }
      })
      
      const results = await Promise.all(promises)
      const successCount = results.filter(r => r.success).length
      
      if (successCount > 0) {
        setMovies(prev => prev.map(m => 
          selectedMovies.includes(m.id) ? { ...m, isVisible: isVisible } : m
        ))
        
        // 使用标准化日志记录
        for (const movieId of selectedMovies) {
          const movie = movies.find(m => m.id === movieId)
          if (movie) {
            await logAdminOperation({
              action: LOG_ACTIONS.BATCH_TOGGLE_VISIBILITY,
              entityType: EntityType.MOVIE,
              entityId: movieId,
              movieId: movieId,
              description: LogDescriptionBuilder.batchVisibility(EntityType.MOVIE, movie.title, isVisible, selectedMovies.length)
            })
          }
        }
        
        toast.success(`成功${isVisible ? '显示' : '隐藏'} ${successCount} 部电影`)
        setSelectedMovies([])
      }
    } catch (error) {
      toast.error('批量操作失败')
    } finally {
      setBatchProcessing(false)
    }
  }

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedMovies.length === 0) return
    
    setBatchProcessing(true)
    try {
      const promises = selectedMovies.map(async (movieId) => {
        const response = await fetch(`/api/admin/content/manage?id=${movieId}&type=movie`, {
          method: 'DELETE',
        })
        return { movieId, success: response.ok }
      })
      
      const results = await Promise.all(promises)
      const successCount = results.filter(r => r.success).length
      
      if (successCount > 0) {
        // 使用标准化日志记录
        for (const movieId of selectedMovies) {
          const movie = movies.find(m => m.id === movieId)
          if (movie) {
            await logAdminOperation({
              action: LOG_ACTIONS.BATCH_DELETE,
              entityType: EntityType.MOVIE,
              entityId: movieId,
              movieId: movieId,
              description: LogDescriptionBuilder.batchDelete(EntityType.MOVIE, movie.title, selectedMovies.length)
            })
          }
        }
        
        setMovies(prev => prev.filter(m => !selectedMovies.includes(m.id)))
        toast.success(`成功删除 ${successCount} 部电影`)
        setSelectedMovies([])
      }
    } catch (error) {
      toast.error('批量删除失败')
    } finally {
      setBatchProcessing(false)
    }
  }

  const handleToggleVisibility = async (movie: Movie) => {
    setTogglingVisibility(movie.id)
    try {
      const response = await fetch(`/api/admin/content/toggle-visibility`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: movie.id,
          type: 'movie',
          isVisible: !movie.isVisible
        })
      })

      if (response.ok) {
        setMovies(prev => prev.map(m => 
          m.id === movie.id ? { ...m, isVisible: !m.isVisible } : m
        ))
        
        // 使用标准化日志记录
        await logAdminOperation({
          action: LOG_ACTIONS.TOGGLE_VISIBILITY,
          entityType: EntityType.MOVIE,
          entityId: movie.id,
          movieId: movie.id,
          description: LogDescriptionBuilder.visibility(EntityType.MOVIE, movie.title, !movie.isVisible)
        })
        
        toast.success('更新成功', {
          description: `电影《${movie.title}》${!movie.isVisible ? '已显示' : '已隐藏'}`
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
    if (selectedMovies.length === 0) {
      toast.warning('请先选择要处理的电影')
      return
    }

    setProcessing(true)
    let successCount = 0
    let errorCount = 0

    try {
      for (const movieId of selectedMovies) {
        try {
          const response = await fetch('/api/admin/images/process', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contentId: movieId,
              contentType: 'movie',
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
          description: `成功处理 ${successCount} 个电影`
        })
      } else {
        toast.warning('批量处理完成', {
          description: `成功: ${successCount} 个，失败: ${errorCount} 个`
        })
      }
      
      setSelectedMovies([])
      window.location.reload()
    } catch (error) {
      toast.error('批量处理过程中出现错误')
    } finally {
      setProcessing(false)
    }
  }

  const handleRefreshTMDBMetadata = async () => {
    if (selectedMovies.length === 0) return
    
    setProcessing(true)
    try {
      const response = await fetch('/api/admin/content/refresh-tmdb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          movieIds: selectedMovies
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.results.failed === 0) {
          toast.success('TMDB元数据刷新完成！', {
            description: `成功刷新 ${result.results.success} 个电影的元数据`
          })
        } else {
          toast.warning('TMDB元数据刷新完成', {
            description: `成功: ${result.results.success} 个，失败: ${result.results.failed} 个`
          })
        }
      } else {
        toast.error('TMDB元数据刷新失败')
      }
      
      setSelectedMovies([])
      window.location.reload()
    } catch (error) {
      toast.error('TMDB元数据刷新过程中出现错误')
    } finally {
      setProcessing(false)
    }
  }

  const handleDeleteClick = (movie: Movie) => {
    setDeleteDialog({ isOpen: true, movie })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.movie) return

    setDeleting(true)
    try {
      const response = await fetch(
        `/api/admin/content/manage?id=${deleteDialog.movie.id}&type=movie`,
        {
          method: 'DELETE',
        }
      )

      if (response.ok) {
        toast.success('删除成功', {
          description: `电影《${deleteDialog.movie.title}》已删除`
        })
        setMovies(prev => prev.filter(m => m.id !== deleteDialog.movie!.id))
        setDeleteDialog({ isOpen: false, movie: null })
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
    setDeleteDialog({ isOpen: false, movie: null })
  }

  const moviesNeedingImages = currentMovies.filter(movie => 
    (movie.posterPath && !movie.posterUrl) || (movie.backdropPath && !movie.backdropUrl)
  )
  const allSelected = currentMovies.length > 0 && 
    currentMovies.every(movie => selectedMovies.includes(movie.id))

  if (movies.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg p-8 text-center border border-slate-200 dark:border-slate-700">
        <p className="text-slate-600 dark:text-slate-400">暂无电影数据</p>
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
              <span>全选当前页面 ({currentMovies.length} 个)</span>
            </div>
            {selectedMovies.length > 0 && (
              <span className="text-blue-400 text-sm">
                已选择 {selectedMovies.length} 部电影
              </span>
            )}
          </div>

          {/* 搜索栏 */}
          <div className="flex justify-center">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索电影名称..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 justify-end">
            {selectedMovies.length > 0 && (
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
                {moviesNeedingImages.some(m => selectedMovies.includes(m.id)) && (
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
                
                {/* 刷新TMDB元数据 */}
                <Button
                  onClick={handleRefreshTMDBMetadata}
                  disabled={processing || batchProcessing}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                >
                  {processing ? (
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3 mr-1" />
                  )}
                  刷新元数据
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 电影列表 */}
      <div className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider w-20">
                  选择
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  电影
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  评分
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
              {currentMovies.map((movie) => {
                const needsImage = (movie.posterPath && !movie.posterUrl) || (movie.backdropPath && !movie.backdropUrl)
                return (
                  <tr key={movie.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedMovies.includes(movie.id)}
                          onChange={(e) => handleSelectMovie(movie.id, e.target.checked)}
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
                          {movie.posterUrl || movie.posterPath ? (
                            <>
                              <Image
                                src={movie.posterUrl || `https://image.tmdb.org/t/p/w92${movie.posterPath}`}
                                alt={movie.title}
                                width={48}
                                height={64}
                                className="rounded object-cover"
                              />
                              {!movie.posterUrl && movie.posterPath && (
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
                            {movie.title}
                          </div>
                          {movie.originalTitle && movie.originalTitle !== movie.title && (
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              {movie.originalTitle}
                            </div>
                          )}
                          {movie.releaseDate && (
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              {new Date(movie.releaseDate).getFullYear()}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Select 
                        value={movie.watchStatus} 
                        onValueChange={(value) => handleStatusChange(movie.id, value)}
                        disabled={updatingStatus === movie.id}
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
                          value={movie.doubanRating || ''}
                          onChange={(e) => handleRatingChange(movie.id, e.target.value)}
                          disabled={updatingRating === movie.id}
                          placeholder="评分"
                          className="w-16 px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 disabled:opacity-50"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                      {movie._count.reviews}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                      {format(new Date(movie.createdAt), 'yyyy-MM-dd', { locale: zhCN })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleVisibility(movie)}
                        disabled={togglingVisibility === movie.id}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                      >
                        {togglingVisibility === movie.id ? (
                          <RefreshCw className="h-4 w-4 text-slate-600 dark:text-slate-400 animate-spin" />
                        ) : movie.isVisible ? (
                          <Eye className="h-4 w-4 text-green-500 hover:text-green-400" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-red-500 hover:text-red-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/movies/${movie.id}/edit`}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button 
                          onClick={() => handleDeleteClick(movie)}
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
        totalItems={filteredMovies.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />

      {/* 删除确认对话框 */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="删除电影"
        message={
          deleteDialog.movie ? (
            <span>
              确定要删除电影《<strong>{deleteDialog.movie.title}</strong>》吗？
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