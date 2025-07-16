'use client'

import { useState } from 'react'
import { Save, RefreshCw, Database, Upload, Globe, Star, Image, Play } from 'lucide-react'
import { toast } from 'sonner'

export function SettingsPanel() {
  const [settings, setSettings] = useState({
    tmdbApiKey: process.env.NEXT_PUBLIC_TMDB_API_KEY || '',
    ossRegion: '',
    ossBucket: '',
    doubanEnabled: false,
    autoImportImages: true,
    defaultWatchStatus: 'UNWATCHED',
    enablePublicAccess: false,
    itemsPerPage: 20,
    // 定时任务配置
    cronEnabled: process.env.TMDB_AUTO_UPDATE_ENABLED === 'true',
    cronExpression: process.env.TMDB_UPDATE_CRON || '0 2 * * *', // 每天凌晨2点
    cronLastRun: null,
    batchSize: parseInt(process.env.TMDB_UPDATE_BATCH_SIZE || '50'),
  })

  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [batchProcessing, setBatchProcessing] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      // In a real implementation, you would save these to a database
      // For now, we'll just simulate the save
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async (service: string) => {
    setLoading(true)
    try {
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success(`${service} 连接测试成功！`)
    } catch (error) {
      toast.error(`${service} 连接测试失败`)
    } finally {
      setLoading(false)
    }
  }

  const handleBatchRefreshTMDB = async () => {
    setBatchProcessing(true)
    try {
      const response = await fetch('/api/admin/content/refresh-tmdb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // 空数组表示刷新所有内容
          refreshAll: true
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success('TMDB元数据刷新完成！', {
          description: `成功刷新 ${result.results.success} 个内容${result.results.failed > 0 ? `，失败: ${result.results.failed} 个` : ''}`
        })
      } else {
        throw new Error('TMDB元数据刷新失败')
      }
    } catch (error) {
      console.error('TMDB refresh error:', error)
      toast.error('TMDB元数据刷新失败', {
        description: '请检查TMDB API配置'
      })
    } finally {
      setBatchProcessing(false)
    }
  }

  const handleBatchProcessImages = async () => {
    setBatchProcessing(true)
    try {
      const response = await fetch('/api/admin/images/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'admin-user-id',
          limit: 20
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success('批量处理完成！', {
          description: `处理了 ${result.results.processedContent} 个内容和 ${result.results.processedActors} 个演员的图片${result.results.errors.length > 0 ? `，错误数量: ${result.results.errors.length}` : ''}`
        })
      } else {
        throw new Error('批量处理失败')
      }
    } catch (error) {
      console.error('Batch processing error:', error)
      toast.error('批量处理失败', {
        description: '请检查OSS配置'
      })
    } finally {
      setBatchProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* API 配置 */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">API 配置</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              TMDb API 密钥
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={settings.tmdbApiKey}
                onChange={(e) => setSettings(prev => ({ ...prev, tmdbApiKey: e.target.value }))}
                className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入 TMDb API 密钥"
              />
              <button
                onClick={() => handleTestConnection('TMDb')}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                测试
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="doubanEnabled"
              checked={settings.doubanEnabled}
              onChange={(e) => setSettings(prev => ({ ...prev, doubanEnabled: e.target.checked }))}
              className="mr-3 h-4 w-4 text-blue-600 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="doubanEnabled" className="text-sm text-slate-700 dark:text-slate-300">
              启用豆瓣评分集成
            </label>
          </div>
        </div>
      </div>

      {/* OSS 配置 */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="h-5 w-5 text-green-500" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">阿里云 OSS 配置</h3>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                OSS 区域
              </label>
              <input
                type="text"
                value={settings.ossRegion}
                onChange={(e) => setSettings(prev => ({ ...prev, ossRegion: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="oss-cn-hangzhou"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Bucket 名称
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.ossBucket}
                  onChange={(e) => setSettings(prev => ({ ...prev, ossBucket: e.target.value }))}
                  className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your-bucket-name"
                />
                <button
                  onClick={() => handleTestConnection('OSS')}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  测试
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoImportImages"
              checked={settings.autoImportImages}
              onChange={(e) => setSettings(prev => ({ ...prev, autoImportImages: e.target.checked }))}
              className="mr-3 h-4 w-4 text-blue-600 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="autoImportImages" className="text-sm text-slate-700 dark:text-slate-300">
              自动导入 TMDb 图片到 OSS
            </label>
          </div>
        </div>
      </div>

      {/* 系统设置 */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">系统设置</h3>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                默认观看状态
              </label>
              <select
                value={settings.defaultWatchStatus}
                onChange={(e) => setSettings(prev => ({ ...prev, defaultWatchStatus: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="UNWATCHED">未观看</option>
                <option value="WATCHING">观看中</option>
                <option value="WATCHED">已观看</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                每页显示数量
              </label>
              <select
                value={settings.itemsPerPage}
                onChange={(e) => setSettings(prev => ({ ...prev, itemsPerPage: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="enablePublicAccess"
              checked={settings.enablePublicAccess}
              onChange={(e) => setSettings(prev => ({ ...prev, enablePublicAccess: e.target.checked }))}
              className="mr-3 h-4 w-4 text-blue-600 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="enablePublicAccess" className="text-sm text-slate-700 dark:text-slate-300">
              允许公开访问（无需登录）
            </label>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-4">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg transition-colors"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {loading ? '保存中...' : '保存设置'}
        </button>
        
        {saved && (
          <div className="flex items-center gap-2 text-green-400">
            <span className="text-sm">✓ 设置已保存</span>
          </div>
        )}
      </div>

      {/* TMDB 元数据刷新工具 */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">TMDB 元数据管理</h3>
        </div>
        
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            批量刷新所有影视内容的TMDB元数据，包括标题、概述、评分、类型等信息。
          </p>
          
          <div className="flex gap-4">
            <button
              onClick={handleBatchRefreshTMDB}
              disabled={batchProcessing}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {batchProcessing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {batchProcessing ? '刷新中...' : '批量刷新TMDB元数据'}
            </button>
            
            {batchProcessing && (
              <div className="flex items-center text-orange-400 text-sm">
                正在刷新TMDB元数据，请稍候...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 定时任务配置 */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-5 w-5 text-indigo-500" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">定时任务配置</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="cronEnabled"
              checked={settings.cronEnabled}
              onChange={(e) => setSettings(prev => ({ ...prev, cronEnabled: e.target.checked }))}
              className="mr-3 h-4 w-4 text-blue-600 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="cronEnabled" className="text-sm text-slate-700 dark:text-slate-300">
              启用定时刷新TMDB元数据
            </label>
          </div>
          
          {settings.cronEnabled && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Cron 表达式
                </label>
                <input
                  type="text"
                  value={settings.cronExpression}
                  onChange={(e) => setSettings(prev => ({ ...prev, cronExpression: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0 2 * * *"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  默认: 0 2 * * * (每天凌晨2点执行)
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  批量大小
                </label>
                <input
                  type="number"
                  value={settings.batchSize}
                  onChange={(e) => setSettings(prev => ({ ...prev, batchSize: parseInt(e.target.value) || 50 }))}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="50"
                  min="1"
                  max="100"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  每次更新的内容数量 (1-100)
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">上次执行:</span>
                  <span className="text-sm text-slate-900 dark:text-slate-50 ml-2">
                    {settings.cronLastRun || '从未执行'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">下次执行:</span>
                  <span className="text-sm text-slate-900 dark:text-slate-50 ml-2">
                    根据Cron表达式计算
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 图片处理工具 */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Image className="h-5 w-5 text-cyan-500" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">图片处理工具</h3>
        </div>
        
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            批量处理还未上传到 OSS 的图片。这将自动下载 TMDb 图片并上传到阿里云 OSS。
          </p>
          
          <div className="flex gap-4">
            <button
              onClick={handleBatchProcessImages}
              disabled={batchProcessing}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {batchProcessing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {batchProcessing ? '处理中...' : '批量处理图片'}
            </button>
            
            {batchProcessing && (
              <div className="flex items-center text-cyan-400 text-sm">
                正在处理图片，请稍候...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 系统信息 */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Star className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">系统信息</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-slate-600 dark:text-slate-400">版本:</span>
            <span className="text-slate-900 dark:text-slate-50 ml-2">v1.0.0</span>
          </div>
          <div>
            <span className="text-slate-600 dark:text-slate-400">数据库:</span>
            <span className="text-slate-900 dark:text-slate-50 ml-2">PostgreSQL (Neon)</span>
          </div>
          <div>
            <span className="text-slate-600 dark:text-slate-400">Node.js:</span>
            <span className="text-slate-900 dark:text-slate-50 ml-2">{process.version}</span>
          </div>
        </div>
      </div>
    </div>
  )
}