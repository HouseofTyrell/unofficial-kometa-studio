import styles from './SettingsEditor.module.css';

interface SettingsEditorProps {
  settings: any;
  onChange: (settings: any) => void;
}

export function SettingsEditor({ settings, onChange }: SettingsEditorProps) {
  const handleChange = (field: string, value: any) => {
    onChange({
      ...settings,
      [field]: value === '' ? undefined : value,
    });
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Global Settings</h2>

      <div className={styles.grid}>
        <div className={styles.field}>
          <label className={styles.label}>Cache</label>
          <select
            value={settings.cache === undefined ? 'default' : settings.cache ? 'true' : 'false'}
            onChange={(e) =>
              handleChange(
                'cache',
                e.target.value === 'default' ? undefined : e.target.value === 'true'
              )
            }
            className={styles.select}
          >
            <option value="default">Default</option>
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Cache Expiration (days)</label>
          <input
            type="number"
            value={settings.cache_expiration || ''}
            onChange={(e) =>
              handleChange(
                'cache_expiration',
                e.target.value ? parseInt(e.target.value) : undefined
              )
            }
            className={styles.input}
            placeholder="60"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Sync Mode</label>
          <select
            value={settings.sync_mode || ''}
            onChange={(e) => handleChange('sync_mode', e.target.value)}
            className={styles.select}
          >
            <option value="">Default</option>
            <option value="append">Append</option>
            <option value="sync">Sync</option>
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Asset Directory</label>
          <input
            type="text"
            value={settings.asset_directory || ''}
            onChange={(e) => handleChange('asset_directory', e.target.value)}
            className={styles.input}
            placeholder="config/assets"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Run Again Delay (hours)</label>
          <input
            type="number"
            value={settings.run_again_delay || ''}
            onChange={(e) =>
              handleChange('run_again_delay', e.target.value ? parseInt(e.target.value) : undefined)
            }
            className={styles.input}
            placeholder="2"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Delete Below Minimum</label>
          <select
            value={
              settings.delete_below_minimum === undefined
                ? 'default'
                : settings.delete_below_minimum
                  ? 'true'
                  : 'false'
            }
            onChange={(e) =>
              handleChange(
                'delete_below_minimum',
                e.target.value === 'default' ? undefined : e.target.value === 'true'
              )
            }
            className={styles.select}
          >
            <option value="default">Default</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
      </div>

      <div className={styles.jsonSection}>
        <h3 className={styles.sectionTitle}>Advanced (JSON)</h3>
        <p className={styles.sectionDescription}>
          Edit all settings as JSON for advanced configuration.
        </p>
        <textarea
          value={JSON.stringify(settings, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              onChange(parsed);
            } catch {
              // Invalid JSON, ignore
            }
          }}
          className={styles.jsonEditor}
        />
      </div>
    </div>
  );
}
