import YAML from 'yaml';
import type { KometaConfig } from '../schemas/config.schema.js';
import { KometaConfigSchema } from '../schemas/config.schema.js';

/**
 * Extracts known keys from an object and puts the rest in extras
 */
function extractWithExtras<T extends Record<string, unknown>>(
  obj: Record<string, unknown>,
  knownKeys: string[],
  secretKeys: string[] = []
): { data: Partial<T>; extras: Record<string, unknown> } {
  const data: Record<string, unknown> = {};
  const extras: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (knownKeys.includes(key)) {
      data[key] = value;
    } else if (!secretKeys.includes(key)) {
      // Only add to extras if it's not a secret key
      extras[key] = value;
    }
    // If it's a secret key, skip it entirely (it will go in the profile)
  }

  return {
    data: data as Partial<T>,
    extras:
      Object.keys(extras).length > 0 ? extras : (undefined as unknown as Record<string, unknown>),
  };
}

/**
 * Parses Kometa YAML and preserves unknown keys in extras fields
 */
export function parseKometaYaml(yamlString: string, preserveExtras = true): KometaConfig {
  const parsed = YAML.parse(yamlString);

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid YAML: expected an object');
  }

  const config: KometaConfig = {};

  // Top-level known keys
  const topLevelKnownKeys = [
    'settings',
    'plex',
    'tmdb',
    'tautulli',
    'mdblist',
    'radarr',
    'sonarr',
    'trakt',
    'libraries',
  ];

  // Settings
  if (parsed.settings) {
    const settingsKnownKeys = [
      'cache',
      'cache_expiration',
      'asset_directory',
      'asset_folders',
      'asset_depth',
      'create_asset_folders',
      'prioritize_assets',
      'dimensional_asset_rename',
      'download_url_assets',
      'show_missing_assets',
      'show_missing_season_assets',
      'show_missing_episode_assets',
      'show_asset_not_needed',
      'sync_mode',
      'default_collection_order',
      'delete_below_minimum',
      'delete_not_scheduled',
      'run_again_delay',
      'missing_only_released',
      'show_unmanaged',
      'show_filtered',
      'show_options',
      'show_missing',
      'only_filter_missing',
      'save_report',
      'tvdb_language',
      'ignore_ids',
      'ignore_imdb_ids',
      'item_refresh_delay',
      'playlist_sync_to_users',
      'playlist_exclude_users',
      'playlist_report',
      'verify_ssl',
      'custom_repo',
      'check_nightly',
      'run_order',
    ];

    const { data, extras } = extractWithExtras(parsed.settings, settingsKnownKeys);
    config.settings = preserveExtras ? { ...data, extras } : data;
  }

  // Plex
  if (parsed.plex) {
    const plexKnownKeys = ['timeout', 'clean_bundles', 'empty_trash', 'optimize'];
    const plexSecretKeys = ['url', 'token'];
    const { data, extras } = extractWithExtras(parsed.plex, plexKnownKeys, plexSecretKeys);
    config.plex = preserveExtras ? { enabled: true, ...data, extras } : { enabled: true, ...data };
  }

  // TMDB
  if (parsed.tmdb) {
    const tmdbKnownKeys = ['cache_expiration', 'language', 'region'];
    const tmdbSecretKeys = ['apikey'];
    const { data, extras } = extractWithExtras(parsed.tmdb, tmdbKnownKeys, tmdbSecretKeys);
    config.tmdb = preserveExtras ? { enabled: true, ...data, extras } : { enabled: true, ...data };
  }

  // Tautulli
  if (parsed.tautulli) {
    const tautulliKnownKeys: string[] = [];
    const tautulliSecretKeys = ['url', 'apikey'];
    const { data, extras } = extractWithExtras(
      parsed.tautulli,
      tautulliKnownKeys,
      tautulliSecretKeys
    );
    config.tautulli = preserveExtras
      ? { enabled: true, ...data, extras }
      : { enabled: true, ...data };
  }

  // MDBList
  if (parsed.mdblist) {
    const mdblistKnownKeys = ['cache_expiration'];
    const mdblistSecretKeys = ['apikey'];
    const { data, extras } = extractWithExtras(parsed.mdblist, mdblistKnownKeys, mdblistSecretKeys);
    config.mdblist = preserveExtras
      ? { enabled: true, ...data, extras }
      : { enabled: true, ...data };
  }

  // Radarr
  if (parsed.radarr) {
    const radarrKnownKeys = [
      'add_missing',
      'add_existing',
      'upgrade_existing',
      'monitor_existing',
      'ignore_cache',
      'root_folder_path',
      'monitor',
      'availability',
      'quality_profile',
      'tag',
      'search',
    ];
    const radarrSecretKeys = ['url', 'token'];
    const { data, extras } = extractWithExtras(parsed.radarr, radarrKnownKeys, radarrSecretKeys);
    config.radarr = preserveExtras
      ? { enabled: true, ...data, extras }
      : { enabled: true, ...data };
  }

  // Sonarr
  if (parsed.sonarr) {
    const sonarrKnownKeys = [
      'add_missing',
      'add_existing',
      'upgrade_existing',
      'monitor_existing',
      'ignore_cache',
      'root_folder_path',
      'monitor',
      'quality_profile',
      'language_profile',
      'series_type',
      'season_folder',
      'tag',
      'search',
      'cutoff_search',
    ];
    const sonarrSecretKeys = ['url', 'token'];
    const { data, extras } = extractWithExtras(parsed.sonarr, sonarrKnownKeys, sonarrSecretKeys);
    config.sonarr = preserveExtras
      ? { enabled: true, ...data, extras }
      : { enabled: true, ...data };
  }

  // Trakt
  if (parsed.trakt) {
    const traktKnownKeys = ['client_id'];
    const traktSecretKeys = ['client_secret', 'authorization'];
    const { data, extras } = extractWithExtras(parsed.trakt, traktKnownKeys, traktSecretKeys);
    config.trakt = preserveExtras ? { enabled: true, ...data, extras } : { enabled: true, ...data };
  }

  // Libraries
  if (parsed.libraries) {
    config.libraries = {};
    const libraryKnownKeys = [
      'library_name',
      'template_variables',
      'schedule',
      'run_order',
      'filters',
      'collection_files',
      'overlay_files',
      'metadata_files',
      'operations',
      'settings',
    ];

    for (const [libraryName, libraryConfig] of Object.entries(parsed.libraries)) {
      if (typeof libraryConfig !== 'object' || !libraryConfig) continue;

      const { data, extras } = extractWithExtras(
        libraryConfig as Record<string, unknown>,
        libraryKnownKeys
      );
      config.libraries[libraryName] = preserveExtras ? { ...data, extras } : data;
    }
  }

  // Top-level extras
  if (preserveExtras) {
    const { extras } = extractWithExtras(parsed, topLevelKnownKeys);
    if (extras) {
      config.extras = extras;
    }
  }

  // Validate against schema
  const result = KometaConfigSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Invalid configuration: ${result.error.message}`);
  }

  return config;
}

/**
 * Extracts secrets from parsed YAML to create a profile
 */
export function extractSecretsFromYaml(yamlString: string): {
  plex?: { url?: string; token?: string };
  tmdb?: { apikey?: string };
  tautulli?: { url?: string; apikey?: string };
  mdblist?: { apikey?: string };
  radarr?: { url?: string; token?: string };
  sonarr?: { url?: string; token?: string };
  trakt?: {
    client_secret?: string;
    authorization?: { access_token?: string; refresh_token?: string };
  };
} {
  const parsed = YAML.parse(yamlString);

  if (!parsed || typeof parsed !== 'object') {
    return {};
  }

  const secrets: Record<string, unknown> = {};

  // Extract Plex secrets
  if (parsed.plex) {
    secrets.plex = {};
    if (parsed.plex.url) (secrets.plex as Record<string, string>).url = parsed.plex.url;
    if (parsed.plex.token) (secrets.plex as Record<string, string>).token = parsed.plex.token;
  }

  // Extract TMDB secrets
  if (parsed.tmdb?.apikey) {
    secrets.tmdb = { apikey: parsed.tmdb.apikey };
  }

  // Extract Tautulli secrets
  if (parsed.tautulli) {
    secrets.tautulli = {};
    if (parsed.tautulli.url) (secrets.tautulli as Record<string, string>).url = parsed.tautulli.url;
    if (parsed.tautulli.apikey)
      (secrets.tautulli as Record<string, string>).apikey = parsed.tautulli.apikey;
  }

  // Extract MDBList secrets
  if (parsed.mdblist?.apikey) {
    secrets.mdblist = { apikey: parsed.mdblist.apikey };
  }

  // Extract Radarr secrets
  if (parsed.radarr) {
    secrets.radarr = {};
    if (parsed.radarr.url) (secrets.radarr as Record<string, string>).url = parsed.radarr.url;
    if (parsed.radarr.token) (secrets.radarr as Record<string, string>).token = parsed.radarr.token;
  }

  // Extract Sonarr secrets
  if (parsed.sonarr) {
    secrets.sonarr = {};
    if (parsed.sonarr.url) (secrets.sonarr as Record<string, string>).url = parsed.sonarr.url;
    if (parsed.sonarr.token) (secrets.sonarr as Record<string, string>).token = parsed.sonarr.token;
  }

  // Extract Trakt secrets
  if (parsed.trakt) {
    secrets.trakt = {};
    if (parsed.trakt.client_secret)
      (secrets.trakt as Record<string, unknown>).client_secret = parsed.trakt.client_secret;
    if (parsed.trakt.authorization) {
      (secrets.trakt as Record<string, unknown>).authorization = {
        access_token: parsed.trakt.authorization.access_token,
        refresh_token: parsed.trakt.authorization.refresh_token,
      };
    }
  }

  return secrets;
}
