import YAML from 'yaml';
import type { KometaConfig } from '@kometa-studio/shared';
import type { ProfileRecord } from '../db/profile.repository.js';
import { maskSecret } from '@kometa-studio/shared';

export type YamlMode = 'template' | 'masked' | 'full';

interface GenerateOptions {
  config: KometaConfig;
  profile?: ProfileRecord;
  mode: YamlMode;
  includeComment?: boolean;
}

/**
 * Merges config extras into the main object
 */
function mergeExtras<T extends Record<string, unknown>>(
  obj: T,
  extras?: Record<string, unknown>
): T & Record<string, unknown> {
  if (!extras) return obj;
  return { ...obj, ...extras };
}

/**
 * Generates a complete Kometa YAML from config and profile
 */
export function generateYaml(options: GenerateOptions): string {
  const { config, profile, mode, includeComment = true } = options;

  // Build the output object in the correct order
  const output: Record<string, unknown> = {};

  // Settings
  if (config.settings) {
    output.settings = mergeExtras(
      { ...config.settings, extras: undefined },
      config.settings.extras
    );
  }

  // Plex
  if (config.plex && config.plex.enabled !== false) {
    const plexConfig: Record<string, unknown> = { ...config.plex, enabled: undefined };
    delete plexConfig.extras;

    if (mode !== 'template' && profile?.secrets.plex) {
      if (profile.secrets.plex.url) {
        plexConfig.url = profile.secrets.plex.url;
      }
      if (profile.secrets.plex.token) {
        plexConfig.token =
          mode === 'masked' ? maskSecret(profile.secrets.plex.token) : profile.secrets.plex.token;
      }
    }

    output.plex = mergeExtras(plexConfig, config.plex.extras);
  }

  // TMDB
  if (config.tmdb && config.tmdb.enabled !== false) {
    const tmdbConfig: Record<string, unknown> = { ...config.tmdb, enabled: undefined };
    delete tmdbConfig.extras;

    if (mode !== 'template' && profile?.secrets.tmdb?.apikey) {
      tmdbConfig.apikey =
        mode === 'masked' ? maskSecret(profile.secrets.tmdb.apikey) : profile.secrets.tmdb.apikey;
    }

    output.tmdb = mergeExtras(tmdbConfig, config.tmdb.extras);
  }

  // Tautulli
  if (config.tautulli?.enabled) {
    const tautulliConfig: Record<string, unknown> = { ...config.tautulli, enabled: undefined };
    delete tautulliConfig.extras;

    if (mode !== 'template' && profile?.secrets.tautulli) {
      if (profile.secrets.tautulli.url) {
        tautulliConfig.url = profile.secrets.tautulli.url;
      }
      if (profile.secrets.tautulli.apikey) {
        tautulliConfig.apikey =
          mode === 'masked'
            ? maskSecret(profile.secrets.tautulli.apikey)
            : profile.secrets.tautulli.apikey;
      }
    }

    output.tautulli = mergeExtras(tautulliConfig, config.tautulli.extras);
  }

  // MDBList
  if (config.mdblist?.enabled) {
    const mdblistConfig: Record<string, unknown> = { ...config.mdblist, enabled: undefined };
    delete mdblistConfig.extras;

    if (mode !== 'template' && profile?.secrets.mdblist?.apikey) {
      mdblistConfig.apikey =
        mode === 'masked'
          ? maskSecret(profile.secrets.mdblist.apikey)
          : profile.secrets.mdblist.apikey;
    }

    output.mdblist = mergeExtras(mdblistConfig, config.mdblist.extras);
  }

  // Radarr
  if (config.radarr?.enabled) {
    const radarrConfig: Record<string, unknown> = { ...config.radarr, enabled: undefined };
    delete radarrConfig.extras;

    if (mode !== 'template' && profile?.secrets.radarr) {
      if (profile.secrets.radarr.url) {
        radarrConfig.url = profile.secrets.radarr.url;
      }
      if (profile.secrets.radarr.token) {
        radarrConfig.token =
          mode === 'masked'
            ? maskSecret(profile.secrets.radarr.token)
            : profile.secrets.radarr.token;
      }
    }

    output.radarr = mergeExtras(radarrConfig, config.radarr.extras);
  }

  // Sonarr
  if (config.sonarr?.enabled) {
    const sonarrConfig: Record<string, unknown> = { ...config.sonarr, enabled: undefined };
    delete sonarrConfig.extras;

    if (mode !== 'template' && profile?.secrets.sonarr) {
      if (profile.secrets.sonarr.url) {
        sonarrConfig.url = profile.secrets.sonarr.url;
      }
      if (profile.secrets.sonarr.token) {
        sonarrConfig.token =
          mode === 'masked'
            ? maskSecret(profile.secrets.sonarr.token)
            : profile.secrets.sonarr.token;
      }
    }

    output.sonarr = mergeExtras(sonarrConfig, config.sonarr.extras);
  }

  // Trakt
  if (config.trakt?.enabled) {
    const traktConfig: Record<string, unknown> = { ...config.trakt, enabled: undefined };
    delete traktConfig.extras;

    if (mode !== 'template' && profile?.secrets.trakt) {
      if (profile.secrets.trakt.client_secret) {
        traktConfig.client_secret =
          mode === 'masked'
            ? maskSecret(profile.secrets.trakt.client_secret)
            : profile.secrets.trakt.client_secret;
      }
      if (profile.secrets.trakt.authorization) {
        traktConfig.authorization = {
          access_token:
            mode === 'masked'
              ? maskSecret(profile.secrets.trakt.authorization.access_token || '')
              : profile.secrets.trakt.authorization.access_token,
          refresh_token:
            mode === 'masked'
              ? maskSecret(profile.secrets.trakt.authorization.refresh_token || '')
              : profile.secrets.trakt.authorization.refresh_token,
        };
      }
    }

    output.trakt = mergeExtras(traktConfig, config.trakt.extras);
  }

  // Libraries
  if (config.libraries) {
    output.libraries = {};
    for (const [libraryName, library] of Object.entries(config.libraries)) {
      const libraryConfig: Record<string, unknown> = {};

      if (library.template_variables) {
        libraryConfig.template_variables = library.template_variables;
      }
      if (library.schedule) {
        libraryConfig.schedule = library.schedule;
      }
      if (library.run_order) {
        libraryConfig.run_order = library.run_order;
      }
      if (library.filters) {
        libraryConfig.filters = library.filters;
      }
      if (library.collection_files) {
        libraryConfig.collection_files = library.collection_files;
      }
      if (library.overlay_files) {
        libraryConfig.overlay_files = library.overlay_files;
      }
      if (library.metadata_files) {
        libraryConfig.metadata_files = library.metadata_files;
      }
      if (library.operations) {
        libraryConfig.operations = library.operations;
      }
      if (library.settings) {
        libraryConfig.settings = library.settings;
      }

      output.libraries[libraryName] = mergeExtras(libraryConfig, library.extras);
    }
  }

  // Add root-level extras
  const finalOutput = mergeExtras(output, config.extras);

  // Generate YAML
  let yamlStr = YAML.stringify(finalOutput, {
    indent: 2,
    lineWidth: 0,
    minContentWidth: 0,
  });

  // Add comment at the top
  if (includeComment) {
    const comment =
      mode === 'template'
        ? '# Kometa Configuration Template (no secrets)\n# Generated by Kometa Studio\n\n'
        : mode === 'masked'
          ? '# Kometa Configuration (secrets masked)\n# Generated by Kometa Studio\n\n'
          : '# Kometa Configuration\n# Generated by Kometa Studio\n# WARNING: This file contains secrets!\n\n';
    yamlStr = comment + yamlStr;
  }

  return yamlStr;
}
