/**
 * TMDB Service for fetching movie and TV show data
 * Uses backend proxy to keep API keys secure
 */

import { proxyApi } from '../api/client';

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
  private profileId: string;

  constructor(profileId: string) {
    this.profileId = profileId;
  }

  /**
   * Search for a movie by title
   */
  async searchMovie(query: string): Promise<TmdbMovie[]> {
    const data = await proxyApi.tmdb.search(this.profileId, query, 'movie');
    // Filter results to only include those with required title
    return (data.results || [])
      .filter((r) => r.title)
      .map((r) => ({
        ...r,
        title: r.title as string,
        release_date: r.release_date || '',
      }));
  }

  /**
   * Search for a TV show by title
   */
  async searchTV(query: string): Promise<TmdbTVShow[]> {
    const data = await proxyApi.tmdb.search(this.profileId, query, 'tv');
    // Filter results to only include those with required name
    return (data.results || [])
      .filter((r) => r.name)
      .map((r) => ({
        ...r,
        name: r.name as string,
        first_air_date: r.first_air_date || '',
      }));
  }

  /**
   * Get movie details by TMDB ID
   */
  async getMovie(movieId: number): Promise<TmdbMovie> {
    const data = await proxyApi.tmdb.get(this.profileId, 'movie', movieId);
    return {
      ...data,
      title: 'title' in data && data.title ? data.title : '',
      release_date: 'release_date' in data && data.release_date ? data.release_date : '',
    } as TmdbMovie;
  }

  /**
   * Get TV show details by TMDB ID
   */
  async getTVShow(tvId: number): Promise<TmdbTVShow> {
    const data = await proxyApi.tmdb.get(this.profileId, 'tv', tvId);
    return {
      ...data,
      name: 'name' in data && data.name ? data.name : '',
      first_air_date: 'first_air_date' in data && data.first_air_date ? data.first_air_date : '',
    } as TmdbTVShow;
  }

  /**
   * Get season details for a TV show
   */
  async getSeason(
    tvId: number,
    seasonNumber: number
  ): Promise<TmdbSeason & { episodes: TmdbEpisode[] }> {
    const data = await proxyApi.tmdb.getSeason(this.profileId, tvId, seasonNumber);
    return {
      id: data.id,
      season_number: data.season_number,
      name: data.name,
      poster_path: data.poster_path,
      overview: data.overview,
      air_date: '',
      episode_count: data.episodes?.length ?? 0,
      episodes: (data.episodes || []).map((ep) => ({
        ...ep,
        season_number: data.season_number,
        vote_average: 0,
      })),
    };
  }

  /**
   * Get episode details
   */
  async getEpisode(
    tvId: number,
    seasonNumber: number,
    episodeNumber: number
  ): Promise<TmdbEpisode> {
    const data = await proxyApi.tmdb.getEpisode(this.profileId, tvId, seasonNumber, episodeNumber);
    return {
      ...data,
      air_date: data.air_date || '',
    };
  }

  /**
   * Find movie by IMDb ID
   */
  async findByImdbId(imdbId: string): Promise<TmdbMovie | null> {
    const data = await proxyApi.tmdb.find(this.profileId, imdbId, 'imdb_id');
    const movie = data.movie_results?.[0];
    const tv = data.tv_results?.[0];
    if (movie) {
      return {
        ...movie,
        title: movie.title || '',
        release_date: movie.release_date || '',
      };
    }
    if (tv) {
      return {
        ...tv,
        title: tv.name || '',
        release_date: tv.first_air_date || '',
      } as TmdbMovie;
    }
    return null;
  }

  /**
   * Get detailed movie information including external IDs and ratings
   */
  async getMovieDetails(
    movieId: number
  ): Promise<TmdbMovie & { external_ids?: { imdb_id?: string } }> {
    // For now, just return basic movie details
    // Full external_ids support would require a new proxy endpoint
    return this.getMovie(movieId);
  }

  /**
   * Get detailed TV show information including external IDs and ratings
   */
  async getTVShowDetails(
    tvId: number
  ): Promise<TmdbTVShow & { external_ids?: { imdb_id?: string } }> {
    // For now, just return basic TV details
    // Full external_ids support would require a new proxy endpoint
    return this.getTVShow(tvId);
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

      return ratings;
    } catch (error) {
      console.error('Failed to get TV show ratings:', error);
      return { tmdb: 0 };
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
