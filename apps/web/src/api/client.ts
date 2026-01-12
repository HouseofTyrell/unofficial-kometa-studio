const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
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
    throw new ApiError(errorData.error || 'Request failed', response.status, errorData.details);
  }

  return response.json();
}

// Health
export const healthApi = {
  check: () => request<{ status: string; timestamp: string }>('/api/health'),
};

// Configs
export const configApi = {
  list: () => request<{ configs: any[] }>('/api/configs'),
  get: (id: string) => request<any>(`/api/configs/${id}`),
  create: (data: any) =>
    request<any>('/api/configs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    request<any>(`/api/configs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/api/configs/${id}`, {
      method: 'DELETE',
    }),
  importYaml: (id: string, yaml: string, preserveExtras = true) =>
    request<any>(`/api/configs/${id}/import-yaml`, {
      method: 'POST',
      body: JSON.stringify({ yaml, preserveExtras }),
    }),
  renderYaml: (id: string, profileId?: string, mode = 'masked', includeComment = true) =>
    request<{ yaml: string }>(`/api/configs/${id}/render-yaml`, {
      method: 'POST',
      body: JSON.stringify({ profileId, mode, includeComment }),
    }),
  validate: (id: string, profileId?: string) =>
    request<any>(`/api/configs/${id}/validate`, {
      method: 'POST',
      body: JSON.stringify({ profileId }),
    }),
  exportJson: (id: string) =>
    request<any>(`/api/configs/${id}/export-json`, {
      method: 'POST',
    }),
  deleteAll: () =>
    request<{ success: boolean; deletedCount: number }>('/api/configs', {
      method: 'DELETE',
    }),
  getOverlayFiles: (id: string) =>
    request<{ overlayFiles: Array<{ libraryName: string; file: any; index: number }> }>(
      `/api/configs/${id}/overlay-files`
    ),
  getOverlayAssets: (id: string) =>
    request<{ assets: Record<string, string> }>(`/api/configs/${id}/overlay-assets`),
};

// Profiles
export const profileApi = {
  list: () => request<{ profiles: any[] }>('/api/profiles'),
  get: (id: string) => request<any>(`/api/profiles/${id}`),
  create: (data: any) =>
    request<any>('/api/profiles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    request<any>(`/api/profiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/api/profiles/${id}`, {
      method: 'DELETE',
    }),
  export: (id: string, includeSecrets = false) =>
    request<any>(`/api/profiles/${id}/export`, {
      method: 'POST',
      body: JSON.stringify({ includeSecrets }),
    }),
  import: (data: any) =>
    request<any>('/api/profiles/import', {
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
      request<{ results: any[] }>('/api/proxy/tmdb/search', {
        method: 'POST',
        body: JSON.stringify({ profileId, query, type }),
      }),
    get: (profileId: string, type: 'movie' | 'tv', id: number) =>
      request<any>('/api/proxy/tmdb/get', {
        method: 'POST',
        body: JSON.stringify({ profileId, type, id }),
      }),
    getSeason: (profileId: string, tvId: number, seasonNumber: number) =>
      request<any>('/api/proxy/tmdb/season', {
        method: 'POST',
        body: JSON.stringify({ profileId, tvId, seasonNumber }),
      }),
    getEpisode: (profileId: string, tvId: number, seasonNumber: number, episodeNumber: number) =>
      request<any>('/api/proxy/tmdb/episode', {
        method: 'POST',
        body: JSON.stringify({ profileId, tvId, seasonNumber, episodeNumber }),
      }),
    find: (profileId: string, externalId: string, externalSource = 'imdb_id') =>
      request<any>('/api/proxy/tmdb/find', {
        method: 'POST',
        body: JSON.stringify({ profileId, externalId, externalSource }),
      }),
  },

  // Plex
  plex: {
    search: (profileId: string, query: string, type: 'movie' | 'show') =>
      request<any>('/api/proxy/plex/search', {
        method: 'POST',
        body: JSON.stringify({ profileId, query, type }),
      }),
    getSeasons: (profileId: string, showKey: string) =>
      request<any>('/api/proxy/plex/seasons', {
        method: 'POST',
        body: JSON.stringify({ profileId, showKey }),
      }),
    getEpisodes: (profileId: string, seasonKey: string) =>
      request<any>('/api/proxy/plex/episodes', {
        method: 'POST',
        body: JSON.stringify({ profileId, seasonKey }),
      }),
  },

  // Connection testing
  testConnection: (
    service: 'tmdb' | 'plex' | 'radarr' | 'sonarr' | 'tautulli' | 'mdblist' | 'trakt',
    secrets: Record<string, string>
  ) =>
    request<{ success: boolean; message?: string; error?: string; version?: string }>(
      '/api/proxy/test-connection',
      {
        method: 'POST',
        body: JSON.stringify({ service, secrets }),
      }
    ),
};
