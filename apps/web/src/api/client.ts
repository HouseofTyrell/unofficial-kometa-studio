import type {
  KometaConfig,
  Profile,
  ProfileSecrets,
  CreateConfigInput,
  UpdateConfigInput,
  CreateProfileInput,
  UpdateProfileInput,
} from '@kometa-studio/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';

// API Entity Types (entities stored in database with metadata)
export interface ConfigEntity {
  id: string;
  name: string;
  description?: string;
  config: KometaConfig;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileEntity {
  id: string;
  name: string;
  description?: string;
  secrets: ProfileSecrets;
  createdAt: string;
  updatedAt: string;
}

// Overlay file entry from config
export interface OverlayFileEntry {
  libraryName: string;
  file: {
    default?: string;
    template_variables?: Record<string, unknown>;
    [key: string]: unknown;
  };
  index: number;
  overlayType?: string;
  overlayPath?: string;
  level?: string;
  customFilePath?: string;
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    path: string;
    message: string;
  }>;
  warnings: Array<{
    path: string;
    message: string;
  }>;
}

// TMDB Types
export interface TmdbSearchResult {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  media_type?: string;
}

export interface TmdbMovieDetails extends TmdbSearchResult {
  runtime: number;
  genres: Array<{ id: number; name: string }>;
  imdb_id?: string;
  status: string;
}

export interface TmdbTVDetails extends TmdbSearchResult {
  number_of_seasons: number;
  number_of_episodes: number;
  genres: Array<{ id: number; name: string }>;
  status: string;
  seasons: Array<{
    id: number;
    season_number: number;
    episode_count: number;
    name: string;
    poster_path: string | null;
  }>;
}

export interface TmdbSeasonDetails {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  poster_path: string | null;
  episodes: Array<{
    id: number;
    episode_number: number;
    name: string;
    overview: string;
    still_path: string | null;
    air_date: string;
  }>;
}

export interface TmdbEpisodeDetails {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string;
  vote_average: number;
}

export interface TmdbFindResult {
  movie_results: TmdbSearchResult[];
  tv_results: TmdbSearchResult[];
}

// Plex Types - Raw Plex API response structure
export interface PlexMetadata {
  ratingKey: string;
  key: string;
  title: string;
  type: string;
  year?: number;
  index?: number;
  parentIndex?: number;
  thumb?: string;
  art?: string;
  rating?: number;
  audienceRating?: number;
  duration?: number;
  Media?: PlexMedia[];
  Rating?: PlexRating[];
  [key: string]: unknown;
}

export interface PlexMedia {
  height?: number;
  width?: number;
  videoCodec?: string;
  container?: string;
  bitrate?: number;
  Part?: PlexPart[];
}

export interface PlexPart {
  size?: number;
  Stream?: PlexStream[];
}

export interface PlexStream {
  streamType: number;
  codec?: string;
  channels?: number;
}

export interface PlexRating {
  image?: string;
  type?: string;
  value: string;
}

export interface PlexMediaContainer {
  MediaContainer?: {
    Metadata?: PlexMetadata[];
  };
}

// API Error
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      (errorData as { error?: string }).error || 'Request failed',
      response.status,
      (errorData as { details?: unknown }).details
    );
  }

  return response.json() as Promise<T>;
}

// Health
export const healthApi = {
  check: () => request<{ status: string; timestamp: string }>('/api/health'),
};

