import type { KometaConfig } from '../schemas/config.schema.js';
import type { Profile } from '../schemas/profile.schema.js';
import type { ValidationResult, ValidationIssue } from '../schemas/validation.schema.js';

export function validateConfig(config: KometaConfig, profile?: Profile): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  // Check Plex configuration
  if (config.plex?.enabled) {
    if (!profile?.secrets.plex?.url) {
      warnings.push({
        type: 'warning',
        path: ['plex', 'url'],
        message: 'Plex is enabled but no URL is configured in the active profile',
      });
    }
    if (!profile?.secrets.plex?.token) {
      warnings.push({
        type: 'warning',
        path: ['plex', 'token'],
        message: 'Plex is enabled but no token is configured in the active profile',
      });
    }
  }

  // Check TMDB configuration
  if (config.tmdb?.enabled) {
    if (!profile?.secrets.tmdb?.apikey) {
      warnings.push({
        type: 'warning',
        path: ['tmdb', 'apikey'],
        message: 'TMDB is enabled but no API key is configured in the active profile',
      });
    }
  }

  // Check Tautulli configuration
  if (config.tautulli?.enabled) {
    if (!profile?.secrets.tautulli?.url) {
      warnings.push({
        type: 'warning',
        path: ['tautulli', 'url'],
        message: 'Tautulli is enabled but no URL is configured in the active profile',
      });
    }
    if (!profile?.secrets.tautulli?.apikey) {
      warnings.push({
        type: 'warning',
        path: ['tautulli', 'apikey'],
        message: 'Tautulli is enabled but no API key is configured in the active profile',
      });
    }
  }

  // Check MDBList configuration
  if (config.mdblist?.enabled) {
    if (!profile?.secrets.mdblist?.apikey) {
      warnings.push({
        type: 'warning',
        path: ['mdblist', 'apikey'],
        message: 'MDBList is enabled but no API key is configured in the active profile',
      });
    }
  }

  // Check Radarr configuration
  if (config.radarr?.enabled) {
    if (!profile?.secrets.radarr?.url) {
      warnings.push({
        type: 'warning',
        path: ['radarr', 'url'],
        message: 'Radarr is enabled but no URL is configured in the active profile',
      });
    }
    if (!profile?.secrets.radarr?.token) {
      warnings.push({
        type: 'warning',
        path: ['radarr', 'token'],
        message: 'Radarr is enabled but no token is configured in the active profile',
      });
    }
    if (config.radarr.add_missing && !config.radarr.root_folder_path) {
      warnings.push({
        type: 'warning',
        path: ['radarr', 'root_folder_path'],
        message: 'Radarr add_missing is enabled but no root_folder_path is specified',
      });
    }
  }

  // Check Sonarr configuration
  if (config.sonarr?.enabled) {
    if (!profile?.secrets.sonarr?.url) {
      warnings.push({
        type: 'warning',
        path: ['sonarr', 'url'],
        message: 'Sonarr is enabled but no URL is configured in the active profile',
      });
    }
    if (!profile?.secrets.sonarr?.token) {
      warnings.push({
        type: 'warning',
        path: ['sonarr', 'token'],
        message: 'Sonarr is enabled but no token is configured in the active profile',
      });
    }
    if (config.sonarr.add_missing && !config.sonarr.root_folder_path) {
      warnings.push({
        type: 'warning',
        path: ['sonarr', 'root_folder_path'],
        message: 'Sonarr add_missing is enabled but no root_folder_path is specified',
      });
    }
  }

  // Check Trakt configuration
  if (config.trakt?.enabled) {
    if (!config.trakt.client_id) {
      warnings.push({
        type: 'warning',
        path: ['trakt', 'client_id'],
        message: 'Trakt is enabled but no client_id is specified',
      });
    }
    if (!profile?.secrets.trakt?.client_secret) {
      warnings.push({
        type: 'warning',
        path: ['trakt', 'client_secret'],
        message: 'Trakt is enabled but no client_secret is configured in the active profile',
      });
    }
  }

  // Check libraries
  if (config.libraries) {
    Object.entries(config.libraries).forEach(([libraryName, library]) => {
      const hasCollections = library.collection_files && library.collection_files.length > 0;
      const hasOverlays = library.overlay_files && library.overlay_files.length > 0;
      const hasMetadata = library.metadata_files && library.metadata_files.length > 0;

      if (!hasCollections && !hasOverlays && !hasMetadata) {
        warnings.push({
          type: 'warning',
          path: ['libraries', libraryName],
          message: `Library "${libraryName}" has no collection_files, overlay_files, or metadata_files`,
        });
      }
    });
  }

  // Check if there are any libraries at all
  if (!config.libraries || Object.keys(config.libraries).length === 0) {
    warnings.push({
      type: 'warning',
      path: ['libraries'],
      message: 'No libraries are configured',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function maskSecret(secret: string | undefined): string | undefined {
  if (!secret || secret.length < 8) {
    return secret ? '****' : undefined;
  }
  const start = secret.slice(0, 4);
  const end = secret.slice(-4);
  return `${start}****${end}`;
}
