import { describe, it, expect } from 'vitest';
import { parseKometaYaml, extractSecretsFromYaml } from './parser';
import { generateYaml } from './generator';
import type { KometaConfig } from '@kometa-studio/shared';

/**
 * YAML Round-Trip Test Suite
 *
 * These tests verify that:
 * 1. Parsing YAML and generating it back produces equivalent configs
 * 2. Unknown keys are preserved in extras fields
 * 3. Edge cases are handled correctly
 *
 * Known limitations (documented):
 * - YAML comments are not preserved (standard YAML behavior)
 * - Key ordering may change (semantic equivalence maintained)
 * - Secrets are extracted to profiles, not preserved in config
 */

describe('YAML Round-Trip Tests', () => {
  describe('Basic Round-Trip', () => {
    it('should round-trip basic config without data loss', () => {
      const originalYaml = `
settings:
  cache: true
  cache_expiration: 60

plex:
  timeout: 60
  clean_bundles: false

tmdb:
  language: en
  region: US

libraries:
  Movies:
    collection_files:
      - default: imdb
      - default: tmdb
`;

      // Parse the original YAML
      const config = parseKometaYaml(originalYaml);

      // Generate YAML from the config (template mode, no secrets)
      const generatedYaml = generateYaml({ config, mode: 'template', includeComment: false });

      // Parse the generated YAML
      const reparsedConfig = parseKometaYaml(generatedYaml);

      // Compare the configs (should be equivalent)
      expect(reparsedConfig.settings?.cache).toBe(config.settings?.cache);
      expect(reparsedConfig.settings?.cache_expiration).toBe(config.settings?.cache_expiration);
      expect(reparsedConfig.plex?.timeout).toBe(config.plex?.timeout);
      expect(reparsedConfig.plex?.clean_bundles).toBe(config.plex?.clean_bundles);
      expect(reparsedConfig.tmdb?.language).toBe(config.tmdb?.language);
      expect(reparsedConfig.tmdb?.region).toBe(config.tmdb?.region);
      expect(reparsedConfig.libraries?.Movies?.collection_files).toHaveLength(2);
    });

    it('should round-trip config with overlay files', () => {
      const originalYaml = `
libraries:
  Movies:
    overlay_files:
      - default: resolution
        template_variables:
          use_4k: true
          use_1080p: true
      - default: audio_codec
        template_variables:
          use_atmos: true
  TV Shows:
    overlay_files:
      - default: status
        template_variables:
          back_color_airing: "#016920"
`;

      const config = parseKometaYaml(originalYaml);
      const generatedYaml = generateYaml({ config, mode: 'template', includeComment: false });
      const reparsedConfig = parseKometaYaml(generatedYaml);

      expect(reparsedConfig.libraries?.Movies?.overlay_files).toHaveLength(2);
      expect(reparsedConfig.libraries?.['TV Shows']?.overlay_files).toHaveLength(1);
      expect(reparsedConfig.libraries?.Movies?.overlay_files?.[0]?.template_variables?.use_4k).toBe(
        true
      );
    });
  });

  describe('Extras Preservation', () => {
    it('should preserve unknown top-level keys in extras', () => {
      const originalYaml = `
settings:
  cache: true

custom_top_level_key: some_value
another_unknown: 123

libraries:
  Movies:
    collection_files:
      - default: imdb
`;

      const config = parseKometaYaml(originalYaml, true);

      expect(config.extras).toBeDefined();
      expect(config.extras?.custom_top_level_key).toBe('some_value');
      expect(config.extras?.another_unknown).toBe(123);

      // Generate and reparse
      const generatedYaml = generateYaml({ config, mode: 'template', includeComment: false });
      const reparsedConfig = parseKometaYaml(generatedYaml, true);

      expect(reparsedConfig.extras?.custom_top_level_key).toBe('some_value');
      expect(reparsedConfig.extras?.another_unknown).toBe(123);
    });

    it('should preserve unknown settings keys in settings.extras', () => {
      const originalYaml = `
settings:
  cache: true
  cache_expiration: 60
  my_custom_setting: enabled
  experimental_feature: true
`;

      const config = parseKometaYaml(originalYaml, true);

      expect(config.settings?.cache).toBe(true);
      expect(config.settings?.extras?.my_custom_setting).toBe('enabled');
      expect(config.settings?.extras?.experimental_feature).toBe(true);

      // Round-trip
      const generatedYaml = generateYaml({ config, mode: 'template', includeComment: false });
      const reparsedConfig = parseKometaYaml(generatedYaml, true);

      expect(reparsedConfig.settings?.extras?.my_custom_setting).toBe('enabled');
      expect(reparsedConfig.settings?.extras?.experimental_feature).toBe(true);
    });

    it('should preserve unknown library keys in library.extras', () => {
      const originalYaml = `
libraries:
  Movies:
    collection_files:
      - default: imdb
    my_custom_library_option: value
    future_kometa_feature: enabled
`;

      const config = parseKometaYaml(originalYaml, true);

      expect(config.libraries?.Movies?.extras?.my_custom_library_option).toBe('value');
      expect(config.libraries?.Movies?.extras?.future_kometa_feature).toBe('enabled');

      // Round-trip
      const generatedYaml = generateYaml({ config, mode: 'template', includeComment: false });
      const reparsedConfig = parseKometaYaml(generatedYaml, true);

      expect(reparsedConfig.libraries?.Movies?.extras?.my_custom_library_option).toBe('value');
    });

    it('should preserve extras in integration configs', () => {
      const originalYaml = `
plex:
  timeout: 60
  custom_plex_option: test

tmdb:
  language: en
  custom_tmdb_option: value

radarr:
  add_missing: true
  custom_radarr_option: 123
`;

      const config = parseKometaYaml(originalYaml, true);

      expect(config.plex?.extras?.custom_plex_option).toBe('test');
      expect(config.tmdb?.extras?.custom_tmdb_option).toBe('value');
      expect(config.radarr?.extras?.custom_radarr_option).toBe(123);

      // Round-trip
      const generatedYaml = generateYaml({ config, mode: 'template', includeComment: false });
      const reparsedConfig = parseKometaYaml(generatedYaml, true);

      expect(reparsedConfig.plex?.extras?.custom_plex_option).toBe('test');
      expect(reparsedConfig.tmdb?.extras?.custom_tmdb_option).toBe('value');
      expect(reparsedConfig.radarr?.extras?.custom_radarr_option).toBe(123);
    });

    it('should preserve complex nested extras', () => {
      const originalYaml = `
settings:
  cache: true
  complex_unknown:
    nested:
      deeply:
        value: 42
    array:
      - item1
      - item2
`;

      const config = parseKometaYaml(originalYaml, true);

      expect(config.settings?.extras?.complex_unknown).toBeDefined();
      expect((config.settings?.extras?.complex_unknown as any)?.nested?.deeply?.value).toBe(42);
      expect((config.settings?.extras?.complex_unknown as any)?.array).toHaveLength(2);

      // Round-trip
      const generatedYaml = generateYaml({ config, mode: 'template', includeComment: false });
      const reparsedConfig = parseKometaYaml(generatedYaml, true);

      expect((reparsedConfig.settings?.extras?.complex_unknown as any)?.nested?.deeply?.value).toBe(
        42
      );
    });
  });

  describe('Secrets Extraction', () => {
    it('should extract all service secrets correctly', () => {
      const yaml = `
plex:
  url: http://plex.local:32400
  token: plex_token_123
  timeout: 60

tmdb:
  apikey: tmdb_api_key_456
  language: en

tautulli:
  url: http://tautulli.local:8181
  apikey: tautulli_key_789

mdblist:
  apikey: mdblist_key_abc

radarr:
  url: http://radarr.local:7878
  token: radarr_token_def
  add_missing: true

sonarr:
  url: http://sonarr.local:8989
  token: sonarr_token_ghi
  add_missing: false
`;

      const secrets = extractSecretsFromYaml(yaml);

      expect(secrets.plex?.url).toBe('http://plex.local:32400');
      expect(secrets.plex?.token).toBe('plex_token_123');
      expect(secrets.tmdb?.apikey).toBe('tmdb_api_key_456');
      expect(secrets.tautulli?.url).toBe('http://tautulli.local:8181');
      expect(secrets.tautulli?.apikey).toBe('tautulli_key_789');
      expect(secrets.mdblist?.apikey).toBe('mdblist_key_abc');
      expect(secrets.radarr?.url).toBe('http://radarr.local:7878');
      expect(secrets.radarr?.token).toBe('radarr_token_def');
      expect(secrets.sonarr?.url).toBe('http://sonarr.local:8989');
      expect(secrets.sonarr?.token).toBe('sonarr_token_ghi');
    });

    it('should extract Trakt secrets including authorization', () => {
      const yaml = `
trakt:
  client_id: trakt_client_id_123
  client_secret: trakt_client_secret_456
  authorization:
    access_token: access_token_789
    refresh_token: refresh_token_abc
`;

      const secrets = extractSecretsFromYaml(yaml);

      expect(secrets.trakt?.client_secret).toBe('trakt_client_secret_456');
      expect(secrets.trakt?.authorization?.access_token).toBe('access_token_789');
      expect(secrets.trakt?.authorization?.refresh_token).toBe('refresh_token_abc');
    });

    it('should not include secrets in parsed config', () => {
      const yaml = `
plex:
  url: http://plex.local:32400
  token: secret_token
  timeout: 60
`;

      const config = parseKometaYaml(yaml, true);

      // Config should have plex enabled but not contain the secrets
      expect(config.plex?.enabled).toBe(true);
      expect(config.plex?.timeout).toBe(60);
      // Secrets should NOT be in the config (they go to profile)
      expect((config.plex as any)?.url).toBeUndefined();
      expect((config.plex as any)?.token).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings', () => {
      const yaml = `
settings:
  cache: true

libraries:
  Movies:
    collection_files:
      - default: ""
`;

      const config = parseKometaYaml(yaml);
      expect(config.libraries?.Movies?.collection_files?.[0]?.default).toBe('');
    });

    it('should handle special characters in values', () => {
      const yaml = `
libraries:
  Movies:
    collection_files:
      - default: "file with spaces"
      - default: "file/with/slashes"
      - default: "file:with:colons"
`;

      const config = parseKometaYaml(yaml);
      const generatedYaml = generateYaml({ config, mode: 'template', includeComment: false });
      const reparsedConfig = parseKometaYaml(generatedYaml);

      expect(reparsedConfig.libraries?.Movies?.collection_files?.[0]?.default).toBe(
        'file with spaces'
      );
      expect(reparsedConfig.libraries?.Movies?.collection_files?.[1]?.default).toBe(
        'file/with/slashes'
      );
      expect(reparsedConfig.libraries?.Movies?.collection_files?.[2]?.default).toBe(
        'file:with:colons'
      );
    });

    it('should handle Unicode characters', () => {
      const yaml = `
libraries:
  "电影":
    collection_files:
      - default: "日本語"
  "Películas":
    collection_files:
      - default: "español"
`;

      const config = parseKometaYaml(yaml);
      const generatedYaml = generateYaml({ config, mode: 'template', includeComment: false });
      const reparsedConfig = parseKometaYaml(generatedYaml);

      expect(reparsedConfig.libraries?.['电影']).toBeDefined();
      expect(reparsedConfig.libraries?.['电影']?.collection_files?.[0]?.default).toBe('日本語');
      expect(reparsedConfig.libraries?.['Películas']?.collection_files?.[0]?.default).toBe(
        'español'
      );
    });

    it('should handle numeric values', () => {
      const yaml = `
settings:
  cache_expiration: 60
  run_again_delay: 0
  item_refresh_delay: 5

plex:
  timeout: 180
`;

      const config = parseKometaYaml(yaml);
      const generatedYaml = generateYaml({ config, mode: 'template', includeComment: false });
      const reparsedConfig = parseKometaYaml(generatedYaml);

      expect(reparsedConfig.settings?.cache_expiration).toBe(60);
      expect(reparsedConfig.settings?.run_again_delay).toBe(0);
      expect(reparsedConfig.settings?.item_refresh_delay).toBe(5);
      expect(reparsedConfig.plex?.timeout).toBe(180);
    });

    it('should handle boolean values', () => {
      const yaml = `
settings:
  cache: true
  show_missing: false
  save_report: true
  delete_below_minimum: false

plex:
  clean_bundles: true
  empty_trash: false
`;

      const config = parseKometaYaml(yaml);
      const generatedYaml = generateYaml({ config, mode: 'template', includeComment: false });
      const reparsedConfig = parseKometaYaml(generatedYaml);

      expect(reparsedConfig.settings?.cache).toBe(true);
      expect(reparsedConfig.settings?.show_missing).toBe(false);
      expect(reparsedConfig.settings?.save_report).toBe(true);
      expect(reparsedConfig.settings?.delete_below_minimum).toBe(false);
      expect(reparsedConfig.plex?.clean_bundles).toBe(true);
      expect(reparsedConfig.plex?.empty_trash).toBe(false);
    });

    it('should handle null/empty library definitions', () => {
      const yaml = `
libraries:
  Movies:
  "TV Shows":
    collection_files:
      - default: imdb
`;

      const config = parseKometaYaml(yaml);

      // Empty library definitions (null values) are skipped by the parser
      // This is expected behavior - empty definitions have no meaningful content
      expect(config.libraries?.Movies).toBeUndefined();
      expect(config.libraries?.['TV Shows']?.collection_files).toHaveLength(1);
    });

    it('should handle arrays in template_variables', () => {
      const yaml = `
libraries:
  Movies:
    overlay_files:
      - default: ratings
        template_variables:
          rating1: critic
          rating2: audience
          builder_level: movie
          use_rating1: true
          use_rating2: true
`;

      const config = parseKometaYaml(yaml);
      const generatedYaml = generateYaml({ config, mode: 'template', includeComment: false });
      const reparsedConfig = parseKometaYaml(generatedYaml);

      const overlayFile = reparsedConfig.libraries?.Movies?.overlay_files?.[0];
      expect(overlayFile?.template_variables?.rating1).toBe('critic');
      expect(overlayFile?.template_variables?.rating2).toBe('audience');
      expect(overlayFile?.template_variables?.use_rating1).toBe(true);
    });

    it('should handle operations section', () => {
      const yaml = `
libraries:
  Movies:
    operations:
      mass_critic_rating_update: imdb
      mass_audience_rating_update: tmdb
      split_duplicates: true
`;

      const config = parseKometaYaml(yaml);
      const generatedYaml = generateYaml({ config, mode: 'template', includeComment: false });
      const reparsedConfig = parseKometaYaml(generatedYaml);

      expect(reparsedConfig.libraries?.Movies?.operations?.mass_critic_rating_update).toBe('imdb');
      expect(reparsedConfig.libraries?.Movies?.operations?.mass_audience_rating_update).toBe(
        'tmdb'
      );
      expect(reparsedConfig.libraries?.Movies?.operations?.split_duplicates).toBe(true);
    });
  });

  describe('Complex Real-World Configs', () => {
    it('should round-trip a comprehensive movie library config', () => {
      const yaml = `
settings:
  cache: true
  cache_expiration: 60
  asset_directory: /config/assets
  run_again_delay: 2
  missing_only_released: true
  show_unmanaged: true
  show_filtered: false

plex:
  timeout: 60
  clean_bundles: false
  empty_trash: false

tmdb:
  language: en
  region: US
  cache_expiration: 60

libraries:
  Movies:
    template_variables:
      use_separator: false
    collection_files:
      - default: basic
      - default: imdb
        template_variables:
          use_popular: true
          use_top_rated: true
      - default: tmdb
        template_variables:
          use_popular: false
    overlay_files:
      - default: resolution
        template_variables:
          use_4k: true
          use_1080p: true
          use_720p: false
      - default: ratings
        template_variables:
          rating1: critic
          rating2: audience
    operations:
      mass_critic_rating_update: imdb
      mass_audience_rating_update: tmdb
`;

      const config = parseKometaYaml(yaml);
      const generatedYaml = generateYaml({ config, mode: 'template', includeComment: false });
      const reparsedConfig = parseKometaYaml(generatedYaml);

      // Verify settings
      expect(reparsedConfig.settings?.cache).toBe(true);
      expect(reparsedConfig.settings?.cache_expiration).toBe(60);
      expect(reparsedConfig.settings?.asset_directory).toBe('/config/assets');

      // Verify plex
      expect(reparsedConfig.plex?.timeout).toBe(60);
      expect(reparsedConfig.plex?.clean_bundles).toBe(false);

      // Verify tmdb
      expect(reparsedConfig.tmdb?.language).toBe('en');
      expect(reparsedConfig.tmdb?.region).toBe('US');

      // Verify library structure
      expect(reparsedConfig.libraries?.Movies?.collection_files).toHaveLength(3);
      expect(reparsedConfig.libraries?.Movies?.overlay_files).toHaveLength(2);
      expect(reparsedConfig.libraries?.Movies?.operations?.mass_critic_rating_update).toBe('imdb');
    });

    it('should round-trip a multi-library config', () => {
      const yaml = `
libraries:
  Movies:
    collection_files:
      - default: imdb
    overlay_files:
      - default: resolution
  TV Shows:
    collection_files:
      - default: network
    overlay_files:
      - default: status
        template_variables:
          back_color_airing: "#016920"
          back_color_ended: "#000847"
  Anime:
    collection_files:
      - default: myanimelist
    overlay_files:
      - default: ratings
`;

      const config = parseKometaYaml(yaml);
      const generatedYaml = generateYaml({ config, mode: 'template', includeComment: false });
      const reparsedConfig = parseKometaYaml(generatedYaml);

      expect(Object.keys(reparsedConfig.libraries || {})).toHaveLength(3);
      expect(reparsedConfig.libraries?.Movies).toBeDefined();
      expect(reparsedConfig.libraries?.['TV Shows']).toBeDefined();
      expect(reparsedConfig.libraries?.Anime).toBeDefined();

      // Check template variables preserved
      const tvOverlay = reparsedConfig.libraries?.['TV Shows']?.overlay_files?.[0];
      expect(tvOverlay?.template_variables?.back_color_airing).toBe('#016920');
      expect(tvOverlay?.template_variables?.back_color_ended).toBe('#000847');
    });
  });

  describe('Secrets Integration with Generator', () => {
    it('should correctly inject secrets in full mode', () => {
      const originalYaml = `
plex:
  url: http://plex.local:32400
  token: original_token
  timeout: 60

tmdb:
  apikey: original_key
  language: en
`;

      const config = parseKometaYaml(originalYaml);
      const secrets = extractSecretsFromYaml(originalYaml);

      const profile = {
        id: 'test',
        name: 'Test Profile',
        secrets,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const generatedYaml = generateYaml({
        config,
        profile,
        mode: 'full',
        includeComment: false,
      });

      expect(generatedYaml).toContain('original_token');
      expect(generatedYaml).toContain('http://plex.local:32400');
      expect(generatedYaml).toContain('original_key');
    });

    it('should mask secrets in masked mode', () => {
      const originalYaml = `
plex:
  url: http://plex.local:32400
  token: my_secret_token_12345
  timeout: 60
`;

      const config = parseKometaYaml(originalYaml);
      const secrets = extractSecretsFromYaml(originalYaml);

      const profile = {
        id: 'test',
        name: 'Test Profile',
        secrets,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const generatedYaml = generateYaml({
        config,
        profile,
        mode: 'masked',
        includeComment: false,
      });

      expect(generatedYaml).not.toContain('my_secret_token_12345');
      expect(generatedYaml).toContain('****');
      expect(generatedYaml).toContain('http://plex.local:32400');
    });

    it('should exclude secrets in template mode', () => {
      const originalYaml = `
plex:
  url: http://plex.local:32400
  token: secret_token
  timeout: 60

tmdb:
  apikey: secret_key
  language: en
`;

      const config = parseKometaYaml(originalYaml);
      const secrets = extractSecretsFromYaml(originalYaml);

      const profile = {
        id: 'test',
        name: 'Test Profile',
        secrets,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const generatedYaml = generateYaml({
        config,
        profile,
        mode: 'template',
        includeComment: false,
      });

      expect(generatedYaml).not.toContain('secret_token');
      expect(generatedYaml).not.toContain('secret_key');
      expect(generatedYaml).not.toContain('http://plex.local:32400');
    });
  });
});

/**
 * Known Limitations (Documented)
 *
 * 1. YAML Comments: Comments in the original YAML are not preserved.
 *    This is standard behavior for YAML parsers that parse to objects.
 *
 * 2. Key Ordering: The order of keys may change between input and output.
 *    The generator uses a fixed order for consistency:
 *    settings → plex → tmdb → tautulli → mdblist → radarr → sonarr → trakt → libraries
 *
 * 3. Whitespace/Formatting: Exact whitespace and formatting is not preserved.
 *    The generator uses consistent 2-space indentation.
 *
 * 4. Secrets Separation: Secrets are extracted to profiles and not stored in configs.
 *    This is intentional for security - configs can be shared without exposing credentials.
 *
 * 5. Anchors/Aliases: YAML anchors and aliases are resolved during parsing.
 *    They are not preserved in the output.
 */
