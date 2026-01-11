import { useState } from 'react';
import styles from './LibraryEditor.module.css';
import { FileListEditor } from './FileListEditor';

interface LibraryEditorProps {
  library: any;
  onChange: (library: any) => void;
}

export function LibraryEditor({ library, onChange }: LibraryEditorProps) {
  const [activeTab, setActiveTab] = useState<'files' | 'filters' | 'settings'>('files');

  const handleChange = (field: string, value: any) => {
    onChange({
      ...library,
      [field]: value,
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'files' ? styles.active : ''}`}
          onClick={() => setActiveTab('files')}
        >
          Collection & Overlay Files
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'filters' ? styles.active : ''}`}
          onClick={() => setActiveTab('filters')}
        >
          Filters
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'settings' ? styles.active : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'files' && (
          <div className={styles.filesTab}>
            <div className={styles.fileSection}>
              <h3 className={styles.sectionTitle}>Collection Files</h3>
              <p className={styles.sectionDescription}>
                Define collection files for this library. Each entry can reference a file, default, URL, or git repo.
              </p>
              <FileListEditor
                files={library.collection_files || []}
                onChange={(files) => handleChange('collection_files', files)}
              />
            </div>

            <div className={styles.fileSection}>
              <h3 className={styles.sectionTitle}>Overlay Files</h3>
              <p className={styles.sectionDescription}>
                Define overlay files for this library. You can use the same default multiple times with different template_variables.
              </p>
              <FileListEditor
                files={library.overlay_files || []}
                onChange={(files) => handleChange('overlay_files', files)}
              />
            </div>
          </div>
        )}

        {activeTab === 'filters' && (
          <div className={styles.filtersTab}>
            <h3 className={styles.sectionTitle}>Library Filters</h3>
            <p className={styles.sectionDescription}>
              Define filters for this library (e.g., added: "7d", resolution: "1080p").
            </p>
            <textarea
              value={JSON.stringify(library.filters || {}, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleChange('filters', parsed);
                } catch {
                  // Invalid JSON, ignore
                }
              }}
              className={styles.jsonEditor}
              placeholder='{\n  "added": "7d"\n}'
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className={styles.settingsTab}>
            <h3 className={styles.sectionTitle}>Library Settings</h3>

            <div className={styles.field}>
              <label className={styles.label}>Schedule</label>
              <input
                type="text"
                value={library.schedule || ''}
                onChange={(e) => handleChange('schedule', e.target.value || undefined)}
                className={styles.input}
                placeholder="e.g., daily, weekly(sunday)"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Template Variables (JSON)</label>
              <textarea
                value={JSON.stringify(library.template_variables || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    handleChange('template_variables', parsed);
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
                className={styles.jsonEditor}
                placeholder='{\n  "use_separator": false\n}'
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
