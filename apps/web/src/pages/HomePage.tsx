import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './HomePage.module.css';
import { configApi } from '../api/client';

export function HomePage() {
  const navigate = useNavigate();
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewConfigForm, setShowNewConfigForm] = useState(false);
  const [newConfigName, setNewConfigName] = useState('');

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const { configs: configList } = await configApi.list();
      setConfigs(configList);
    } catch (error) {
      console.error('Failed to load configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConfigName.trim()) return;

    try {
      const newConfig = await configApi.create({
        name: newConfigName,
        config: {},
      });
      setNewConfigName('');
      setShowNewConfigForm(false);
      navigate(`/config/${newConfig.id}`);
    } catch (error) {
      console.error('Failed to create config:', error);
      alert('Failed to create configuration');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Kometa Studio</h1>
        <p className={styles.subtitle}>
          An unofficial, local-first IDE for building and validating Kometa config.yml files
        </p>
        <p className={styles.disclaimer}>
          This is an unofficial project and is not affiliated with or endorsed by Kometa.
        </p>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Configurations</h2>
            <button onClick={() => setShowNewConfigForm(true)} className={styles.button}>
              + New Configuration
            </button>
          </div>

          {showNewConfigForm && (
            <form onSubmit={handleCreateConfig} className={styles.newConfigForm}>
              <input
                type="text"
                value={newConfigName}
                onChange={(e) => setNewConfigName(e.target.value)}
                placeholder="Configuration name"
                className={styles.input}
                autoFocus
              />
              <div className={styles.formButtons}>
                <button type="submit" className={styles.button}>
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewConfigForm(false);
                    setNewConfigName('');
                  }}
                  className={styles.buttonSecondary}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className={styles.loading}>Loading...</div>
          ) : configs.length === 0 ? (
            <div className={styles.emptyState}>
              No configurations yet. Create one to get started.
            </div>
          ) : (
            <div className={styles.configList}>
              {configs.map((config) => (
                <div
                  key={config.id}
                  className={styles.configCard}
                  onClick={() => navigate(`/config/${config.id}`)}
                >
                  <div className={styles.configName}>{config.name}</div>
                  {config.description && (
                    <div className={styles.configDescription}>{config.description}</div>
                  )}
                  <div className={styles.configMeta}>
                    Updated {new Date(config.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Features</h2>
          <ul className={styles.featureList}>
            <li>Local-first: All data stored on your machine</li>
            <li>Secure: Secrets encrypted at rest with AES-256-GCM</li>
            <li>Live YAML preview with validation</li>
            <li>Support for all Kometa config sections</li>
            <li>Profile management for different environments</li>
            <li>Import/export configurations</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
