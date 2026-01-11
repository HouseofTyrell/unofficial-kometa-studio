import YAML from 'yaml';
import type { KometaConfig } from '@kometa-studio/shared';
import { KometaConfigSchema } from '@kometa-studio/shared';

/**
 * Extracts known keys from an object and puts the rest in extras
 */
function extractWithExtras<T extends Record<string, any>>(
  obj: Record<string, any>,
  knownKeys: string[]
): { data: Partial<T>; extras: Record<string, unknown> } {
  const data: any = {};
  const extras: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (knownKeys.includes(key)) {
      data[key] = value;
    } else {
      extras[key] = value;
    }
  }

  return { data, extras: Object.keys(extras).length > 0 ? extras : undefined as any };
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
    const { data, extras } = extractWithExtras(parsed.plex, plexKnownKeys);
    config.plex = preserveExtras ? { enabled: true, ...data, extras } : { enabled: true, ...data };
  }

  // TMDB
  if (parsed.tmdb) {
    const tmdbKnownKeys = ['cache_expiration', 'language', 'region'];
    const { data, extras } = extractWithExtras(parsed.tmdb, tmdbKnownKeys);
    config.tmdb = preserveExtras ? { enabled: true, ...data, extras } : { enabled: true, ...data };
  }

  // Tautulli
  if (parsed.tautulli) {
    const tautulliKnownKeys: string[] = [];
    const { data, extras } = extractWithExtras(parsed.tautulli, tautulliKnownKeys);
    config.tautulli = preserveExtras ? { enabled: true, ...data, extras } : { enabled: true, ...data };
  }

  // MDBList
  if (parsed.mdblist) {
    const mdblistKnownKeys = ['cache_expiration'];
    const { data, extras } = extractWithExtras(parsed.mdblist, mdblistKnownKeys);
    config.mdblist = preserveExtras ? { enabled: true, ...data, extras } : { enabled: true, ...data };
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
    const { data, extras } = extractWithExtras(parsed.radarr, radarrKnownKeys);
    config.radarr = preserveExtras ? { enabled: true, ...data, extras } : { enabled: true, ...data };
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
    const { data, extras } = extractWithExtras(parsed.sonarr, sonarrKnownKeys);
    config.sonarr = preserveExtras ? { enabled: true, ...data, extras } : { enabled: true, ...data };
  }

  // Trakt
  if (parsed.trakt) {
    const traktKnownKeys = ['client_id'];
    const { data, extras } = extractWithExtras(parsed.trakt, traktKnownKeys);
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

      const { data, extras } = extractWithExtras(libraryConfig as Record<string, any>, libraryKnownKeys);
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
