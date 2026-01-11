import { useState } from 'react';
import styles from './ImportExportPage.module.css';
import { configApi } from '../api/client';

export function ImportExportPage() {
  const [yamlInput, setYamlInput] = useState('');
  const [importing, setImporting] = useState(false);

  const handleImportYaml = async () => {
    if (!yamlInput.trim()) {
      alert('Please paste YAML content');
      return;
    }

    const configName = prompt('Enter a name for this configuration:');
    if (!configName) return;

    setImporting(true);
    try {
      const newConfig = await configApi.create({
        name: configName,
        config: {},
      });

      await configApi.importYaml(newConfig.id, yamlInput, true);
      alert('Configuration imported successfully!');
      setYamlInput('');
    } catch (error) {
      console.error('Failed to import:', error);
      alert(`Import failed: ${(error as Error).message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Import / Export</h1>
        <p className={styles.description}>
          Import existing Kometa YAML configurations or export your work.
        </p>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Import YAML Configuration</h2>
          <p className={styles.sectionDescription}>
            Paste your existing config.yml content below to import it into Kometa Studio.
            Unknown keys will be preserved in extras.
          </p>

          <textarea
            value={yamlInput}
            onChange={(e) => setYamlInput(e.target.value)}
            className={styles.yamlEditor}
            placeholder="Paste your YAML configuration here..."
          />

          <button
            onClick={handleImportYaml}
            disabled={!yamlInput.trim() || importing}
            className={styles.importButton}
          >
            {importing ? 'Importing...' : 'Import Configuration'}
          </button>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Export Configurations</h2>
          <p className={styles.sectionDescription}>
            To export a configuration:
          </p>
          <ol className={styles.instructions}>
            <li>Open the configuration you want to export</li>
            <li>Use the YAML preview panel on the right</li>
            <li>Select your profile and mode (template/masked/full)</li>
            <li>Click "Download" to save the YAML file</li>
          </ol>

          <div className={styles.warning}>
            <strong>⚠️ Security Warning:</strong> When using "Full" mode, your secrets
            will be included in the exported YAML. Only use this for actual deployment.
            Use "Template" or "Masked" modes for sharing or backup.
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Reset All Data</h2>
          <p className={styles.sectionDescription}>
            This will delete all configurations and profiles. This cannot be undone.
          </p>
          <button
            onClick={() => {
              if (confirm('Delete ALL data? This cannot be undone!')) {
                alert('Feature not yet implemented. Please manually delete the database file.');
              }
            }}
            className={styles.dangerButton}
          >
            Reset All Local Data
          </button>
        </div>
      </div>
    </div>
  );
}
