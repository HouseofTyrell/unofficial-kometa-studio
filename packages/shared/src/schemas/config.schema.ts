import { z } from 'zod';

// Settings schema
export const SettingsSchema = z.object({
  cache: z.boolean().optional(),
  cache_expiration: z.number().optional(),
  asset_directory: z.union([z.string(), z.array(z.string())]).optional(),
  asset_folders: z.boolean().optional(),
  asset_depth: z.number().optional(),
  create_asset_folders: z.boolean().optional(),
  prioritize_assets: z.boolean().optional(),
  dimensional_asset_rename: z.boolean().optional(),
  download_url_assets: z.boolean().optional(),
  show_missing_assets: z.boolean().optional(),
  show_missing_season_assets: z.boolean().optional(),
  show_missing_episode_assets: z.boolean().optional(),
  show_asset_not_needed: z.boolean().optional(),
  sync_mode: z.enum(['append', 'sync']).optional(),
  default_collection_order: z.string().optional(),
  delete_below_minimum: z.boolean().optional(),
  delete_not_scheduled: z.boolean().optional(),
  run_again_delay: z.number().optional(),
  missing_only_released: z.boolean().optional(),
  show_unmanaged: z.boolean().optional(),
  show_filtered: z.boolean().optional(),
  show_options: z.boolean().optional(),
  show_missing: z.boolean().optional(),
  only_filter_missing: z.boolean().optional(),
  save_report: z.boolean().optional(),
  tvdb_language: z.string().optional(),
  ignore_ids: z.array(z.string()).optional().nullable(),
  ignore_imdb_ids: z.array(z.string()).optional().nullable(),
  item_refresh_delay: z.number().optional(),
  playlist_sync_to_users: z.enum(['all', 'none']).or(z.array(z.string())).optional().nullable(),
  playlist_exclude_users: z.array(z.string()).optional().nullable(),
  playlist_report: z.boolean().optional(),
  verify_ssl: z.boolean().optional(),
  custom_repo: z.string().optional().nullable(),
  check_nightly: z.boolean().optional(),
  run_order: z.array(z.string()).optional(),
  // Allow arbitrary additional keys
  extras: z.record(z.unknown()).optional(),
}).passthrough();

// Template variables - flexible key-value pairs
export const TemplateVariablesSchema = z.record(z.unknown());

// Filters schema
export const FiltersSchema = z.record(z.unknown());

// Collection/Overlay file entry
export const FileEntrySchema = z.union([
  // Simple file reference
  z.object({
    file: z.string(),
    template_variables: TemplateVariablesSchema.optional(),
  }),
  // Default reference with template variables
  z.object({
    default: z.string(),
    template_variables: TemplateVariablesSchema.optional(),
  }),
  // Git reference
  z.object({
    git: z.string(),
    template_variables: TemplateVariablesSchema.optional(),
  }),
  // URL reference
  z.object({
    url: z.string(),
    template_variables: TemplateVariablesSchema.optional(),
  }),
  // Repo reference
  z.object({
    repo: z.string(),
    template_variables: TemplateVariablesSchema.optional(),
  }),
]);

// Library schema
export const LibrarySchema = z.object({
  library_name: z.string().optional(),
  template_variables: TemplateVariablesSchema.optional(),
  schedule: z.string().optional(),
  run_order: z.array(z.string()).optional(),
  filters: FiltersSchema.optional(),
  collection_files: z.array(FileEntrySchema).optional(),
  overlay_files: z.array(FileEntrySchema).optional(),
  operations: z.record(z.unknown()).optional(),
  settings: z.record(z.unknown()).optional(),
  metadata_files: z.array(FileEntrySchema).optional(),
  // Allow arbitrary additional keys
  extras: z.record(z.unknown()).optional(),
});

// Libraries - map of library name to library config
export const LibrariesSchema = z.record(LibrarySchema);

// Integration schemas (non-secret parts)
export const PlexConfigSchema = z.object({
  enabled: z.boolean().default(true),
  timeout: z.number().optional(),
  clean_bundles: z.boolean().optional(),
  empty_trash: z.boolean().optional(),
  optimize: z.boolean().optional(),
  extras: z.record(z.unknown()).optional(),
});

export const TmdbConfigSchema = z.object({
  enabled: z.boolean().default(true),
  cache_expiration: z.number().optional(),
  language: z.string().optional(),
  region: z.string().optional(),
  extras: z.record(z.unknown()).optional(),
});

export const TautulliConfigSchema = z.object({
  enabled: z.boolean().default(false),
  extras: z.record(z.unknown()).optional(),
});

export const MdbListConfigSchema = z.object({
  enabled: z.boolean().default(false),
  cache_expiration: z.number().optional(),
  extras: z.record(z.unknown()).optional(),
});

export const RadarrConfigSchema = z.object({
  enabled: z.boolean().default(false),
  add_missing: z.boolean().optional(),
  add_existing: z.boolean().optional(),
  upgrade_existing: z.boolean().optional(),
  monitor_existing: z.boolean().optional(),
  ignore_cache: z.boolean().optional(),
  root_folder_path: z.string().optional(),
  monitor: z.boolean().optional(),
  availability: z.enum(['announced', 'cinemas', 'released', 'db']).optional(),
  quality_profile: z.string().optional(),
  tag: z.array(z.string()).optional().nullable(),
  search: z.boolean().optional(),
  extras: z.record(z.unknown()).optional(),
});

export const SonarrConfigSchema = z.object({
  enabled: z.boolean().default(false),
  add_missing: z.boolean().optional(),
  add_existing: z.boolean().optional(),
  upgrade_existing: z.boolean().optional(),
  monitor_existing: z.boolean().optional(),
  ignore_cache: z.boolean().optional(),
  root_folder_path: z.string().optional(),
  monitor: z.enum(['all', 'future', 'missing', 'existing', 'pilot', 'first', 'latest', 'none']).optional(),
  quality_profile: z.string().optional(),
  language_profile: z.string().optional(),
  series_type: z.enum(['standard', 'daily', 'anime']).optional(),
  season_folder: z.boolean().optional(),
  tag: z.array(z.string()).optional().nullable(),
  search: z.boolean().optional(),
  cutoff_search: z.boolean().optional(),
  extras: z.record(z.unknown()).optional(),
});

export const TraktConfigSchema = z.object({
  enabled: z.boolean().default(false),
  client_id: z.string().optional(),
  extras: z.record(z.unknown()).optional(),
});

// Main config schema (no secrets)
export const KometaConfigSchema = z.object({
  settings: SettingsSchema.optional(),
  libraries: LibrariesSchema.optional(),
  plex: PlexConfigSchema.optional(),
  tmdb: TmdbConfigSchema.optional(),
  tautulli: TautulliConfigSchema.optional(),
  mdblist: MdbListConfigSchema.optional(),
  radarr: RadarrConfigSchema.optional(),
  sonarr: SonarrConfigSchema.optional(),
  trakt: TraktConfigSchema.optional(),
  // Root-level extras for unknown top-level keys
  extras: z.record(z.unknown()).optional(),
});

export type KometaConfig = z.infer<typeof KometaConfigSchema>;
export type Settings = z.infer<typeof SettingsSchema>;
export type Library = z.infer<typeof LibrarySchema>;
export type FileEntry = z.infer<typeof FileEntrySchema>;
export type TemplateVariables = z.infer<typeof TemplateVariablesSchema>;
export type Filters = z.infer<typeof FiltersSchema>;
