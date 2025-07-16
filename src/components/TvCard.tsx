import Image from 'next/image'
import Link from 'next/link'
import { TvShow, WatchStatus } from '@prisma/client'
import { Clock, CheckCircle, XCircle, Tv, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface TvCardProps {
  tvShow: TvShow
}

export function TvCard({ tvShow }: TvCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const getStatusIcon = (status: WatchStatus) => {
    switch (status) {
      case WatchStatus.WATCHING:
        return <Clock className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
      case WatchStatus.WATCHED:
        return <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
      case WatchStatus.DROPPED:
        return <XCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
      default:
        return null
    }
  }

  const getStatusStyle = (status: WatchStatus) => {
    switch (status) {
      case WatchStatus.WATCHING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-700'
      case WatchStatus.WATCHED:
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700'
      case WatchStatus.DROPPED:
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600'
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    setIsLoading(true)
  }

  return (
    <Link href={`/tv/${tvShow.id}`} onClick={handleClick}>
      <div className="group cursor-pointer overflow-hidden bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl rounded-lg relative">
        {isLoading && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
              <span className="text-white text-sm">加载中...</span>
            </div>
          </div>
        )}
        <div className="aspect-[2/3] relative">
          {(tvShow as any).posterUrl || tvShow.posterPath ? (
            <Image
              src={(tvShow as any).posterUrl || `https://image.tmdb.org/t/p/w500${tvShow.posterPath}`}
              alt={tvShow.name}
              fill
              className="object-cover rounded-lg"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center rounded-lg">
              <Tv className="h-8 w-8 text-slate-500" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent rounded-lg" />
          
          {/* Douban Rating - Top Left */}
          {tvShow.doubanRating && (
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
              <Image
                src="/douban.svg"
                alt="豆瓣"
                width={20}
                height={20}
                className="opacity-90"
              />
              <span className="text-white text-base font-medium">
                {Number(tvShow.doubanRating).toFixed(1)}
              </span>
            </div>
          )}
          
          {/* Watch Status - Bottom Right */}
          <div className="absolute bottom-4 right-4">
            <div 
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusStyle(tvShow.watchStatus)}`}
            >
              {getStatusIcon(tvShow.watchStatus)}
              {tvShow.watchStatus === WatchStatus.UNWATCHED ? '未观看' : 
               tvShow.watchStatus === WatchStatus.WATCHING ? '观看中' :
               tvShow.watchStatus === WatchStatus.WATCHED ? '已观看' : '弃剧'}
            </div>
          </div>
          
          {/* Title and Details - Bottom Left */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="text-white font-medium text-base line-clamp-2 mb-1">
              {tvShow.name}
            </h3>
            <div className="flex items-center gap-2 text-slate-300 text-xs">
              {tvShow.firstAirDate && (
                <span>{new Date(tvShow.firstAirDate).getFullYear()}</span>
              )}
              {tvShow.numberOfSeasons && (
                <span>• {tvShow.numberOfSeasons} 季</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}