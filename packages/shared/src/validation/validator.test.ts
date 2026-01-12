import { describe, it, expect } from 'vitest';
import { validateConfig } from './validator';
import type { KometaConfig, Profile } from '../index';

describe('Config Validator', () => {
  it('should warn when plex enabled without credentials', () => {
    const config: KometaConfig = {
      plex: { enabled: true },
    };

    const result = validateConfig(config);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.path.includes('plex'))).toBe(true);
  });

  it('should not warn when plex enabled with credentials', () => {
    const config: KometaConfig = {
      plex: { enabled: true },
    };

    const profile: Profile = {
      name: 'Test',
      secrets: {
        plex: {
          url: 'http://localhost:32400',
          token: 'test-token',
        },
      },
    };

    const result = validateConfig(config, profile);

    const plexWarnings = result.warnings.filter(
      (w) => w.path.includes('plex') && w.path.includes('url')
    );
    expect(plexWarnings).toHaveLength(0);
  });

  it('should warn when library has no files', () => {
    const config: KometaConfig = {
      libraries: {
        Movies: {},
      },
    };

    const result = validateConfig(config);

    expect(result.warnings.some((w) => w.path.includes('Movies'))).toBe(true);
  });

  it('should not warn when library has collection files', () => {
    const config: KometaConfig = {
      libraries: {
        Movies: {
          collection_files: [{ default: 'imdb' }],
        },
      },
    };

    const result = validateConfig(config);

    const libraryWarnings = result.warnings.filter(
      (w) => w.path.includes('Movies') && w.message.includes('no collection_files')
    );
    expect(libraryWarnings).toHaveLength(0);
  });

  it('should warn when radarr enabled without credentials', () => {
    const config: KometaConfig = {
      radarr: { enabled: true },
    };

    const result = validateConfig(config);

    expect(result.warnings.some((w) => w.path.includes('radarr'))).toBe(true);
  });
});
