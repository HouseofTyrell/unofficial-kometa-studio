import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styles from './ConfigEditorPage.module.css';
import { configApi } from '../api/client';
import { LibrariesEditor } from '../components/editors/LibrariesEditor';
import { SettingsEditor } from '../components/editors/SettingsEditor';
import { IntegrationsEditor } from '../components/editors/IntegrationsEditor';

type EditorSection = 'settings' | 'libraries' | 'integrations';

export function ConfigEditorPage() {
  const { configId } = useParams<{ configId: string }>();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<EditorSection>('libraries');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (configId) {
      loadConfig();
    }
  }, [configId]);

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

  if (loading) {
    return <div className={styles.loading}>Loading configuration...</div>;
  }

  if (!config) {
    return <div className={styles.error}>Configuration not found</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{config.name}</h1>
        {config.description && <p className={styles.description}>{config.description}</p>}
        {saving && <span className={styles.savingIndicator}>Saving...</span>}
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeSection === 'settings' ? styles.active : ''}`}
          onClick={() => setActiveSection('settings')}
        >
          Settings
        </button>
        <button
          className={`${styles.tab} ${activeSection === 'libraries' ? styles.active : ''}`}
          onClick={() => setActiveSection('libraries')}
        >
          Libraries
        </button>
        <button
          className={`${styles.tab} ${activeSection === 'integrations' ? styles.active : ''}`}
          onClick={() => setActiveSection('integrations')}
        >
          Integrations
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
