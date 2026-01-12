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
  imdb_id?: string;
}

export interface TmdbRatings {
  tmdb: number; // 0-10 scale
  imdb?: number; // 0-10 scale
  rottenTomatoes?: {
    critics?: number; // 0-100 scale (Tomatometer)
    audience?: number; // 0-100 scale (Audience Score)
  };
}

export interface TmdbTVShow {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  first_air_date: string;
  vote_average: number;
  number_of_seasons?: number;
  seasons?: TmdbSeason[];
  status?: string; // "Ended", "Canceled", "Returning Series", etc.
}

export interface TmdbSeason {
  id: number;
  season_number: number;
  name: string;
  poster_path: string | null;
  overview: string;
  air_date: string;
  episode_count: number;
}

export interface TmdbEpisode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  still_path: string | null;
  overview: string;
  air_date: string;
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
   * Get season details for a TV show
   */
  async getSeason(
    tvId: number,
    seasonNumber: number
  ): Promise<TmdbSeason & { episodes: TmdbEpisode[] }> {
    const url = `${TMDB_BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${this.apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.status_message || response.statusText;
      throw new Error(`TMDB API error: ${errorMessage}`);
    }

    return response.json();
  }

  /**
   * Get episode details
   */
  async getEpisode(
    tvId: number,
    seasonNumber: number,
    episodeNumber: number
  ): Promise<TmdbEpisode> {
    const url = `${TMDB_BASE_URL}/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}?api_key=${this.apiKey}`;
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
   * Get detailed movie information including external IDs and ratings
   */
  async getMovieDetails(
    movieId: number
  ): Promise<TmdbMovie & { external_ids?: { imdb_id?: string } }> {
    const url = `${TMDB_BASE_URL}/movie/${movieId}?api_key=${this.apiKey}&append_to_response=external_ids`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.status_message || response.statusText;
      throw new Error(`TMDB API error: ${errorMessage}`);
    }

    return response.json();
  }

  /**
   * Get detailed TV show information including external IDs and ratings
   */
  async getTVShowDetails(
    tvId: number
  ): Promise<TmdbTVShow & { external_ids?: { imdb_id?: string } }> {
    const url = `${TMDB_BASE_URL}/tv/${tvId}?api_key=${this.apiKey}&append_to_response=external_ids`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.status_message || response.statusText;
      throw new Error(`TMDB API error: ${errorMessage}`);
    }

    return response.json();
  }

  /**
   * Get ratings for a movie
   */
  async getMovieRatings(movieId: number): Promise<TmdbRatings> {
    try {
      const details = await this.getMovieDetails(movieId);

      const ratings: TmdbRatings = {
        tmdb: details.vote_average || 0,
      };

      // Get IMDb rating if we have an IMDb ID
      if (details.external_ids?.imdb_id) {
        ratings.imdb = await this.getImdbRating(details.external_ids.imdb_id);
      }

      return ratings;
    } catch (error) {
      console.error('Failed to get movie ratings:', error);
      return { tmdb: 0 };
    }
  }

  /**
   * Get ratings for a TV show
   */
  async getTVShowRatings(tvId: number): Promise<TmdbRatings> {
    try {
      const details = await this.getTVShowDetails(tvId);

      const ratings: TmdbRatings = {
        tmdb: details.vote_average || 0,
      };

      // Get IMDb rating if we have an IMDb ID
      if (details.external_ids?.imdb_id) {
        console.log(`🔍 Found IMDb ID for TV show ${tvId}:`, details.external_ids.imdb_id);
        ratings.imdb = await this.getImdbRating(details.external_ids.imdb_id);
        if (ratings.imdb) {
          console.log(`  ✅ Fetched IMDb rating: ${ratings.imdb}`);
        } else {
          console.log(`  ⚠️ Could not fetch IMDb rating for ${details.external_ids.imdb_id}`);
        }
      } else {
        console.log(`  ℹ️ No IMDb ID found for TV show ${tvId}`);
      }

      return ratings;
    } catch (error) {
      console.error('Failed to get TV show ratings:', error);
      return { tmdb: 0 };
    }
  }

  /**
   * Fetch IMDb rating using OMDb API
   * Note: This requires an OMDb API key. For now, we simulate/fallback.
   * In production, use OMDb API: http://www.omdbapi.com/?i=tt0944947&apikey=YOUR_KEY
   */
  private async getImdbRating(imdbId: string): Promise<number | undefined> {
    try {
      // Try to use OMDb API if available (requires API key)
      // For now, we'll use a free tier or return undefined

      // Option 1: Use OMDb API (requires key from environment)
      const omdbKey = import.meta.env?.VITE_OMDB_API_KEY;
      if (omdbKey) {
        const url = `https://www.omdbapi.com/?i=${imdbId}&apikey=${omdbKey}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data.imdbRating && data.imdbRating !== 'N/A') {
            return parseFloat(data.imdbRating);
          }
        }
      }

      // Option 2: Generate simulated rating based on TMDB rating for demo
      // In production, this should be removed or replaced with actual API call
      console.log('  ℹ️ No OMDb API key available, IMDb rating unavailable');
      return undefined;
    } catch (error) {
      console.error('Failed to fetch IMDb rating:', error);
      return undefined;
    }
  }

  /**
   * Get poster URL for a given poster path and size
   * @param posterPath - The poster path from TMDB API (e.g., "/8uO0gUM8aNqYLs1OsTBQiXu0fEv.jpg")
   * @param size - Size: "w92", "w154", "w185", "w342", "w500", "w780", "original"
   */
  getPosterUrl(
    posterPath: string | null,
    size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'
  ): string | null {
    if (!posterPath) return null;
    return `${TMDB_IMAGE_BASE_URL}/${size}${posterPath}`;
  }

  /**
   * Get backdrop URL for a given backdrop path and size
   * @param backdropPath - The backdrop path from TMDB API
   * @param size - Size: "w300", "w780", "w1280", "original"
   */
  getBackdropUrl(
    backdropPath: string | null,
    size: 'w300' | 'w780' | 'w1280' | 'original' = 'w1280'
  ): string | null {
    if (!backdropPath) return null;
    return `${TMDB_IMAGE_BASE_URL}/${size}${backdropPath}`;
  }

  /**
   * Get episode still (thumbnail) URL
   * @param stillPath - The still path from TMDB API
   * @param size - Size: "w92", "w185", "w300", "original"
   */
  getStillUrl(
    stillPath: string | null,
    size: 'w92' | 'w185' | 'w300' | 'original' = 'w300'
  ): string | null {
    if (!stillPath) return null;
    return `${TMDB_IMAGE_BASE_URL}/${size}${stillPath}`;
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
