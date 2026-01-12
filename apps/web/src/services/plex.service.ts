/**
 * Service for fetching media information from Plex Media Server
 */

export interface PlexMediaInfo {
  title: string;
  year?: number;
  resolution?: string; // e.g., "1080p", "4K"
  videoCodec?: string; // e.g., "h264", "hevc"
  audioCodec?: string; // e.g., "aac", "dts", "truehd"
  audioChannels?: string; // e.g., "5.1", "7.1", "Atmos"
  duration?: number;
  rating?: number; // Plex rating (typically used for critic/IMDb rating by Kometa)
  audienceRating?: number; // Audience rating (typically TMDB or RT audience)
  criticRating?: number; // Critic rating (typically RT critic or IMDb)
  ratings?: {
    imdb?: number;
    tmdb?: number;
    rottenTomatoes?: number;
  };
  file?: {
    size?: number;
    container?: string; // e.g., "mkv", "mp4"
    bitrate?: number;
  };
}

export interface PlexConnectionConfig {
  url: string;
  token: string;
}

export class PlexService {
  private url: string;
  private token: string;

  constructor(config: PlexConnectionConfig) {
    this.url = config.url.replace(/\/$/, ''); // Remove trailing slash
    this.token = config.token;
  }

  /**
   * Search for a movie in Plex library by title
   */
  async searchMovie(title: string, year?: number): Promise<PlexMediaInfo | null> {
    try {
      const searchUrl = `${this.url}/search?query=${encodeURIComponent(title)}&type=1`;
      const response = await fetch(searchUrl, {
        headers: {
          'X-Plex-Token': this.token,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Plex API error: ${response.statusText}`);
      }

      const data = await response.json();
      const results = data.MediaContainer?.Metadata || [];

      // Find best match
      let bestMatch = results[0];
      if (year) {
        bestMatch = results.find((item: any) => item.year === year) || results[0];
      }

      if (!bestMatch) {
        return null;
      }

      return this.extractMediaInfo(bestMatch);
    } catch (error) {
      console.error('Failed to search Plex:', error);
      return null;
    }
  }

  /**
   * Search for a TV show in Plex library
   */
  async searchTVShow(title: string): Promise<PlexMediaInfo | null> {
    try {
      const searchUrl = `${this.url}/search?query=${encodeURIComponent(title)}&type=2`;
      const response = await fetch(searchUrl, {
        headers: {
          'X-Plex-Token': this.token,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Plex API error: ${response.statusText}`);
      }

      const data = await response.json();
      const results = data.MediaContainer?.Metadata || [];

      if (results.length === 0) {
        return null;
      }

      return this.extractMediaInfo(results[0]);
    } catch (error) {
      console.error('Failed to search Plex TV show:', error);
      return null;
    }
  }

  /**
   * Get episode information
   */
  async getEpisode(
    showKey: string,
    seasonNumber: number,
    episodeNumber: number
  ): Promise<PlexMediaInfo | null> {
    try {
      // First get the season
      const seasonUrl = `${this.url}${showKey}/children`;
      const seasonResponse = await fetch(seasonUrl, {
        headers: {
          'X-Plex-Token': this.token,
          Accept: 'application/json',
        },
      });

      if (!seasonResponse.ok) {
        return null;
      }

      const seasonData = await seasonResponse.json();
      const seasons = seasonData.MediaContainer?.Metadata || [];
      const season = seasons.find((s: any) => s.index === seasonNumber);

      if (!season) {
        return null;
      }

      // Then get episodes in that season
      const episodeUrl = `${this.url}${season.key}`;
      const episodeResponse = await fetch(episodeUrl, {
        headers: {
          'X-Plex-Token': this.token,
          Accept: 'application/json',
        },
      });

      if (!episodeResponse.ok) {
        return null;
      }

      const episodeData = await episodeResponse.json();
      const episodes = episodeData.MediaContainer?.Metadata || [];
      const episode = episodes.find((e: any) => e.index === episodeNumber);

      if (!episode) {
        return null;
      }

      return this.extractMediaInfo(episode);
    } catch (error) {
      console.error('Failed to get Plex episode:', error);
      return null;
    }
  }

  /**
   * Extract media information from Plex metadata
   */
  private extractMediaInfo(metadata: any): PlexMediaInfo {
    console.log('🔍 Extracting Plex media info for:', metadata.title);
    console.log('  Raw Plex ratings:', {
      rating: metadata.rating,
      audienceRating: metadata.audienceRating,
      Ratings: metadata.Rating,
    });

    const info: PlexMediaInfo = {
      title: metadata.title,
      year: metadata.year,
      rating: metadata.rating,
      audienceRating: metadata.audienceRating,
      criticRating: metadata.rating, // Plex uses 'rating' for critic score
      duration: metadata.duration,
    };

    // Extract ratings from Plex's Rating array
    // Kometa's mass_*_rating_update operations populate these fields
    // The Rating array contains detailed rating information with source identifiers
    if (metadata.Rating && Array.isArray(metadata.Rating)) {
      info.ratings = {
        imdb: undefined,
        tmdb: undefined,
        rottenTomatoes: undefined,
      };

      console.log('  Processing Rating array:', metadata.Rating.length, 'entries');

      for (const ratingEntry of metadata.Rating) {
        console.log('    Rating entry:', {
          type: ratingEntry.type,
          value: ratingEntry.value,
          image: ratingEntry.image,
        });

        // Check the image/type to determine the source
        // Plex uses different identifiers based on the rating source
        if (ratingEntry.image?.includes('imdb') || ratingEntry.type === 'audience') {
          // In Kometa configs, critic rating is often set to IMDb via mass_critic_rating_update: imdb
          // This populates the 'rating' field with IMDb rating
          info.ratings.imdb = parseFloat(ratingEntry.value);
          console.log('    ✅ Found IMDb rating:', info.ratings.imdb);
        } else if (
          ratingEntry.image?.includes('themoviedb') ||
          ratingEntry.image?.includes('tmdb')
        ) {
          info.ratings.tmdb = parseFloat(ratingEntry.value);
          console.log('    ✅ Found TMDB rating:', info.ratings.tmdb);
        } else if (ratingEntry.image?.includes('rottentomatoes')) {
          info.ratings.rottenTomatoes = parseFloat(ratingEntry.value);
          console.log('    ✅ Found RT rating:', info.ratings.rottenTomatoes);
        }
      }
    }

    // Fallback: If Rating array doesn't have IMDb, check if 'rating' field contains IMDb
    // Kometa's mass_critic_rating_update: imdb puts the IMDb rating in the main 'rating' field
    if (!info.ratings?.imdb && metadata.rating) {
      // If we know the critic rating is IMDb (based on user's Kometa config), use it
      console.log('  ℹ️ Using main rating field as potential IMDb rating:', metadata.rating);
      if (!info.ratings) info.ratings = {};
      info.ratings.imdb = metadata.rating;
    }

    console.log('  Final extracted ratings:', info.ratings);

    // Extract media details from the first Media object
    const media = metadata.Media?.[0];
    if (media) {
      // Resolution
      const height = media.height;
      if (height >= 2160) {
        info.resolution = '4K';
      } else if (height >= 1080) {
        info.resolution = '1080p';
      } else if (height >= 720) {
        info.resolution = '720p';
      } else if (height >= 480) {
        info.resolution = '480p';
      }

      // Video codec
      info.videoCodec = media.videoCodec?.toUpperCase();

      // Container
      info.file = {
        container: media.container?.toUpperCase(),
        bitrate: media.bitrate,
        size: media.Part?.[0]?.size,
      };

      // Audio information from first audio stream
      const audioStream = media.Part?.[0]?.Stream?.find((s: any) => s.streamType === 2);
      if (audioStream) {
        info.audioCodec = this.formatAudioCodec(audioStream.codec);
        info.audioChannels = this.formatAudioChannels(audioStream.channels);
      }
    }

    return info;
  }

  /**
   * Format audio codec for display
   */
  private formatAudioCodec(codec?: string): string | undefined {
    if (!codec) return undefined;

    const codecMap: Record<string, string> = {
      aac: 'AAC',
      ac3: 'Dolby Digital',
      eac3: 'Dolby Digital Plus',
      truehd: 'Dolby TrueHD',
      dts: 'DTS',
      dca: 'DTS',
      dtshd: 'DTS-HD',
      flac: 'FLAC',
      mp3: 'MP3',
      opus: 'Opus',
      vorbis: 'Vorbis',
    };

    return codecMap[codec.toLowerCase()] || codec.toUpperCase();
  }

  /**
   * Format audio channels for display
   */
  private formatAudioChannels(channels?: number): string | undefined {
    if (!channels) return undefined;

    const channelMap: Record<number, string> = {
      1: 'Mono',
      2: 'Stereo',
      6: '5.1',
      8: '7.1',
    };

    return channelMap[channels] || `${channels}ch`;
  }

  /**
   * Test connection to Plex server
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.url}/`, {
        headers: {
          'X-Plex-Token': this.token,
          Accept: 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }
}
