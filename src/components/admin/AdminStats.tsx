'use client'

import { useEffect, useState } from 'react'
import { Film, Tv, Users, Eye, Clock, CheckCircle } from 'lucide-react'

interface StatsData {
  totalMovies: number
  totalTvShows: number
  watchedMovies: number
  watchedTvShows: number
  watchingMovies: number
  watchingTvShows: number
  totalActors: number
  totalUsers: number
}

export function AdminStats() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/admin/stats')
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-lg p-6 animate-pulse border border-slate-200 dark:border-slate-700">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!stats) {
    return <div className="text-slate-900 dark:text-slate-50">Failed to load stats</div>
  }

  const statCards = [
    {
      title: '电影总数',
      value: stats.totalMovies,
      icon: Film,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: '电视剧总数',
      value: stats.totalTvShows,
      icon: Tv,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: '演员总数',
      value: stats.totalActors,
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: '用户总数',
      value: stats.totalUsers,
      icon: Eye,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: '已观看电影',
      value: stats.watchedMovies,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: '已观看电视剧',
      value: stats.watchedTvShows,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: '正在观看电影',
      value: stats.watchingMovies,
      icon: Clock,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: '正在观看电视剧',
      value: stats.watchingTvShows,
      icon: Clock,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((card) => (
        <div key={card.title} className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">{card.title}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-slate-900 dark:text-slate-50">{card.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}