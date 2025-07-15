'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { WatchStatus } from '@prisma/client'
import { Save, ArrowLeft, Upload, Eye, EyeOff } from 'lucide-react'
import { FileUpload } from '@/components/FileUpload'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface EditContentFormProps {
  content: any
  type: 'movie' | 'tv'
}

const watchStatusOptions = [
  { value: WatchStatus.UNWATCHED, label: '未观看' },
  { value: WatchStatus.WATCHING, label: '观看中' },
  { value: WatchStatus.WATCHED, label: '已观看' },
  { value: WatchStatus.DROPPED, label: '弃剧' },
]

export function EditContentForm({ content, type }: EditContentFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: type === 'movie' ? content.title : content.name,
    originalTitle: type === 'movie' ? content.originalTitle : content.originalName,
    overview: content.overview || '',
    summary: content.summary || '',
    doubanRating: content.doubanRating || '',
    watchStatus: content.watchStatus,
    playUrl: content.playUrl || '',
    isVisible: content.isVisible,
    posterUrl: content.posterUrl || '',
    releaseDate: content.releaseDate || content.firstAirDate || '',
    runtime: content.runtime || '',
    numberOfSeasons: content.numberOfSeasons || '',
    numberOfEpisodes: content.numberOfEpisodes || '',
  })

  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const updateData: any = {
        title: type === 'movie' ? formData.title : undefined,
        name: type === 'tv' ? formData.title : undefined,
        originalTitle: type === 'movie' ? formData.originalTitle : undefined,
        originalName: type === 'tv' ? formData.originalTitle : undefined,
        overview: formData.overview,
        summary: formData.summary,
        doubanRating: formData.doubanRating ? parseFloat(formData.doubanRating) : null,
        watchStatus: formData.watchStatus,
        playUrl: formData.playUrl,
        isVisible: formData.isVisible,
        posterUrl: formData.posterUrl,
      }

      if (type === 'movie') {
        updateData.releaseDate = formData.releaseDate ? new Date(formData.releaseDate) : null
        updateData.runtime = formData.runtime ? parseInt(formData.runtime) : null
      } else {
        updateData.firstAirDate = formData.releaseDate ? new Date(formData.releaseDate) : null
        updateData.numberOfSeasons = formData.numberOfSeasons ? parseInt(formData.numberOfSeasons) : null
        updateData.numberOfEpisodes = formData.numberOfEpisodes ? parseInt(formData.numberOfEpisodes) : null
      }

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key]
        }
      })

      const response = await fetch(`/api/admin/content/edit`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: content.id,
          type,
          data: updateData,
        }),
      })

      if (response.ok) {
        toast.success('保存成功', {
          description: `${type === 'movie' ? '电影' : '电视剧'}信息已更新`
        })
        router.back()
      } else {
        const errorData = await response.json()
        toast.error('保存失败', {
          description: errorData.error || '未知错误'
        })
      }
    } catch (err) {
      console.error('Save error:', err)
      toast.error('保存失败', {
        description: '网络错误或服务器异常'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  const handleFileUpload = (url: string) => {
    setFormData(prev => ({ ...prev, posterUrl: url }))
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {type === 'movie' ? '电影标题' : '电视剧名称'}
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              原始标题
            </label>
            <input
              type="text"
              value={formData.originalTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, originalTitle: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {type === 'movie' ? '上映日期' : '首播日期'}
            </label>
            <input
              type="date"
              value={formData.releaseDate ? new Date(formData.releaseDate).toISOString().split('T')[0] : ''}
              onChange={(e) => setFormData(prev => ({ ...prev, releaseDate: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              豆瓣评分
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={formData.doubanRating}
              onChange={(e) => setFormData(prev => ({ ...prev, doubanRating: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {type === 'movie' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                时长（分钟）
              </label>
              <input
                type="number"
                value={formData.runtime}
                onChange={(e) => setFormData(prev => ({ ...prev, runtime: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {type === 'tv' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  季数
                </label>
                <input
                  type="number"
                  value={formData.numberOfSeasons}
                  onChange={(e) => setFormData(prev => ({ ...prev, numberOfSeasons: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  总集数
                </label>
                <input
                  type="number"
                  value={formData.numberOfEpisodes}
                  onChange={(e) => setFormData(prev => ({ ...prev, numberOfEpisodes: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              观看状态
            </label>
            <select
              value={formData.watchStatus}
              onChange={(e) => setFormData(prev => ({ ...prev, watchStatus: e.target.value as WatchStatus }))}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {watchStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Long text fields */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            剧情简介
          </label>
          <textarea
            value={formData.overview}
            onChange={(e) => setFormData(prev => ({ ...prev, overview: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            一句话总结
          </label>
          <textarea
            value={formData.summary}
            onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            播放链接
          </label>
          <input
            type="url"
            value={formData.playUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, playUrl: e.target.value }))}
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://..."
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            海报图片
          </label>
          <div className="space-y-4">
            {formData.posterUrl && (
              <div className="flex items-center gap-4">
                <img
                  src={formData.posterUrl}
                  alt="Current poster"
                  className="w-16 h-24 object-cover rounded"
                />
                <input
                  type="url"
                  value={formData.posterUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, posterUrl: e.target.value }))}
                  className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="图片URL"
                />
              </div>
            )}
            <FileUpload onUpload={handleFileUpload} />
          </div>
        </div>

        {/* Visibility toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, isVisible: !prev.isVisible }))}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
              formData.isVisible
                ? "bg-green-600 hover:bg-green-700 text-slate-900 dark:text-slate-50"
                : "bg-red-600 hover:bg-red-700 text-slate-900 dark:text-slate-50"
            )}
          >
            {formData.isVisible ? (
              <>
                <Eye className="h-4 w-4" />
                公开显示
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4" />
                隐藏内容
              </>
            )}
          </button>
        </div>

        {/* Form actions */}
        <div className="flex items-center gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-slate-900 dark:text-slate-50 px-6 py-2 rounded-lg transition-colors"
          >
            <Save className="h-4 w-4" />
            {loading ? '保存中...' : '保存更改'}
          </button>
          
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center gap-2 bg-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-50 px-6 py-2 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </button>
        </div>
      </form>
    </div>
  )
}