import TvDetailPage from '@/components/TvDetailPage'
import { generateSEO } from '@/lib/seo'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  return generateSEO({
    title: `电视剧详情 - 剧海拾遗`,
    description: '查看电视剧详细信息、演员阵容、观看评价等。'
  })
}

export default function TvPage() {
  return <TvDetailPage />
}