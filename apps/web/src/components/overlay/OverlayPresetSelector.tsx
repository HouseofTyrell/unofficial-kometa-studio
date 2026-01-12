import styles from './OverlayPresetSelector.module.css';
import {
  OVERLAY_PRESETS,
  PRESET_CATEGORIES,
  PRESETS_BY_CATEGORY,
  type OverlayPreset,
} from '../../data/overlay-presets.data';

// Re-export for backward compatibility
export { OVERLAY_PRESETS, PRESET_CATEGORIES, type OverlayPreset };

export interface OverlayPresetSelectorProps {
  selectedPresetId: string;
  onPresetChange: (presetId: string) => void;
}

export function OverlayPresetSelector({
  selectedPresetId,
  onPresetChange,
}: OverlayPresetSelectorProps) {
  return (
    <div className={styles.container}>
      <label className={styles.label}>Preset:</label>
      <select
        value={selectedPresetId}
        onChange={(e) => onPresetChange(e.target.value)}
        className={styles.select}
      >
        {PRESET_CATEGORIES.map((category) => {
          const presets = PRESETS_BY_CATEGORY[category];
          if (!presets || presets.length === 0) return null;

          return (
            <optgroup key={category} label={category}>
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>
    </div>
  );
}
