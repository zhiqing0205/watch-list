'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Plus, Film, Tv, Star, Calendar, Clock, Globe } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface TMDbSearchResult {
  id: number
  title?: string
  name?: string
  original_title?: string
  original_name?: string
  overview: string
  release_date?: string
  first_air_date?: string
  poster_path: string
  vote_average: number
  genre_ids: number[]
}

export function AddContentForm() {
  const searchParams = useSearchParams()
  const typeParam = searchParams.get('type')
  
  // 根据 URL 参数设置默认类型，如果没有参数则默认为电视剧
  const getInitialType = () => {
    if (typeParam === 'movie') return 'movie'
    if (typeParam === 'tv') return 'tv'
    return 'tv' // 默认电视剧
  }
  
  const [searchType, setSearchType] = useState<'movie' | 'tv'>(getInitialType())
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<TMDbSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState<number | null>(null)

  // 监听 URL 参数变化
  useEffect(() => {
    setSearchType(getInitialType())
  }, [typeParam])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const apiPath = searchType === 'movie' ? 'movies' : 'tv'
      const response = await fetch(`/api/tmdb/search/${apiPath}?query=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      setSearchResults(data.results || [])
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (result: TMDbSearchResult) => {
    setAdding(result.id)
    try {
      // Step 1: Import content
      const response = await fetch('/api/admin/content/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tmdbId: result.id,
          type: searchType,
        })
      })

      if (response.ok) {
        const importResult = await response.json()
        const contentId = importResult.data.id
        
        toast.info(`成功添加${searchType === 'movie' ? '电影' : '电视剧'}`, {
          description: '正在处理图片...'
        })
        
        // Step 2: Process images asynchronously
        try {
          const imageResponse = await fetch('/api/admin/images/process', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contentId,
              contentType: searchType,
            })
          })

          if (imageResponse.ok) {
            const imageResult = await imageResponse.json()
            console.log('Images processed:', imageResult.results)
            toast.success('图片处理完成！', {
              description: `上传了 ${imageResult.results.contentImages} 个内容图片和 ${imageResult.results.actorImages} 个演员图片`
            })
          } else {
            console.warn('Image processing failed, but content was added successfully')
            toast.error('图片处理失败', {
              description: '内容已添加，请稍后手动处理'
            })
          }
        } catch (imageError) {
          console.warn('Image processing error:', imageError)
          toast.error('图片处理遇到问题', {
            description: '内容已添加，请稍后手动处理'
          })
        }
        
        // Remove from search results
        setSearchResults(prev => prev.filter(item => item.id !== result.id))
      } else {
        const errorData = await response.json()
        toast.error('添加失败', {
          description: errorData.error
        })
      }
    } catch (error) {
      console.error('Add error:', error)
      toast.error('添加失败')
    } finally {
      setAdding(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card className="bg-white dark:bg-slate-800/50 backdrop-blur-sm border-slate-200 dark:border-slate-700">
        <CardHeader>
          <div className="flex gap-4">
            <Button
              onClick={() => setSearchType('tv')}
              variant={searchType === 'tv' ? "default" : "outline"}
              className={cn(
                'flex items-center gap-2',
                searchType === 'tv'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 border-slate-300 dark:border-slate-600'
              )}
            >
              <Tv className="h-4 w-4" />
              电视剧
            </Button>
            <Button
              onClick={() => setSearchType('movie')}
              variant={searchType === 'movie' ? "default" : "outline"}
              className={cn(
                'flex items-center gap-2',
                searchType === 'movie'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 border-slate-300 dark:border-slate-600'
              )}
            >
              <Film className="h-4 w-4" />
              电影
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`搜索${searchType === 'movie' ? '电影' : '电视剧'}...`}
              className="flex-1 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-50 placeholder-slate-400"
            />
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Search className="h-4 w-4 mr-2" />
              搜索
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Search Results */}
      {loading && (
        <Card className="bg-white dark:bg-slate-800/50 backdrop-blur-sm border-slate-200 dark:border-slate-700">
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-slate-600 dark:text-slate-400 mt-2">搜索中...</p>
          </CardContent>
        </Card>
      )}

      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">搜索结果</h3>
          <div className="grid gap-4">
            {searchResults.map((result) => (
              <Card key={result.id} className="bg-white dark:bg-slate-800/50 backdrop-blur-sm border-slate-200 dark:border-slate-700">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-24 relative rounded overflow-hidden bg-slate-100 dark:bg-slate-700">
                        {result.poster_path ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w92${result.poster_path}`}
                            alt={result.title || result.name || ''}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Globe className="h-6 w-6 text-slate-500" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="text-slate-900 dark:text-slate-50 font-medium mb-1">
                        {result.title || result.name}
                      </h4>
                      {(result.original_title || result.original_name) && 
                       (result.original_title || result.original_name) !== (result.title || result.name) && (
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">
                          {result.original_title || result.original_name}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-slate-700 dark:text-slate-300 mb-2">
                        {(result.release_date || result.first_air_date) && (
                          <Badge variant="outline" className="text-xs border-slate-300 dark:border-slate-600">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(result.release_date || result.first_air_date || '').getFullYear()}
                          </Badge>
                        )}
                        
                        {result.vote_average > 0 && (
                          <Badge variant="outline" className="text-xs border-slate-300 dark:border-slate-600">
                            <Star className="h-3 w-3 text-yellow-400 mr-1" />
                            {result.vote_average.toFixed(1)}
                          </Badge>
                        )}
                      </div>
                      
                      {result.overview && (
                        <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 mb-3">
                          {result.overview}
                        </p>
                      )}
                      
                      <Button
                        onClick={() => handleAdd(result)}
                        disabled={adding === result.id}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {adding === result.id ? '添加中...' : '添加'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {searchResults.length === 0 && searchQuery && !loading && (
        <Card className="bg-white dark:bg-slate-800/50 backdrop-blur-sm border-slate-200 dark:border-slate-700">
          <CardContent className="text-center py-8">
            <p className="text-slate-600 dark:text-slate-400">没有找到相关内容</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}