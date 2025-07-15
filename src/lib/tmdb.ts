const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_API_KEY = process.env.TMDB_API_KEY

if (!TMDB_API_KEY) {
  throw new Error('TMDB_API_KEY environment variable is not set')
}

export interface TMDbMovie {
  id: number
  title: string
  original_title: string
  overview: string
  release_date: string
  runtime: number
  genre_ids: number[]
  genres: { id: number; name: string }[]
  poster_path: string
  backdrop_path: string
  imdb_id: string
  vote_average: number
  vote_count: number
}

export interface TMDbTVShow {
  id: number
  name: string
  original_name: string
  overview: string
  first_air_date: string
  last_air_date: string
  number_of_seasons: number
  number_of_episodes: number
  genre_ids: number[]
  genres: { id: number; name: string }[]
  poster_path: string
  backdrop_path: string
  vote_average: number
  vote_count: number
}

export interface TMDbPerson {
  id: number
  name: string
  original_name: string
  biography: string
  birthday: string
  deathday: string
  gender: number
  profile_path: string
}

export interface TMDbCredits {
  cast: {
    id: number
    name: string
    character: string
    order: number
    profile_path: string
  }[]
  crew: {
    id: number
    name: string
    job: string
    department: string
    profile_path: string
  }[]
}

class TMDbClient {
  private async request(endpoint: string, params: Record<string, any> = {}) {
    const searchParams = new URLSearchParams({
      api_key: TMDB_API_KEY,
      language: 'zh-CN',
      ...params,
    })

    const url = `${TMDB_BASE_URL}${endpoint}?${searchParams}`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`TMDb API error: ${response.status} ${response.statusText}`)
    }
    
    return response.json()
  }

  async searchMovies(query: string, page: number = 1) {
    return this.request('/search/movie', { query, page })
  }

  async searchTVShows(query: string, page: number = 1) {
    return this.request('/search/tv', { query, page })
  }

  async getMovieDetails(movieId: number): Promise<TMDbMovie> {
    return this.request(`/movie/${movieId}`)
  }

  async getTVShowDetails(tvId: number): Promise<TMDbTVShow> {
    return this.request(`/tv/${tvId}`)
  }

  async getMovieCredits(movieId: number): Promise<TMDbCredits> {
    return this.request(`/movie/${movieId}/credits`)
  }

  async getTVShowCredits(tvId: number): Promise<TMDbCredits> {
    return this.request(`/tv/${tvId}/credits`)
  }

  async getPersonDetails(personId: number): Promise<TMDbPerson> {
    return this.request(`/person/${personId}`)
  }

  async discoverMovies(params: Record<string, any> = {}) {
    return this.request('/discover/movie', params)
  }

  async discoverTVShows(params: Record<string, any> = {}) {
    return this.request('/discover/tv', params)
  }

  async getGenres(type: 'movie' | 'tv') {
    return this.request(`/genre/${type}/list`)
  }
}

export const tmdbClient = new TMDbClient()