import { describe, it, expect } from 'vitest';
import { generateYaml } from './generator';
import type { KometaConfig } from '@kometa-studio/shared';

describe('YAML Generator', () => {
  it('should generate YAML with correct order', () => {
    const config: KometaConfig = {
      settings: { cache: true },
      tmdb: { enabled: true },
      plex: { enabled: true },
      libraries: {
        'Movies': {
          collection_files: [{ default: 'imdb' }],
        },
      },
    };

    const yaml = generateYaml({ config, mode: 'template' });

    // Check that sections appear in correct order
    const settingsPos = yaml.indexOf('settings:');
    const plexPos = yaml.indexOf('plex:');
    const tmdbPos = yaml.indexOf('tmdb:');
    const librariesPos = yaml.indexOf('libraries:');

    expect(settingsPos).toBeLessThan(plexPos);
    expect(plexPos).toBeLessThan(tmdbPos);
    expect(tmdbPos).toBeLessThan(librariesPos);
  });

  it('should preserve collection_files order', () => {
    const config: KometaConfig = {
      libraries: {
        'Movies': {
          collection_files: [
            { default: 'first' },
            { default: 'second' },
            { default: 'third' },
          ],
        },
      },
    };

    const yaml = generateYaml({ config, mode: 'template' });

    const firstPos = yaml.indexOf('first');
    const secondPos = yaml.indexOf('second');
    const thirdPos = yaml.indexOf('third');

    expect(firstPos).toBeLessThan(secondPos);
    expect(secondPos).toBeLessThan(thirdPos);
  });

  it('should support repeated defaults with different template_variables', () => {
    const config: KometaConfig = {
      libraries: {
        'Movies': {
          overlay_files: [
            {
              default: 'studio',
              template_variables: { builder_level: 'movie' },
            },
            {
              default: 'studio',
              template_variables: { builder_level: 'collection' },
            },
          ],
        },
      },
    };

    const yaml = generateYaml({ config, mode: 'template' });

    // Check that studio appears twice
    const matches = yaml.match(/studio/g);
    expect(matches).toHaveLength(2);

    // Check that both template_variables are present
    expect(yaml).toContain('movie');
    expect(yaml).toContain('collection');
  });

  it('should not include secrets in template mode', () => {
    const config: KometaConfig = {
      plex: { enabled: true },
    };

    const profile = {
      id: 'test',
      name: 'Test',
      secrets: {
        plex: {
          url: 'http://localhost:32400',
          token: 'secret-token-12345',
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const yaml = generateYaml({ config, profile, mode: 'template' });

    expect(yaml).not.toContain('secret-token-12345');
    expect(yaml).not.toContain('localhost:32400');
  });

  it('should mask secrets in masked mode', () => {
    const config: KometaConfig = {
      plex: { enabled: true },
    };

    const profile = {
      id: 'test',
      name: 'Test',
      secrets: {
        plex: {
          url: 'http://localhost:32400',
          token: 'secret-token-12345',
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const yaml = generateYaml({ config, profile, mode: 'masked' });

    expect(yaml).toContain('****'); // Masked token
    expect(yaml).toContain('localhost:32400'); // URL not masked
  });

  it('should include full secrets in full mode', () => {
    const config: KometaConfig = {
      plex: { enabled: true },
    };

    const profile = {
      id: 'test',
      name: 'Test',
      secrets: {
        plex: {
          url: 'http://localhost:32400',
          token: 'secret-token-12345',
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const yaml = generateYaml({ config, profile, mode: 'full' });

    expect(yaml).toContain('secret-token-12345');
    expect(yaml).toContain('localhost:32400');
  });
});
