/**
 * TMDB Service for fetching movie and TV show data
 */

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export interface TmdbMovie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
}

export interface TmdbTVShow {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  first_air_date: string;
  vote_average: number;
}

export class TmdbService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Search for a movie by title
   */
  async searchMovie(query: string): Promise<TmdbMovie[]> {
    const url = `${TMDB_BASE_URL}/search/movie?api_key=${this.apiKey}&query=${encodeURIComponent(query)}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.status_message || response.statusText;
      throw new Error(`TMDB API error: ${errorMessage}`);
    }

    const data = await response.json();
    return data.results || [];
  }

  /**
   * Search for a TV show by title
   */
  async searchTV(query: string): Promise<TmdbTVShow[]> {
    const url = `${TMDB_BASE_URL}/search/tv?api_key=${this.apiKey}&query=${encodeURIComponent(query)}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.status_message || response.statusText;
      throw new Error(`TMDB API error: ${errorMessage}`);
    }

    const data = await response.json();
    return data.results || [];
  }

  /**
   * Get movie details by TMDB ID
   */
  async getMovie(movieId: number): Promise<TmdbMovie> {
    const url = `${TMDB_BASE_URL}/movie/${movieId}?api_key=${this.apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.status_message || response.statusText;
      throw new Error(`TMDB API error: ${errorMessage}`);
    }

    return response.json();
  }

  /**
   * Get TV show details by TMDB ID
   */
  async getTVShow(tvId: number): Promise<TmdbTVShow> {
    const url = `${TMDB_BASE_URL}/tv/${tvId}?api_key=${this.apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.status_message || response.statusText;
      throw new Error(`TMDB API error: ${errorMessage}`);
    }

    return response.json();
  }

  /**
   * Find movie by IMDb ID
   */
  async findByImdbId(imdbId: string): Promise<TmdbMovie | null> {
    const url = `${TMDB_BASE_URL}/find/${imdbId}?api_key=${this.apiKey}&external_source=imdb_id`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.statusText}`);
    }

    const data = await response.json();
    const movie = data.movie_results?.[0];
    const tv = data.tv_results?.[0];

    return movie || tv || null;
  }

  /**
   * Get poster URL for a given poster path and size
   * @param posterPath - The poster path from TMDB API (e.g., "/8uO0gUM8aNqYLs1OsTBQiXu0fEv.jpg")
   * @param size - Size: "w92", "w154", "w185", "w342", "w500", "w780", "original"
   */
  getPosterUrl(posterPath: string | null, size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'): string | null {
    if (!posterPath) return null;
    return `${TMDB_IMAGE_BASE_URL}/${size}${posterPath}`;
  }

  /**
   * Get backdrop URL for a given backdrop path and size
   * @param backdropPath - The backdrop path from TMDB API
   * @param size - Size: "w300", "w780", "w1280", "original"
   */
  getBackdropUrl(backdropPath: string | null, size: 'w300' | 'w780' | 'w1280' | 'original' = 'w1280'): string | null {
    if (!backdropPath) return null;
    return `${TMDB_IMAGE_BASE_URL}/${size}${backdropPath}`;
  }
}

/**
 * Default titles for preview
 */
export const DEFAULT_PREVIEW_TITLES = {
  movie: {
    id: 603, // The Matrix
    title: 'The Matrix',
  },
  tv: {
    id: 1396, // Breaking Bad
    title: 'Breaking Bad',
  },
};
