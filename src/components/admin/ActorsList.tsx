'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { User, Film, Tv } from 'lucide-react'
import Image from 'next/image'
import { Pagination } from '@/components/ui/Pagination'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Actor {
  id: number
  tmdbId: number
  name: string
  originalName: string | null
  biography: string | null
  birthday: Date | null
  deathday: Date | null
  gender: number | null
  profilePath: string | null
  profileUrl: string | null
  createdAt: Date
  updatedAt: Date
  _count: {
    movieRoles: number
    tvRoles: number
  }
}

interface ActorsListProps {
  actors: Actor[]
}

const ITEMS_PER_PAGE = 20

export function ActorsList({ actors: initialActors }: ActorsListProps) {
  const [actors] = useState<Actor[]>(initialActors)
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(actors.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentActors = actors.slice(startIndex, endIndex)

  if (actors.length === 0) {
    return (
      <div className="space-y-4">
        <Card className="bg-white dark:bg-slate-800/50 backdrop-blur-sm border-slate-200 dark:border-slate-700">
          <CardContent className="text-center py-8">
            <p className="text-slate-600 dark:text-slate-400">暂无演员数据</p>
            <p className="text-slate-500 text-sm mt-2">演员信息会在导入电影/电视剧时自动创建</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 演员列表 */}
      <Card className="bg-white dark:bg-slate-800/50 backdrop-blur-sm border-slate-200 dark:border-slate-700 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-50">演员列表 ({actors.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto scrollbar-custom">
            <table className="w-full">
              <thead className="bg-slate-100 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    演员
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    电影作品
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    电视剧作品
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    TMDb ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    添加时间
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {currentActors.map((actor) => (
                  <tr key={actor.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 relative">
                          <div className="w-12 h-16 relative">
                            {actor.profileUrl || actor.profilePath ? (
                              <Image
                                src={actor.profileUrl || `https://image.tmdb.org/t/p/w185${actor.profilePath}`}
                                alt={actor.name}
                                fill
                                className="rounded object-cover"
                                sizes="48px"
                              />
                            ) : (
                              <div className="w-12 h-16 bg-slate-600 rounded flex items-center justify-center">
                                <User className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="ml-4 min-w-0 flex-1">
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">
                            {actor.name}
                          </div>
                          {actor.originalName && actor.originalName !== actor.name && (
                            <div className="text-sm text-slate-600 dark:text-slate-400 truncate">
                              {actor.originalName}
                            </div>
                          )}
                          {actor.birthday && (
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              {format(new Date(actor.birthday), 'yyyy-MM-dd', { locale: zhCN })}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline" className="text-xs border-blue-500 text-blue-400">
                        <Film className="h-3 w-3 mr-1" />
                        {actor._count.movieRoles}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline" className="text-xs border-green-500 text-green-400">
                        <Tv className="h-3 w-3 mr-1" />
                        {actor._count.tvRoles}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                      {actor.tmdbId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                      {format(new Date(actor.createdAt), 'yyyy-MM-dd', { locale: zhCN })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 分页 */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={actors.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />
    </div>
  )
}