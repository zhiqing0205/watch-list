import { Metadata } from 'next'

interface SEOConfig {
  title: string
  description: string
  keywords?: string[]
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
}

export function generateSEO(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    ogTitle = title,
    ogDescription = description,
    ogImage = '/og-image.jpg'
  } = config

  const defaultKeywords = [
    '影视收藏',
    '电影追踪',
    '电视剧管理',
    '观看记录',
    '影视推荐',
    '豆瓣评分',
    'TMDB',
    '影视数据库'
  ]

  return {
    title,
    description,
    keywords: [...defaultKeywords, ...keywords].join(', '),
    authors: [{ name: '影视收藏系统' }],
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
      type: 'website',
      locale: 'zh_CN',
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      // 可以添加各种验证代码
      // google: 'google-site-verification-code',
      // yandex: 'yandex-verification-code',
    },
  }
}

// 预定义的SEO配置
export const seoConfigs = {
  home: {
    title: '剧海拾遗 - 专业的影视追踪和管理平台',
    description: '专业的影视收藏和追踪平台，整合豆瓣和TMDB数据，帮您管理观看记录，发现优质影视内容。支持电影、电视剧分类管理，个性化推荐系统。',
    keywords: ['首页', '影视首页', '电影推荐', '电视剧推荐']
  },
  
  movie: (title: string, year?: number) => ({
    title: `${title}${year ? ` (${year})` : ''} - 电影详情 | 剧海拾遗`,
    description: `查看电影《${title}》的详细信息，包括剧情简介、演员阵容、豆瓣评分、观看状态等。记录您的观影感受，发现更多精彩电影。`,
    keywords: ['电影', title, '电影详情', '影评', '剧情'],
    ogTitle: `${title}${year ? ` (${year})` : ''} - 电影详情`,
  }),
  
  tvShow: (title: string, year?: number) => ({
    title: `${title}${year ? ` (${year})` : ''} - 电视剧详情 | 剧海拾遗`,
    description: `查看电视剧《${title}》的详细信息，包括剧情简介、演员阵容、豆瓣评分、集数信息等。追踪您的观剧进度，分享观剧心得。`,
    keywords: ['电视剧', title, '剧集详情', '追剧', '电视剧评价'],
    ogTitle: `${title}${year ? ` (${year})` : ''} - 电视剧详情`,
  }),

  movies: {
    title: '电影收藏 - 剧海拾遗',
    description: '浏览和管理您收藏的所有电影，按类型、评分、观看状态筛选，发现新的电影作品。支持个性化推荐和详细的影片信息。',
    keywords: ['电影列表', '电影收藏', '电影分类', '电影筛选']
  },

  tvShows: {
    title: '电视剧收藏 - 剧海拾遗', 
    description: '管理您追看的电视剧，记录观看进度，查看剧集信息。支持按状态分类：正在观看、已完成、暂停追剧等。',
    keywords: ['电视剧列表', '追剧记录', '电视剧管理', '剧集进度']
  }
}