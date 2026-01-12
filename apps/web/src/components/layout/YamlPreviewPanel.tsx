import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './YamlPreviewPanel.module.css';
import { configApi, profileApi } from '../../api/client';

type YamlMode = 'template' | 'masked' | 'full';

export function YamlPreviewPanel() {
  const location = useLocation();
  // Extract configId from pathname: /config/:configId
  const configId = location.pathname.startsWith('/config/')
    ? location.pathname.split('/')[2]
    : undefined;
  const [yaml, setYaml] = useState('');
  const [mode, setMode] = useState<YamlMode>('masked');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [validation, setValidation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showValidation, setShowValidation] = useState(true);

  const loadProfiles = useCallback(async () => {
    try {
      const { profiles: profileList } = await profileApi.list();
      setProfiles(profileList);
      // Only auto-select first profile if no profile is currently selected
      if (profileList.length > 0 && !selectedProfile) {
        setSelectedProfile(profileList[0].id);
      }
    } catch (error) {
      console.error('Failed to load profiles:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- selectedProfile intentionally excluded to avoid re-fetching
  }, []);

  const loadYaml = useCallback(async () => {
    if (!configId) return;

    setLoading(true);
    try {
      const { yaml: yamlContent } = await configApi.renderYaml(
        configId,
        selectedProfile || undefined,
        mode
      );
      setYaml(yamlContent);
    } catch (error) {
      console.error('Failed to load YAML:', error);
      setYaml('# Error loading YAML\n' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [configId, selectedProfile, mode]);

  const loadValidation = useCallback(async () => {
    if (!configId) return;

    try {
      const result = await configApi.validate(configId, selectedProfile || undefined);
      setValidation(result);
    } catch (error) {
      console.error('Failed to validate:', error);
    }
  }, [configId, selectedProfile]);

  // Load profiles when component mounts or when navigating
  useEffect(() => {
    loadProfiles();
  }, [loadProfiles, location.pathname]);

  // Auto-select profile from navigation state (e.g., after import)
  useEffect(() => {
    const state = location.state as { profileId?: string } | null;
    if (state?.profileId && profiles.length > 0) {
      setSelectedProfile(state.profileId);
    }
  }, [location.state, profiles]);

  useEffect(() => {
    if (configId) {
      loadYaml();
      loadValidation();
    } else {
      setYaml('');
      setValidation(null);
    }
  }, [configId, loadYaml, loadValidation]);

  const handleCopy = () => {
    navigator.clipboard.writeText(yaml);
  };

  const handleDownload = () => {
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.yml';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!configId) {
    return (
      <div className={styles.panel}>
        <div className={styles.emptyState}>Select a configuration to preview</div>
      </div>
    );
  }

  const hasErrors = validation?.errors?.length > 0;
  const hasWarnings = validation?.warnings?.length > 0;

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <select
          value={selectedProfile}
          onChange={(e) => setSelectedProfile(e.target.value)}
          className={styles.select}
        >
          <option value="">No Profile</option>
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name}
            </option>
          ))}
        </select>

        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as YamlMode)}
          className={styles.select}
        >
          <option value="template">Template</option>
          <option value="masked">Masked</option>
          <option value="full">Full</option>
        </select>

        <button onClick={handleCopy} className={styles.button} title="Copy">
          Copy
        </button>
        <button onClick={handleDownload} className={styles.button} title="Download">
          Download
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.yamlSection}>
          <div className={styles.sectionHeader}>
            <span>YAML Preview</span>
            {loading && <span className={styles.loading}>Loading...</span>}
          </div>
          <pre className={styles.yaml}>{yaml}</pre>
        </div>

        {showValidation && validation && (
          <div className={styles.validationSection}>
            <div className={styles.sectionHeader}>
              <span>Validation</span>
              <button onClick={() => setShowValidation(false)} className={styles.closeButton}>
                ×
              </button>
            </div>
            <div className={styles.validationContent}>
              {!hasErrors && !hasWarnings && (
                <div className={styles.validationSuccess}>✓ No issues found</div>
              )}

              {hasErrors && (
                <div className={styles.validationGroup}>
                  <div className={styles.validationGroupTitle}>
                    Errors ({validation.errors.length})
                  </div>
                  {validation.errors.map((error: any, i: number) => (
                    <div key={i} className={styles.validationError}>
                      <div className={styles.validationPath}>{error.path.join(' > ')}</div>
                      <div className={styles.validationMessage}>{error.message}</div>
                    </div>
                  ))}
                </div>
              )}

              {hasWarnings && (
                <div className={styles.validationGroup}>
                  <div className={styles.validationGroupTitle}>
                    Warnings ({validation.warnings.length})
                  </div>
                  {validation.warnings.map((warning: any, i: number) => (
                    <div key={i} className={styles.validationWarning}>
                      <div className={styles.validationPath}>{warning.path.join(' > ')}</div>
                      <div className={styles.validationMessage}>{warning.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {!showValidation && (
          <button onClick={() => setShowValidation(true)} className={styles.showValidationButton}>
            Show Validation
          </button>
        )}
      </div>
    </div>
  );
}
