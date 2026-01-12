import { describe, it, expect } from 'vitest';
import { validateConfig, maskSecret } from './validator.js';
import type { KometaConfig } from '../schemas/config.schema.js';
import type { Profile } from '../schemas/profile.schema.js';

describe('validateConfig', () => {
  it('should warn when Plex is enabled without credentials', () => {
    const config: KometaConfig = {
      plex: { enabled: true },
    };

    const result = validateConfig(config);

    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        path: ['plex', 'url'],
        message: expect.stringContaining('no URL'),
      })
    );
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        path: ['plex', 'token'],
        message: expect.stringContaining('no token'),
      })
    );
  });

  it('should not warn when Plex credentials are provided', () => {
    const config: KometaConfig = {
      plex: { enabled: true },
      libraries: {
        Movies: { collection_files: [{ default: 'imdb' }] },
      },
    };

    const profile: Profile = {
      name: 'Test',
      secrets: {
        plex: {
          url: 'http://localhost:32400',
          token: 'my-token',
        },
      },
    };

    const result = validateConfig(config, profile);

    const plexWarnings = result.warnings.filter((w) => w.path[0] === 'plex');
    expect(plexWarnings).toHaveLength(0);
  });

  it('should warn when no libraries are configured', () => {
    const config: KometaConfig = {};

    const result = validateConfig(config);

    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        path: ['libraries'],
        message: expect.stringContaining('No libraries'),
      })
    );
  });

  it('should warn when library has no files', () => {
    const config: KometaConfig = {
      libraries: {
        Movies: {},
      },
    };

    const result = validateConfig(config);

    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        path: ['libraries', 'Movies'],
        message: expect.stringContaining('no collection_files'),
      })
    );
  });

  it('should not warn when library has collection_files', () => {
    const config: KometaConfig = {
      libraries: {
        Movies: {
          collection_files: [{ default: 'imdb' }],
        },
      },
    };

    const result = validateConfig(config);

    const libraryWarnings = result.warnings.filter(
      (w) => w.path[0] === 'libraries' && w.path[1] === 'Movies'
    );
    expect(libraryWarnings).toHaveLength(0);
  });

  it('should warn when Radarr add_missing is enabled without root_folder_path', () => {
    const config: KometaConfig = {
      radarr: {
        enabled: true,
        add_missing: true,
      },
    };

    const profile: Profile = {
      name: 'Test',
      secrets: {
        radarr: {
          url: 'http://localhost:7878',
          token: 'token',
        },
      },
    };

    const result = validateConfig(config, profile);

    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        path: ['radarr', 'root_folder_path'],
        message: expect.stringContaining('no root_folder_path'),
      })
    );
  });
});

describe('maskSecret', () => {
  it('should mask long secrets', () => {
    const masked = maskSecret('abcdefghijklmnop');
    expect(masked).toBe('abcd****mnop');
  });

  it('should fully mask short secrets', () => {
    const masked = maskSecret('short');
    expect(masked).toBe('****');
  });

  it('should return undefined for undefined input', () => {
    const masked = maskSecret(undefined);
    expect(masked).toBeUndefined();
  });

  it('should handle exactly 8 character secrets', () => {
    const masked = maskSecret('12345678');
    expect(masked).toBe('1234****5678');
  });
});
