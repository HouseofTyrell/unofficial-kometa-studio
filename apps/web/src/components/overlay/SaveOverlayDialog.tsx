import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { configApi } from '../../api/client';
import { OverlayElement } from './PosterPreview';
import styles from './SaveOverlayDialog.module.css';

export interface SaveOverlayDialogProps {
  overlayElements: OverlayElement[];
  mediaType: 'movie' | 'tv';
  onClose: () => void;
}

export function SaveOverlayDialog({
  overlayElements,
  mediaType,
  onClose,
}: SaveOverlayDialogProps) {
  const navigate = useNavigate();
  const [configs, setConfigs] = useState<any[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');
  const [libraryName, setLibraryName] = useState<string>('');
  const [overlayName, setOverlayName] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [createNew, setCreateNew] = useState(false);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const { configs: configList } = await configApi.list();
      setConfigs(configList);

      if (configList.length > 0 && !createNew) {
        setSelectedConfigId(configList[0].id);
      }
    } catch (error) {
      console.error('Failed to load configs:', error);
    }
  };

  const handleSave = async () => {
    if (!overlayName.trim()) {
      alert('Please enter an overlay name');
      return;
    }

    if (!createNew && !selectedConfigId) {
      alert('Please select a configuration');
      return;
    }

    if (createNew && !libraryName.trim()) {
      alert('Please enter a library name');
      return;
    }

    if (overlayElements.length === 0) {
      alert('Please add at least one overlay element');
      return;
    }

    setSaving(true);

    try {
      let configId = selectedConfigId;

      // Create new config if needed
      if (createNew) {
        const newConfig = await configApi.create({
          name: `Overlay Config - ${libraryName}`,
          config: {
            libraries: {
              [libraryName]: {
                overlay_files: [],
              },
            },
          },
        });
        configId = newConfig.id;
      }

      // Get current config
      const currentConfig = await configApi.get(configId);

      // Prepare overlay configuration
      const overlayConfig = {
        name: overlayName,
        elements: overlayElements.map((element) => ({
          type: element.type,
          position: { x: element.x, y: element.y },
          ...(element.width && { width: element.width }),
          ...(element.height && { height: element.height }),
          ...(element.text && { text: element.text }),
          ...(element.fontSize && { font_size: element.fontSize }),
          ...(element.fontFamily && { font_family: element.fontFamily }),
          ...(element.color && { color: element.color }),
          ...(element.backgroundColor && { background_color: element.backgroundColor }),
          ...(element.borderRadius && { border_radius: element.borderRadius }),
          ...(element.padding && { padding: element.padding }),
          ...(element.imageUrl && { image_url: element.imageUrl }),
          ...(element.rotation && { rotation: element.rotation }),
        })),
      };

      // Add overlay to extras (since overlays aren't fully supported in the schema yet)
      const updatedConfig = {
        ...currentConfig.config,
        extras: {
          ...currentConfig.config.extras,
          custom_overlays: {
            ...(currentConfig.config.extras?.custom_overlays || {}),
            [overlayName]: overlayConfig,
          },
        },
      };

      await configApi.update(configId, { config: updatedConfig });

      alert('Overlay saved successfully!');
      navigate(`/config/${configId}`);
      onClose();
    } catch (error) {
      console.error('Failed to save overlay:', error);
      alert(`Failed to save overlay: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h2 className={styles.title}>Save Overlay Configuration</h2>
          <button onClick={onClose} className={styles.closeButton}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.formGroup}>
            <label>Overlay Name:</label>
            <input
              type="text"
              value={overlayName}
              onChange={(e) => setOverlayName(e.target.value)}
              placeholder="e.g., 4K HDR Badge"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label>
              <input
                type="checkbox"
                checked={createNew}
                onChange={(e) => setCreateNew(e.target.checked)}
                className={styles.checkbox}
              />
              Create new configuration
            </label>
          </div>

          {createNew ? (
            <div className={styles.formGroup}>
              <label>Library Name:</label>
              <input
                type="text"
                value={libraryName}
                onChange={(e) => setLibraryName(e.target.value)}
                placeholder="e.g., Movies, TV Shows"
                className={styles.input}
              />
            </div>
          ) : (
            <div className={styles.formGroup}>
              <label>Add to Configuration:</label>
              <select
                value={selectedConfigId}
                onChange={(e) => setSelectedConfigId(e.target.value)}
                className={styles.select}
              >
                {configs.map((config) => (
                  <option key={config.id} value={config.id}>
                    {config.name}
                  </option>
                ))}
              </select>
              {configs.length === 0 && (
                <p className={styles.hint}>
                  No configurations found. Check "Create new configuration" above.
                </p>
              )}
            </div>
          )}

          <div className={styles.info}>
            <p>
              <strong>Summary:</strong> Saving {overlayElements.length} overlay element
              {overlayElements.length !== 1 ? 's' : ''} for {mediaType === 'movie' ? 'movies' : 'TV shows'}.
            </p>
            <p className={styles.note}>
              Note: This overlay will be saved to the config's custom overlays section.
            </p>
          </div>
        </div>

        <div className={styles.footer}>
          <button onClick={onClose} className={styles.cancelButton}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={styles.saveButton}
          >
            {saving ? 'Saving...' : 'Save Overlay'}
          </button>
        </div>
      </div>
    </div>
  );
}
