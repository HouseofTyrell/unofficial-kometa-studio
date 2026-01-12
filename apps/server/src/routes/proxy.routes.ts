import type { FastifyInstance } from 'fastify';
import { ProfileRepository } from '../db/profile.repository.js';
import { z } from 'zod';
import { validateBody, validateIdParam } from '../middleware/validation.js';

// Validation schemas
const TmdbSearchSchema = z.object({
  profileId: z.string().uuid(),
  query: z.string().min(1),
  type: z.enum(['movie', 'tv']),
});

const TmdbGetSchema = z.object({
  profileId: z.string().uuid(),
  type: z.enum(['movie', 'tv']),
  id: z.number().int().positive(),
});

const TmdbSeasonSchema = z.object({
  profileId: z.string().uuid(),
  tvId: z.number().int().positive(),
  seasonNumber: z.number().int().min(0),
});

const TmdbEpisodeSchema = z.object({
  profileId: z.string().uuid(),
  tvId: z.number().int().positive(),
  seasonNumber: z.number().int().min(0),
  episodeNumber: z.number().int().positive(),
});

const TmdbFindSchema = z.object({
  profileId: z.string().uuid(),
  externalId: z.string().min(1),
  externalSource: z.enum(['imdb_id', 'tvdb_id']).default('imdb_id'),
});

const PlexSearchSchema = z.object({
  profileId: z.string().uuid(),
  query: z.string().min(1),
  type: z.enum(['movie', 'show']),
});

const PlexSeasonsSchema = z.object({
  profileId: z.string().uuid(),
  showKey: z.string().min(1),
});

const PlexEpisodesSchema = z.object({
  profileId: z.string().uuid(),
  seasonKey: z.string().min(1),
});

const ConnectionTestSchema = z.object({
  service: z.enum(['tmdb', 'plex', 'radarr', 'sonarr', 'tautulli', 'mdblist', 'trakt']),
  secrets: z.record(z.string()),
});

