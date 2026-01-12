import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import styles from './ConfigEditorPage.module.css';
import { configApi, profileApi } from '../api/client';
import { LibrariesEditor } from '../components/editors/LibrariesEditor';
import { SettingsEditor } from '../components/editors/SettingsEditor';
import { IntegrationsEditor } from '../components/editors/IntegrationsEditor';
import {
  ValidationPanel,
  ValidationTabBadge,
  ValidationResult,
  ValidationIssue,
} from '../components/validation/ValidationPanel';

type EditorSection = 'settings' | 'libraries' | 'integrations';

// Client-side validation function (mirrors the shared validator)
function validateConfig(config: any, profile?: any): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  // Check Plex configuration
  if (config.plex?.enabled !== false) {
    if (!profile?.secrets?.plex?.url) {
      warnings.push({
        type: 'warning',
        path: ['plex', 'url'],
        message: 'Plex URL is not configured in the active profile',
      });
    }
    if (!profile?.secrets?.plex?.token) {
      warnings.push({
        type: 'warning',
        path: ['plex', 'token'],
        message: 'Plex token is not configured in the active profile',
      });
    }
  }

  // Check TMDB configuration
  if (config.tmdb?.enabled !== false) {
    if (!profile?.secrets?.tmdb?.apikey) {
      warnings.push({
        type: 'warning',
        path: ['tmdb', 'apikey'],
        message: 'TMDB API key is not configured in the active profile',
      });
    }
  }

  // Check Tautulli configuration
  if (config.tautulli?.enabled) {
    if (!profile?.secrets?.tautulli?.url) {
      warnings.push({
        type: 'warning',
        path: ['tautulli', 'url'],
        message: 'Tautulli is enabled but no URL is configured',
      });
    }
    if (!profile?.secrets?.tautulli?.apikey) {
      warnings.push({
        type: 'warning',
        path: ['tautulli', 'apikey'],
        message: 'Tautulli is enabled but no API key is configured',
      });
    }
  }

  // Check MDBList configuration
  if (config.mdblist?.enabled) {
    if (!profile?.secrets?.mdblist?.apikey) {
      warnings.push({
        type: 'warning',
        path: ['mdblist', 'apikey'],
        message: 'MDBList is enabled but no API key is configured',
      });
    }
  }

  // Check Radarr configuration
  if (config.radarr?.enabled) {
    if (!profile?.secrets?.radarr?.url) {
      warnings.push({
        type: 'warning',
        path: ['radarr', 'url'],
        message: 'Radarr is enabled but no URL is configured',
      });
    }
    if (!profile?.secrets?.radarr?.token) {
      warnings.push({
        type: 'warning',
        path: ['radarr', 'token'],
        message: 'Radarr is enabled but no token is configured',
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
    if (!profile?.secrets?.sonarr?.url) {
      warnings.push({
        type: 'warning',
        path: ['sonarr', 'url'],
        message: 'Sonarr is enabled but no URL is configured',
      });
    }
    if (!profile?.secrets?.sonarr?.token) {
      warnings.push({
        type: 'warning',
        path: ['sonarr', 'token'],
        message: 'Sonarr is enabled but no token is configured',
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
    if (!profile?.secrets?.trakt?.client_secret) {
      warnings.push({
        type: 'warning',
        path: ['trakt', 'client_secret'],
        message: 'Trakt is enabled but no client_secret is configured',
      });
    }
  }

  // Check libraries
  if (config.libraries) {
    Object.entries(config.libraries).forEach(([libraryName, library]: [string, any]) => {
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

export function ConfigEditorPage() {
  const { configId } = useParams<{ configId: string }>();
  const [config, setConfig] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<EditorSection>('libraries');
  const [saving, setSaving] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  // Run validation when config or profile changes
  const runValidation = useCallback(() => {
    if (config?.config) {
      const result = validateConfig(config.config, profile);
      setValidation(result);
    }
  }, [config, profile]);

  useEffect(() => {
    if (configId) {
      loadConfig();
      loadActiveProfile();
    }
  }, [configId]);

  // Re-run validation when config or profile changes
  useEffect(() => {
    runValidation();
  }, [runValidation]);

  const loadConfig = async () => {
    if (!configId) return;

    setLoading(true);
    try {
      const configData = await configApi.get(configId);
      setConfig(configData);
    } catch (error) {
      console.error('Failed to load config:', error);
      alert('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const loadActiveProfile = async () => {
    try {
      const { profiles } = await profileApi.list();
      if (profiles.length > 0) {
        const activeProfile = await profileApi.get(profiles[0].id);
        setProfile(activeProfile);
      }
    } catch (error) {
      console.error('Failed to load profile for validation:', error);
    }
  };

  const saveConfig = async (updatedConfig: any) => {
    if (!configId) return;

    setSaving(true);
    try {
      const saved = await configApi.update(configId, { config: updatedConfig });
      setConfig(saved);
    } catch (error) {
      console.error('Failed to save config:', error);
      alert('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleConfigChange = (updates: any) => {
    const updatedConfig = {
      ...config,
      config: {
        ...config.config,
        ...updates,
      },
    };
    setConfig(updatedConfig);
    saveConfig(updatedConfig.config);
  };

  // Handle clicking on a validation issue to navigate to the relevant section
  const handleIssueClick = (issue: ValidationIssue) => {
    const rootPath = issue.path[0]?.toLowerCase();
    if (rootPath === 'settings') {
      setActiveSection('settings');
    } else if (rootPath === 'libraries') {
      setActiveSection('libraries');
    } else if (
      ['plex', 'tmdb', 'tautulli', 'mdblist', 'radarr', 'sonarr', 'trakt'].includes(rootPath)
    ) {
      setActiveSection('integrations');
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading configuration...</div>;
  }

  if (!config) {
    return <div className={styles.error}>Configuration not found</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.title}>{config.name}</h1>
            {config.description && <p className={styles.description}>{config.description}</p>}
          </div>
          <div className={styles.headerActions}>
            {saving && <span className={styles.savingIndicator}>Saving...</span>}
          </div>
        </div>

        {/* Validation Panel */}
        <div className={styles.validationSection}>
          <ValidationPanel validation={validation} onIssueClick={handleIssueClick} />
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeSection === 'settings' ? styles.active : ''}`}
          onClick={() => setActiveSection('settings')}
        >
          Settings
          <ValidationTabBadge section="settings" validation={validation} />
        </button>
        <button
          className={`${styles.tab} ${activeSection === 'libraries' ? styles.active : ''}`}
          onClick={() => setActiveSection('libraries')}
        >
          Libraries
          <ValidationTabBadge section="libraries" validation={validation} />
        </button>
        <button
          className={`${styles.tab} ${activeSection === 'integrations' ? styles.active : ''}`}
          onClick={() => setActiveSection('integrations')}
        >
          Integrations
          <ValidationTabBadge section="integrations" validation={validation} />
        </button>
      </div>

      <div className={styles.content}>
        {activeSection === 'settings' && (
          <SettingsEditor
            settings={config.config.settings || {}}
            onChange={(settings) => handleConfigChange({ settings })}
          />
        )}
        {activeSection === 'libraries' && (
          <LibrariesEditor
            libraries={config.config.libraries || {}}
            onChange={(libraries) => handleConfigChange({ libraries })}
          />
        )}
        {activeSection === 'integrations' && (
          <IntegrationsEditor config={config.config} onChange={handleConfigChange} />
        )}
      </div>
    </div>
  );
}