// Configs
export const configApi = {
  list: () => request<{ configs: ConfigEntity[] }>('/api/configs'),

  get: (id: string) => request<ConfigEntity>(`/api/configs/${id}`),

  create: (data: CreateConfigInput) =>
    request<ConfigEntity>('/api/configs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateConfigInput) =>
    request<ConfigEntity>(`/api/configs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ success: boolean }>(`/api/configs/${id}`, {
      method: 'DELETE',
    }),

  importYaml: (id: string, yaml: string, preserveExtras = true) =>
    request<ConfigEntity>(`/api/configs/${id}/import-yaml`, {
      method: 'POST',
      body: JSON.stringify({ yaml, preserveExtras }),
    }),

  renderYaml: (id: string, profileId?: string, mode = 'masked', includeComment = true) =>
    request<{ yaml: string }>(`/api/configs/${id}/render-yaml`, {
      method: 'POST',
      body: JSON.stringify({ profileId, mode, includeComment }),
    }),

  validate: (id: string, profileId?: string) =>
    request<ValidationResult>(`/api/configs/${id}/validate`, {
      method: 'POST',
      body: JSON.stringify({ profileId }),
    }),

  exportJson: (id: string) =>
    request<ConfigEntity>(`/api/configs/${id}/export-json`, {
      method: 'POST',
    }),

  deleteAll: () =>
    request<{ success: boolean; deletedCount: number }>('/api/configs', {
      method: 'DELETE',
    }),

  getOverlayFiles: (id: string) =>
    request<{ overlayFiles: OverlayFileEntry[] }>(`/api/configs/${id}/overlay-files`),

  getOverlayAssets: (id: string) =>
    request<{ assets: Record<string, string> }>(`/api/configs/${id}/overlay-assets`),
};

// Profiles
export const profileApi = {
  list: () => request<{ profiles: ProfileEntity[] }>('/api/profiles'),

  get: (id: string) => request<ProfileEntity>(`/api/profiles/${id}`),

  create: (data: CreateProfileInput) =>
    request<ProfileEntity>('/api/profiles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateProfileInput) =>
    request<ProfileEntity>(`/api/profiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ success: boolean }>(`/api/profiles/${id}`, {
      method: 'DELETE',
    }),

  export: (id: string, includeSecrets = false) =>
    request<Profile>(`/api/profiles/${id}/export`, {
      method: 'POST',
      body: JSON.stringify({ includeSecrets }),
    }),

  import: (data: { name: string; description?: string; secrets: ProfileSecrets }) =>
    request<ProfileEntity>('/api/profiles/import', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteAll: () =>
    request<{ success: boolean; deletedCount: number }>('/api/profiles', {
      method: 'DELETE',
    }),
};

// Proxy APIs - route external API calls through backend
export const proxyApi = {
  // TMDB
  tmdb: {
    search: (profileId: string, query: string, type: 'movie' | 'tv') =>
      request<{ results: TmdbSearchResult[] }>('/api/proxy/tmdb/search', {
        method: 'POST',
        body: JSON.stringify({ profileId, query, type }),
      }),

    get: (profileId: string, type: 'movie' | 'tv', id: number) =>
      request<TmdbMovieDetails | TmdbTVDetails>('/api/proxy/tmdb/get', {
        method: 'POST',
        body: JSON.stringify({ profileId, type, id }),
      }),

    getSeason: (profileId: string, tvId: number, seasonNumber: number) =>
      request<TmdbSeasonDetails>('/api/proxy/tmdb/season', {
        method: 'POST',
        body: JSON.stringify({ profileId, tvId, seasonNumber }),
      }),

    getEpisode: (profileId: string, tvId: number, seasonNumber: number, episodeNumber: number) =>
      request<TmdbEpisodeDetails>('/api/proxy/tmdb/episode', {
        method: 'POST',
        body: JSON.stringify({ profileId, tvId, seasonNumber, episodeNumber }),
      }),

    find: (profileId: string, externalId: string, externalSource = 'imdb_id') =>
      request<TmdbFindResult>('/api/proxy/tmdb/find', {
        method: 'POST',
        body: JSON.stringify({ profileId, externalId, externalSource }),
      }),
  },

  // Plex - returns raw Plex MediaContainer responses
  plex: {
    search: (profileId: string, query: string, type: 'movie' | 'show') =>
      request<PlexMediaContainer>('/api/proxy/plex/search', {
        method: 'POST',
        body: JSON.stringify({ profileId, query, type }),
      }),

    getSeasons: (profileId: string, showKey: string) =>
      request<PlexMediaContainer>('/api/proxy/plex/seasons', {
        method: 'POST',
        body: JSON.stringify({ profileId, showKey }),
      }),

    getEpisodes: (profileId: string, seasonKey: string) =>
      request<PlexMediaContainer>('/api/proxy/plex/episodes', {
        method: 'POST',
        body: JSON.stringify({ profileId, seasonKey }),
      }),
  },

  // Connection testing
  testConnection: (
    service: 'tmdb' | 'plex' | 'radarr' | 'sonarr' | 'tautulli' | 'mdblist' | 'trakt',
    secrets: Record<string, unknown>
  ) =>
    request<{ success: boolean; message?: string; error?: string; version?: string }>(
      '/api/proxy/test-connection',
      {
        method: 'POST',
        body: JSON.stringify({ service, secrets }),
      }
    ),
};
