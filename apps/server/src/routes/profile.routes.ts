import type { FastifyInstance } from 'fastify';
import { ProfileRepository } from '../db/profile.repository.js';
import { maskSecret } from '@kometa-studio/shared';
import { randomUUID } from 'node:crypto';

function maskProfileSecrets(profile: any): any {
  const masked = { ...profile };

  if (masked.secrets) {
    masked.secrets = {
      ...masked.secrets,
      plex: masked.secrets.plex ? {
        url: masked.secrets.plex.url,
        token: maskSecret(masked.secrets.plex.token),
      } : undefined,
      tmdb: masked.secrets.tmdb ? {
        apikey: maskSecret(masked.secrets.tmdb.apikey),
      } : undefined,
      tautulli: masked.secrets.tautulli ? {
        url: masked.secrets.tautulli.url,
        apikey: maskSecret(masked.secrets.tautulli.apikey),
      } : undefined,
      mdblist: masked.secrets.mdblist ? {
        apikey: maskSecret(masked.secrets.mdblist.apikey),
      } : undefined,
      radarr: masked.secrets.radarr ? {
        url: masked.secrets.radarr.url,
        token: maskSecret(masked.secrets.radarr.token),
      } : undefined,
      sonarr: masked.secrets.sonarr ? {
        url: masked.secrets.sonarr.url,
        token: maskSecret(masked.secrets.sonarr.token),
      } : undefined,
      trakt: masked.secrets.trakt ? {
        client_secret: maskSecret(masked.secrets.trakt.client_secret),
        authorization: masked.secrets.trakt.authorization ? {
          access_token: maskSecret(masked.secrets.trakt.authorization.access_token),
          refresh_token: maskSecret(masked.secrets.trakt.authorization.refresh_token),
        } : undefined,
      } : undefined,
      extras: masked.secrets.extras,
    };
  }

  return masked;
}

export async function profileRoutes(
  fastify: FastifyInstance,
  opts: { profileRepo: ProfileRepository }
) {
  const { profileRepo } = opts;

  // List all profiles (without secrets)
  fastify.get('/api/profiles', async () => {
    const profiles = profileRepo.findAll();
    return { profiles };
  });

  // Get profile by ID (with masked secrets)
  fastify.get<{ Params: { id: string } }>('/api/profiles/:id', async (request, reply) => {
    const profile = profileRepo.findById(request.params.id);
    if (!profile) {
      reply.status(404);
      return { error: 'Profile not found' };
    }
    return maskProfileSecrets(profile);
  });

  // Create new profile
  fastify.post<{ Body: any }>('/api/profiles', async (request, reply) => {
    try {
      const { name, description, secrets } = request.body;

      if (!name) {
        reply.status(400);
        return { error: 'Name is required' };
      }

      const newProfile = profileRepo.create({
        id: randomUUID(),
        name,
        description,
        secrets: secrets || {},
      });

      reply.status(201);
      return maskProfileSecrets(newProfile);
    } catch (error) {
      reply.status(400);
      return {
        error: 'Failed to create profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Update profile
  fastify.put<{ Params: { id: string }; Body: any }>('/api/profiles/:id', async (request, reply) => {
    try {
      const updated = profileRepo.update(request.params.id, request.body);
      if (!updated) {
        reply.status(404);
        return { error: 'Profile not found' };
      }
      return maskProfileSecrets(updated);
    } catch (error) {
      reply.status(400);
      return {
        error: 'Failed to update profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Delete profile
  fastify.delete<{ Params: { id: string } }>('/api/profiles/:id', async (request, reply) => {
    const success = profileRepo.delete(request.params.id);
    if (!success) {
      reply.status(404);
      return { error: 'Profile not found' };
    }
    return { success: true };
  });

  // Export profile
  fastify.post<{ Params: { id: string }; Body: any }>(
    '/api/profiles/:id/export',
    async (request, reply) => {
      const profile = profileRepo.findById(request.params.id);
      if (!profile) {
        reply.status(404);
        return { error: 'Profile not found' };
      }

      const { includeSecrets = false } = request.body;

      const exportData = includeSecrets ? profile : maskProfileSecrets(profile);

      reply.header('Content-Type', 'application/json');
      reply.header('Content-Disposition', `attachment; filename="${profile.name}-profile.json"`);
      return exportData;
    }
  );

  // Import profile
  fastify.post<{ Body: any }>('/api/profiles/import', async (request, reply) => {
    try {
      const profileData = request.body;

      if (!profileData.name || !profileData.secrets) {
        reply.status(400);
        return { error: 'Invalid profile data' };
      }

      const newProfile = profileRepo.create({
        id: randomUUID(),
        name: profileData.name,
        description: profileData.description,
        secrets: profileData.secrets,
      });

      reply.status(201);
      return maskProfileSecrets(newProfile);
    } catch (error) {
      reply.status(400);
      return {
        error: 'Failed to import profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
}
