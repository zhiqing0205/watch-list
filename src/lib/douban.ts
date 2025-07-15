// Note: Douban API access may be limited. This is a basic implementation
// that could be extended with web scraping or other methods.

interface DoubanMovie {
  id: string
  title: string
  original_title: string
  year: string
  rating: {
    average: number
    stars: string
    details: {
      1: number
      2: number
      3: number
      4: number
      5: number
    }
  }
  genres: string[]
  countries: string[]
  directors: Array<{ name: string }>
  casts: Array<{ name: string }>
  summary: string
  images: {
    small: string
    large: string
    medium: string
  }
}

interface DoubanTVShow {
  id: string
  title: string
  original_title: string
  year: string
  rating: {
    average: number
    stars: string
    details: {
      1: number
      2: number
      3: number
      4: number
      5: number
    }
  }
  genres: string[]
  countries: string[]
  directors: Array<{ name: string }>
  casts: Array<{ name: string }>
  summary: string
  images: {
    small: string
    large: string
    medium: string
  }
  episodes_count: number
  seasons_count: number
}

class DoubanClient {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.DOUBAN_API_KEY || ''
  }

  async searchMovies(query: string, limit: number = 10): Promise<{ subjects: DoubanMovie[] }> {
    // Note: This is a placeholder implementation
    // In a real scenario, you would either:
    // 1. Use official Douban API (if available)
    // 2. Use web scraping (with proper rate limiting)
    // 3. Use a third-party service that provides Douban data
    
    if (!this.apiKey) {
      throw new Error('Douban API key not configured')
    }

    try {
      const response = await fetch(
        `https://api.douban.com/v2/movie/search?q=${encodeURIComponent(query)}&count=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Douban API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error searching Douban movies:', error)
      throw error
    }
  }

  async searchTVShows(query: string, limit: number = 10): Promise<{ subjects: DoubanTVShow[] }> {
    if (!this.apiKey) {
      throw new Error('Douban API key not configured')
    }

    try {
      const response = await fetch(
        `https://api.douban.com/v2/tv/search?q=${encodeURIComponent(query)}&count=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Douban API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error searching Douban TV shows:', error)
      throw error
    }
  }

  async getMovieDetails(movieId: string): Promise<DoubanMovie> {
    if (!this.apiKey) {
      throw new Error('Douban API key not configured')
    }

    try {
      const response = await fetch(
        `https://api.douban.com/v2/movie/${movieId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Douban API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching Douban movie details:', error)
      throw error
    }
  }

  async getTVShowDetails(tvId: string): Promise<DoubanTVShow> {
    if (!this.apiKey) {
      throw new Error('Douban API key not configured')
    }

    try {
      const response = await fetch(
        `https://api.douban.com/v2/tv/${tvId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Douban API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching Douban TV show details:', error)
      throw error
    }
  }

  // Helper method to find Douban rating by title
  async findRatingByTitle(title: string, type: 'movie' | 'tv'): Promise<number | null> {
    try {
      const results = type === 'movie' 
        ? await this.searchMovies(title, 5)
        : await this.searchTVShows(title, 5)

      // Find the best match based on title similarity
      const bestMatch = results.subjects.find(item => 
        item.title.toLowerCase().includes(title.toLowerCase()) ||
        item.original_title.toLowerCase().includes(title.toLowerCase()) ||
        title.toLowerCase().includes(item.title.toLowerCase())
      )

      return bestMatch ? bestMatch.rating.average : null
    } catch (error) {
      console.error('Error finding Douban rating:', error)
      return null
    }
  }
}

export const doubanClient = new DoubanClient()

// Alternative implementation using web scraping (placeholder)
export async function getDoubanRatingByTitle(title: string, type: 'movie' | 'tv'): Promise<number | null> {
  try {
    // This is a placeholder for web scraping implementation
    // In production, you would implement proper web scraping with:
    // - Rate limiting
    // - Error handling
    // - Proxy rotation (if needed)
    // - Compliance with robots.txt
    
    console.log(`Fetching Douban rating for ${type}: ${title}`)
    
    // For now, return null to indicate rating not found
    return null
  } catch (error) {
    console.error('Error fetching Douban rating:', error)
    return null
  }
}

// Helper function to update existing content with Douban ratings
export async function updateDoubanRating(contentId: string, contentType: 'movie' | 'tv', title: string) {
  try {
    const rating = await getDoubanRatingByTitle(title, contentType)
    
    if (rating) {
      const { prisma } = await import('@/lib/prisma')
      
      if (contentType === 'movie') {
        await prisma.movie.update({
          where: { id: contentId },
          data: { doubanRating: rating }
        })
      } else {
        await prisma.tvShow.update({
          where: { id: contentId },
          data: { doubanRating: rating }
        })
      }
    }
    
    return rating
  } catch (error) {
    console.error('Error updating Douban rating:', error)
    return null
  }
}