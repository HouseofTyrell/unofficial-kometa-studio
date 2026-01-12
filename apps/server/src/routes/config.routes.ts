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

  // Get overlay files from config
  fastify.get<{ Params: { id: string } }>('/api/configs/:id/overlay-files', async (request, reply) => {
    try {
      const configRecord = configRepo.findById(request.params.id);
      if (!configRecord) {
        reply.status(404);
        return { error: 'Config not found' };
      }

      // Extract overlay files from all libraries with enhanced metadata
      const overlayFiles: Array<{
        libraryName: string;
        file: any;
        index: number;
        // Enhanced metadata
        overlayType?: string;  // e.g., "ratings", "resolution", "audio_codec"
        overlayPath?: string;  // git/pmm path
        level?: string;        // "series", "season", "episode" for TV; "movie" for movies
        customFilePath?: string; // local file path
      }> = [];

      if (configRecord.config.libraries) {
        for (const [libraryName, library] of Object.entries(configRecord.config.libraries)) {
          if (library && typeof library === 'object' && 'overlay_files' in library) {
            const files = library.overlay_files as any[];
            if (Array.isArray(files)) {
              files.forEach((file, index) => {
                // Parse overlay file to extract type and level
                let overlayType = file.default;
                let overlayPath = file.git || file.pmm;
                let customFilePath = file.file;
                let level: string | undefined;

                // Infer level from path or file structure
                if (overlayPath) {
                  // Extract from git/pmm path (e.g., "overlays/ratings" -> "ratings")
                  const pathParts = overlayPath.split('/');
                  const lastPart = pathParts[pathParts.length - 1];
                  // Check if it indicates a level
                  if (lastPart.includes('season')) level = 'season';
                  else if (lastPart.includes('episode')) level = 'episode';
                  else if (lastPart.includes('show') || lastPart.includes('series')) level = 'series';
                }

                // Check template_variables for level indicators
                if (file.template_variables) {
                  const vars = file.template_variables;
                  if (vars.overlay_level) {
                    level = vars.overlay_level;
                  } else if (vars.builder_level) {
                    level = vars.builder_level;
                  }
                }

                // If no level found and it's a TV library, default to series
                if (!level && libraryName && libraryName.toLowerCase().includes('tv')) {
                  level = 'series';
                } else if (!level) {
                  level = 'movie';
                }

                overlayFiles.push({
                  libraryName,
                  file,
                  index,
                  overlayType,
                  overlayPath,
                  level,
                  customFilePath,
                });
              });
            }
          }
        }
      }

      // Enhanced debug logging
      console.log('\n📄 Overlay Files Detection Summary:');
      console.log(`Total overlays found: ${overlayFiles.length}`);

      // Group by library
      const byLibrary = overlayFiles.reduce((acc: any, f) => {
        if (!acc[f.libraryName]) acc[f.libraryName] = [];
        acc[f.libraryName].push(f);
        return acc;
      }, {});

      Object.entries(byLibrary).forEach(([library, files]: [string, any]) => {
        console.log(`\n  📚 ${library}: ${files.length} overlays`);
        files.forEach((f: any) => {
          console.log(`    - ${f.overlayType || 'unknown'} (${f.level}) ${f.overlayPath ? `[${f.overlayPath}]` : ''}`);
          if (f.file.template_variables) {
            console.log(`      Template vars:`, Object.keys(f.file.template_variables));
          }
        });
      });
      console.log('\n');

      return { overlayFiles };
    } catch (error) {
      reply.status(400);
      return {
        error: 'Failed to get overlay files',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Get all overlay assets (images, logos, etc.) from config for preview
  fastify.get<{ Params: { id: string } }>('/api/configs/:id/overlay-assets', async (request, reply) => {
    try {
      const configRecord = configRepo.findById(request.params.id);
      if (!configRecord) {
        reply.status(404);
        return { error: 'Config not found' };
      }

      // Extract all image/asset URLs from overlay files
      const assets: Record<string, string> = {};

      if (configRecord.config.libraries) {
        for (const [libraryName, library] of Object.entries(configRecord.config.libraries)) {
          if (library && typeof library === 'object' && 'overlay_files' in library) {
            const files = library.overlay_files as any[];
            if (Array.isArray(files)) {
              files.forEach((file) => {
                // Extract template_variables that contain image URLs
                if (file.template_variables) {
                  const vars = file.template_variables;

                  // Check for rating image URLs (rating1_image_url, rating2_image_url, etc.)
                  Object.keys(vars).forEach((key) => {
                    if (key.includes('_image_url') || key.includes('_image') || key === 'url') {
                      const value = vars[key];
                      if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('/'))) {
                        // Store with a descriptive key
                        assets[`${libraryName}_${file.default || 'unknown'}_${key}`] = value;
                      }
                    }
                  });

                  // Check for addon images (used in ratings overlays)
                  ['rating1_image', 'rating2_image', 'rating3_image'].forEach((ratingKey) => {
                    if (vars[ratingKey]) {
                      const imageType = vars[ratingKey]; // e.g., "imdb", "tmdb", "rt_tomato"
                      // Map to Kometa's default image paths
                      const kometaImagePath = `https://raw.githubusercontent.com/Kometa-Team/Kometa/master/defaults/overlays/images/rating/${imageType}.png`;
                      assets[`${libraryName}_${file.default || 'ratings'}_${ratingKey}`] = kometaImagePath;
                    }
                  });

                  // Check for custom file paths
                  if (file.file && typeof file.file === 'string') {
                    assets[`${libraryName}_${file.default || 'unknown'}_file`] = file.file;
                  }
                }
              });
            }
          }
        }
      }

      console.log('\n🖼️  Overlay Assets Extracted:', Object.keys(assets).length, 'assets');
      Object.entries(assets).forEach(([key, url]) => {
        console.log(`  - ${key}: ${url.substring(0, 80)}...`);
      });

      return { assets };
    } catch (error) {
      reply.status(400);
      return {
        error: 'Failed to get overlay assets',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
}