export async function proxyRoutes(
  fastify: FastifyInstance,
  opts: { profileRepo: ProfileRepository }
) {
  const { profileRepo } = opts;

  // Helper to get profile secrets
  const getProfileSecrets = (profileId: string, service: string) => {
    const profile = profileRepo.findById(profileId);
    if (!profile) {
      return null;
    }
    return (profile.secrets as Record<string, unknown>)?.[service] as
      | Record<string, string>
      | undefined;
  };

  // ============================================
  // TMDB Proxy Routes
  // ============================================

  // Search movies or TV shows
  fastify.post('/api/proxy/tmdb/search', async (request, reply) => {
    const body = await validateBody(request, reply, TmdbSearchSchema);
    if (!body) return;

    const secrets = getProfileSecrets(body.profileId, 'tmdb');
    if (!secrets?.apikey) {
      reply.status(400);
      return { error: 'TMDB API key not configured in profile' };
    }

    try {
      const endpoint = body.type === 'movie' ? 'search/movie' : 'search/tv';
      const url = `https://api.themoviedb.org/3/${endpoint}?api_key=${secrets.apikey}&query=${encodeURIComponent(body.query)}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        reply.status(response.status);
        return { error: 'TMDB API error', details: data };
      }

      return data;
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch from TMDB',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Get movie or TV show details
  fastify.post('/api/proxy/tmdb/get', async (request, reply) => {
    const body = await validateBody(request, reply, TmdbGetSchema);
    if (!body) return;

    const secrets = getProfileSecrets(body.profileId, 'tmdb');
    if (!secrets?.apikey) {
      reply.status(400);
      return { error: 'TMDB API key not configured in profile' };
    }

    try {
      const endpoint = body.type === 'movie' ? 'movie' : 'tv';
      const url = `https://api.themoviedb.org/3/${endpoint}/${body.id}?api_key=${secrets.apikey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        reply.status(response.status);
        return { error: 'TMDB API error', details: data };
      }

      return data;
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch from TMDB',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Get TV season details
  fastify.post('/api/proxy/tmdb/season', async (request, reply) => {
    const body = await validateBody(request, reply, TmdbSeasonSchema);
    if (!body) return;

    const secrets = getProfileSecrets(body.profileId, 'tmdb');
    if (!secrets?.apikey) {
      reply.status(400);
      return { error: 'TMDB API key not configured in profile' };
    }

    try {
      const url = `https://api.themoviedb.org/3/tv/${body.tvId}/season/${body.seasonNumber}?api_key=${secrets.apikey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        reply.status(response.status);
        return { error: 'TMDB API error', details: data };
      }

      return data;
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch from TMDB',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Get TV episode details
  fastify.post('/api/proxy/tmdb/episode', async (request, reply) => {
    const body = await validateBody(request, reply, TmdbEpisodeSchema);
    if (!body) return;

    const secrets = getProfileSecrets(body.profileId, 'tmdb');
    if (!secrets?.apikey) {
      reply.status(400);
      return { error: 'TMDB API key not configured in profile' };
    }

    try {
      const url = `https://api.themoviedb.org/3/tv/${body.tvId}/season/${body.seasonNumber}/episode/${body.episodeNumber}?api_key=${secrets.apikey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        reply.status(response.status);
        return { error: 'TMDB API error', details: data };
      }

      return data;
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch from TMDB',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Find by external ID (IMDb, TVDB)
  fastify.post('/api/proxy/tmdb/find', async (request, reply) => {
    const body = await validateBody(request, reply, TmdbFindSchema);
    if (!body) return;

    const secrets = getProfileSecrets(body.profileId, 'tmdb');
    if (!secrets?.apikey) {
      reply.status(400);
      return { error: 'TMDB API key not configured in profile' };
    }

    try {
      const url = `https://api.themoviedb.org/3/find/${encodeURIComponent(body.externalId)}?api_key=${secrets.apikey}&external_source=${body.externalSource}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        reply.status(response.status);
        return { error: 'TMDB API error', details: data };
      }

      return data;
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch from TMDB',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // ============================================
  // Plex Proxy Routes
  // ============================================

  // Search Plex library
  fastify.post('/api/proxy/plex/search', async (request, reply) => {
    const body = await validateBody(request, reply, PlexSearchSchema);
    if (!body) return;

    const secrets = getProfileSecrets(body.profileId, 'plex');
    if (!secrets?.url || !secrets?.token) {
      reply.status(400);
      return { error: 'Plex URL and token not configured in profile' };
    }

    try {
      const plexType = body.type === 'movie' ? 1 : 2;
      const url = `${secrets.url}/search?query=${encodeURIComponent(body.query)}&type=${plexType}`;

      const response = await fetch(url, {
        headers: {
          'X-Plex-Token': secrets.token,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        reply.status(response.status);
        return { error: 'Plex API error', details: response.statusText };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch from Plex',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Get seasons for a TV show
  fastify.post('/api/proxy/plex/seasons', async (request, reply) => {
    const body = await validateBody(request, reply, PlexSeasonsSchema);
    if (!body) return;

    const secrets = getProfileSecrets(body.profileId, 'plex');
    if (!secrets?.url || !secrets?.token) {
      reply.status(400);
      return { error: 'Plex URL and token not configured in profile' };
    }

    try {
      const url = `${secrets.url}${body.showKey}/children`;

      const response = await fetch(url, {
        headers: {
          'X-Plex-Token': secrets.token,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        reply.status(response.status);
        return { error: 'Plex API error', details: response.statusText };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch from Plex',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Get episodes for a season
  fastify.post('/api/proxy/plex/episodes', async (request, reply) => {
    const body = await validateBody(request, reply, PlexEpisodesSchema);
    if (!body) return;

    const secrets = getProfileSecrets(body.profileId, 'plex');
    if (!secrets?.url || !secrets?.token) {
      reply.status(400);
      return { error: 'Plex URL and token not configured in profile' };
    }

    try {
      const url = `${secrets.url}${body.seasonKey}`;

      const response = await fetch(url, {
        headers: {
          'X-Plex-Token': secrets.token,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        reply.status(response.status);
        return { error: 'Plex API error', details: response.statusText };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to fetch from Plex',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // ============================================
  // Connection Test Route
  // ============================================

  fastify.post('/api/proxy/test-connection', async (request, reply) => {
    const body = await validateBody(request, reply, ConnectionTestSchema);
    if (!body) return;

    const { service, secrets } = body;

    try {
      switch (service) {
        case 'tmdb': {
          if (!secrets.apikey) {
            reply.status(400);
            return { error: 'TMDB API key is required' };
          }
          const response = await fetch(
            `https://api.themoviedb.org/3/movie/603?api_key=${secrets.apikey}`
          );
          if (response.ok) {
            return { success: true, message: 'TMDB connection successful' };
          }
          const errorData = (await response.json()) as { status_message?: string };
          reply.status(response.status);
          return {
            success: false,
            error: errorData.status_message || response.statusText,
          };
        }

        case 'plex': {
          if (!secrets.url || !secrets.token) {
            reply.status(400);
            return { error: 'Plex URL and token are required' };
          }
          const response = await fetch(`${secrets.url}/identity`, {
            headers: { 'X-Plex-Token': secrets.token },
          });
          if (response.ok) {
            return { success: true, message: 'Plex connection successful' };
          }
          reply.status(response.status);
          return { success: false, error: response.statusText };
        }

        case 'radarr':
        case 'sonarr': {
          if (!secrets.url || !secrets.token) {
            reply.status(400);
            return { error: `${service} URL and token are required` };
          }
          const response = await fetch(`${secrets.url}/api/v3/system/status`, {
            headers: { 'X-Api-Key': secrets.token },
          });
          if (response.ok) {
            const data = (await response.json()) as { version?: string };
            return {
              success: true,
              message: `${service} connection successful`,
              version: data.version,
            };
          }
          reply.status(response.status);
          return { success: false, error: response.statusText };
        }

        case 'tautulli': {
          if (!secrets.url || !secrets.apikey) {
            reply.status(400);
            return { error: 'Tautulli URL and API key are required' };
          }
          const response = await fetch(
            `${secrets.url}/api/v2?apikey=${secrets.apikey}&cmd=get_server_info`
          );
          if (response.ok) {
            return { success: true, message: 'Tautulli connection successful' };
          }
          reply.status(response.status);
          return { success: false, error: response.statusText };
        }

        case 'mdblist': {
          if (!secrets.apikey) {
            reply.status(400);
            return { error: 'MDBList API key is required' };
          }
          // MDBList doesn't have a simple test endpoint, just validate the key exists
          return { success: true, message: 'MDBList API key saved' };
        }

        case 'trakt': {
          if (!secrets.client_id || !secrets.client_secret) {
            reply.status(400);
            return { error: 'Trakt client ID and secret are required' };
          }
          // Trakt requires OAuth, just validate credentials exist
          return { success: true, message: 'Trakt credentials saved' };
        }

        default:
          reply.status(400);
          return { error: `Unknown service: ${service}` };
      }
    } catch (error) {
      reply.status(500);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  });
}
