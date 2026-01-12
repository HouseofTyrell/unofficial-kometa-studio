import type { FastifyInstance } from 'fastify';
import { ProfileRepository } from '../db/profile.repository.js';
import {
  maskSecret,
  CreateProfileSchema,
  UpdateProfileSchema,
  ExportProfileRequestSchema,
  ImportProfileRequestSchema,
  type CreateProfileInput,
  type UpdateProfileInput,
  type ExportProfileRequestInput,
  type ImportProfileRequestInput,
} from '@kometa-studio/shared';
import { randomUUID } from 'node:crypto';
import { validateBody, validateIdParam } from '../middleware/validation.js';

function maskProfileSecrets(profile: any): any {
  const masked = { ...profile };

  if (masked.secrets) {
    masked.secrets = {
      ...masked.secrets,
      plex: masked.secrets.plex
        ? {
            url: masked.secrets.plex.url,
            token: maskSecret(masked.secrets.plex.token),
          }
        : undefined,
      tmdb: masked.secrets.tmdb
        ? {
            apikey: maskSecret(masked.secrets.tmdb.apikey),
          }
        : undefined,
      tautulli: masked.secrets.tautulli
        ? {
            url: masked.secrets.tautulli.url,
            apikey: maskSecret(masked.secrets.tautulli.apikey),
          }
        : undefined,
      mdblist: masked.secrets.mdblist
        ? {
            apikey: maskSecret(masked.secrets.mdblist.apikey),
          }
        : undefined,
      radarr: masked.secrets.radarr
        ? {
            url: masked.secrets.radarr.url,
            token: maskSecret(masked.secrets.radarr.token),
          }
        : undefined,
      sonarr: masked.secrets.sonarr
        ? {
            url: masked.secrets.sonarr.url,
            token: maskSecret(masked.secrets.sonarr.token),
          }
        : undefined,
      trakt: masked.secrets.trakt
        ? {
            client_secret: maskSecret(masked.secrets.trakt.client_secret),
            authorization: masked.secrets.trakt.authorization
              ? {
                  access_token: maskSecret(masked.secrets.trakt.authorization.access_token),
                  refresh_token: maskSecret(masked.secrets.trakt.authorization.refresh_token),
                }
              : undefined,
          }
        : undefined,
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

  // Get profile by ID (with unmasked secrets for local-first access)
  fastify.get<{ Params: { id: string } }>('/api/profiles/:id', async (request, reply) => {
    const id = await validateIdParam(request, reply);
    if (!id) return;

    const profile = profileRepo.findById(id);
    if (!profile) {
      reply.status(404);
      return { error: 'Profile not found' };
    }
    // Return unmasked secrets since this is a local-first app
    return profile;
  });

  // Create new profile
  fastify.post<{ Body: CreateProfileInput }>('/api/profiles', async (request, reply) => {
    const body = await validateBody(request, reply, CreateProfileSchema);
    if (!body) return;

    try {
      const newProfile = profileRepo.create({
        id: randomUUID(),
        name: body.name,
        description: body.description,
        secrets: body.secrets || {},
      });

      reply.status(201);
      return newProfile;
    } catch (error) {
      reply.status(400);
      return {
        error: 'Failed to create profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Update profile
  fastify.put<{ Params: { id: string }; Body: UpdateProfileInput }>(
    '/api/profiles/:id',
    async (request, reply) => {
      const id = await validateIdParam(request, reply);
      if (!id) return;

      const body = await validateBody(request, reply, UpdateProfileSchema);
      if (!body) return;

      try {
        const updated = profileRepo.update(id, body);
        if (!updated) {
          reply.status(404);
          return { error: 'Profile not found' };
        }
        return updated;
      } catch (error) {
        reply.status(400);
        return {
          error: 'Failed to update profile',
          details: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Delete profile
  fastify.delete<{ Params: { id: string } }>('/api/profiles/:id', async (request, reply) => {
    const id = await validateIdParam(request, reply);
    if (!id) return;

    const success = profileRepo.delete(id);
    if (!success) {
      reply.status(404);
      return { error: 'Profile not found' };
    }
    return { success: true };
  });

  // Export profile
  fastify.post<{ Params: { id: string }; Body: ExportProfileRequestInput }>(
    '/api/profiles/:id/export',
    async (request, reply) => {
      const id = await validateIdParam(request, reply);
      if (!id) return;

      const body = await validateBody(request, reply, ExportProfileRequestSchema);
      if (!body) return;

      const profile = profileRepo.findById(id);
      if (!profile) {
        reply.status(404);
        return { error: 'Profile not found' };
      }

      const exportData = body.includeSecrets ? profile : maskProfileSecrets(profile);

      reply.header('Content-Type', 'application/json');
      reply.header('Content-Disposition', `attachment; filename="${profile.name}-profile.json"`);
      return exportData;
    }
  );

  // Import profile
  fastify.post<{ Body: ImportProfileRequestInput }>(
    '/api/profiles/import',
    async (request, reply) => {
      const body = await validateBody(request, reply, ImportProfileRequestSchema);
      if (!body) return;

      try {
        const newProfile = profileRepo.create({
          id: randomUUID(),
          name: body.name,
          description: body.description,
          secrets: body.secrets,
        });

        reply.status(201);
        return newProfile;
      } catch (error) {
        reply.status(400);
        return {
          error: 'Failed to import profile',
          details: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );
}
