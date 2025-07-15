import { Suspense } from 'react'
import SearchPageClient from '@/components/SearchPageClient'
import { generateSEO } from '@/lib/seo'

export async function generateMetadata({ searchParams }: { searchParams: { q?: string, actor?: string } }) {
  const query = searchParams.q
  const actorId = searchParams.actor
  
  if (actorId) {
    return generateSEO({
      title: '演员作品搜索 - 剧海拾遗',
      description: '查看演员的所有参演作品，包括电影和电视剧。'
    })
  }
  
  if (query) {
    return generateSEO({
      title: `搜索 "${query}" - 剧海拾遗`,
      description: `搜索包含 "${query}" 的电影和电视剧作品。`,
      keywords: ['搜索', query, '电影搜索', '电视剧搜索']
    })
  }
  
  return generateSEO({
    title: '搜索 - 剧海拾遗',
    description: '搜索您喜爱的电影、电视剧和演员作品。'
  })
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-slate-600 dark:text-slate-400 mt-4">加载中...</p>
        </div>
      </div>
    }>
      <SearchPageClient />
    </Suspense>
  )
}