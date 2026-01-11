import type { FastifyInstance } from 'fastify';
import { ConfigRepository } from '../db/config.repository.js';
import { ProfileRepository } from '../db/profile.repository.js';
import { parseKometaYaml, extractSecretsFromYaml } from '../yaml/parser.js';
import { generateYaml } from '../yaml/generator.js';
import { validateConfig } from '@kometa-studio/shared';
import { randomUUID } from 'node:crypto';

export async function configRoutes(
  fastify: FastifyInstance,
  opts: { configRepo: ConfigRepository; profileRepo: ProfileRepository }
) {
  const { configRepo, profileRepo } = opts;

  // List all configs
  fastify.get('/api/configs', async () => {
    const configs = configRepo.findAll();
    return { configs };
  });

  // Get config by ID
  fastify.get<{ Params: { id: string } }>('/api/configs/:id', async (request, reply) => {
    const config = configRepo.findById(request.params.id);
    if (!config) {
      reply.status(404);
      return { error: 'Config not found' };
    }
    return config;
  });

  // Create new config
  fastify.post<{ Body: any }>('/api/configs', async (request, reply) => {
    try {
      const { name, description, config } = request.body;

      if (!name || !config) {
        reply.status(400);
        return { error: 'Name and config are required' };
      }

      const newConfig = configRepo.create({
        id: randomUUID(),
        name,
        description,
        config,
      });

      reply.status(201);
      return newConfig;
    } catch (error) {
      reply.status(400);
      return {
        error: 'Failed to create config',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Update config
  fastify.put<{ Params: { id: string }; Body: any }>('/api/configs/:id', async (request, reply) => {
    try {
      const updated = configRepo.update(request.params.id, request.body);
      if (!updated) {
        reply.status(404);
        return { error: 'Config not found' };
      }
      return updated;
    } catch (error) {
      reply.status(400);
      return {
        error: 'Failed to update config',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Delete config
  fastify.delete<{ Params: { id: string } }>('/api/configs/:id', async (request, reply) => {
    const success = configRepo.delete(request.params.id);
    if (!success) {
      reply.status(404);
      return { error: 'Config not found' };
    }
    return { success: true };
  });

  // Import YAML
  fastify.post<{ Params: { id: string }; Body: any }>(
    '/api/configs/:id/import-yaml',
    async (request, reply) => {
      try {
        const { yaml, preserveExtras = true } = request.body;

        if (!yaml) {
          reply.status(400);
          return { error: 'YAML content is required' };
        }

        // Parse the config
        const config = parseKometaYaml(yaml, preserveExtras);
        const updated = configRepo.update(request.params.id, { config });

        if (!updated) {
          reply.status(404);
          return { error: 'Config not found' };
        }

        // Extract secrets and create a profile if any secrets were found
        const secrets = extractSecretsFromYaml(yaml);
        let profileId: string | undefined;
        let extractedSecrets: any = undefined;

        if (Object.keys(secrets).length > 0) {
          const profileName = `${updated.name} - Imported`;
          profileId = randomUUID();
          const newProfile = profileRepo.create({
            id: profileId,
            name: profileName,
            description: `Auto-generated profile from importing ${updated.name}`,
            secrets,
          });
          fastify.log.info({ profileId, profileName }, 'Created profile from import');

          // Return the unmasked secrets so frontend can cache them
          extractedSecrets = secrets;
        }

        return { ...updated, profileId, extractedSecrets };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        fastify.log.error({ error: errorMessage, stack: errorStack }, 'Import YAML error');
        reply.status(400);
        return {
          error: 'Failed to import YAML',
          details: errorMessage,
        };
      }
    }
  );

  // Render YAML
  fastify.post<{ Params: { id: string }; Body: any }>(
    '/api/configs/:id/render-yaml',
    async (request, reply) => {
      try {
        const configRecord = configRepo.findById(request.params.id);
        if (!configRecord) {
          reply.status(404);
          return { error: 'Config not found' };
        }

        const { profileId, mode = 'masked', includeComment = true } = request.body;

        let profile;
        if (profileId) {
          profile = profileRepo.findById(profileId);
          if (!profile) {
            reply.status(404);
            return { error: 'Profile not found' };
          }
        }

        const yaml = generateYaml({
          config: configRecord.config,
          profile,
          mode,
          includeComment,
        });

        return { yaml };
      } catch (error) {
        reply.status(400);
        return {
          error: 'Failed to render YAML',
          details: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Validate config
  fastify.post<{ Params: { id: string }; Body: any }>(
    '/api/configs/:id/validate',
    async (request, reply) => {
      try {
        const configRecord = configRepo.findById(request.params.id);
        if (!configRecord) {
          reply.status(404);
          return { error: 'Config not found' };
        }

        const { profileId } = request.body;

        let profile;
        if (profileId) {
          profile = profileRepo.findById(profileId);
        }

        const validation = validateConfig(configRecord.config, profile);
        return validation;
      } catch (error) {
        reply.status(400);
        return {
          error: 'Failed to validate config',
          details: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Export config as JSON
  fastify.post<{ Params: { id: string } }>(
    '/api/configs/:id/export-json',
    async (request, reply) => {
      const config = configRepo.findById(request.params.id);
      if (!config) {
        reply.status(404);
        return { error: 'Config not found' };
      }

      reply.header('Content-Type', 'application/json');
      reply.header('Content-Disposition', `attachment; filename="${config.name}.json"`);
      return config;
    }
  );

  // Delete all configs
  fastify.delete('/api/configs', async (request, reply) => {
    try {
      const configs = configRepo.findAll();
      for (const config of configs) {
        configRepo.delete(config.id);
      }
      return { success: true, deletedCount: configs.length };
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to delete all configs',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Delete all profiles
  fastify.delete('/api/profiles', async (request, reply) => {
    try {
      const profiles = profileRepo.findAll();
      for (const profile of profiles) {
        profileRepo.delete(profile.id);
      }
      return { success: true, deletedCount: profiles.length };
    } catch (error) {
      reply.status(500);
      return {
        error: 'Failed to delete all profiles',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
}
