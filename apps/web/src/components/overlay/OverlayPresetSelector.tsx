import { OverlayElement } from './PosterPreview';
import styles from './OverlayPresetSelector.module.css';

export interface OverlayPreset {
  id: string;
  name: string;
  description: string;
  elements: OverlayElement[];
}

export const OVERLAY_PRESETS: OverlayPreset[] = [
  {
    id: 'none',
    name: 'None',
    description: 'No overlay',
    elements: [],
  },
  {
    id: '4k-badge',
    name: '4K Badge',
    description: 'Top-right 4K badge',
    elements: [
      {
        type: 'badge',
        x: 350,
        y: 20,
        text: '4K',
        fontSize: 24,
        fontFamily: 'system-ui',
        color: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderRadius: 6,
        padding: 10,
      },
    ],
  },
  {
    id: 'hdr-ribbon',
    name: 'HDR Ribbon',
    description: 'Top banner with HDR text',
    elements: [
      {
        type: 'ribbon',
        x: 0,
        y: 0,
        width: 500,
        height: 50,
        text: 'HDR',
        fontSize: 22,
        fontFamily: 'system-ui',
        color: '#000000',
        backgroundColor: 'rgba(255, 193, 7, 0.95)',
      },
    ],
  },
  {
    id: 'rating-badge',
    name: 'Rating Badge',
    description: 'Bottom-right rating display',
    elements: [
      {
        type: 'badge',
        x: 380,
        y: 680,
        text: '⭐ 8.5',
        fontSize: 20,
        fontFamily: 'system-ui',
        color: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        borderRadius: 8,
        padding: 12,
      },
    ],
  },
  {
    id: 'watched-ribbon',
    name: 'Watched Banner',
    description: 'Diagonal "WATCHED" ribbon',
    elements: [
      {
        type: 'ribbon',
        x: -100,
        y: 100,
        width: 700,
        height: 60,
        text: 'WATCHED',
        fontSize: 28,
        fontFamily: 'system-ui',
        color: '#ffffff',
        backgroundColor: 'rgba(76, 175, 80, 0.9)',
        rotation: -30,
      },
    ],
  },
  {
    id: 'multi-badge',
    name: 'Multi-Badge',
    description: 'Multiple quality badges',
    elements: [
      {
        type: 'badge',
        x: 20,
        y: 20,
        text: '4K',
        fontSize: 18,
        fontFamily: 'system-ui',
        color: '#ffffff',
        backgroundColor: 'rgba(33, 150, 243, 0.9)',
        borderRadius: 4,
        padding: 8,
      },
      {
        type: 'badge',
        x: 80,
        y: 20,
        text: 'HDR',
        fontSize: 18,
        fontFamily: 'system-ui',
        color: '#000000',
        backgroundColor: 'rgba(255, 193, 7, 0.9)',
        borderRadius: 4,
        padding: 8,
      },
      {
        type: 'badge',
        x: 150,
        y: 20,
        text: 'ATMOS',
        fontSize: 18,
        fontFamily: 'system-ui',
        color: '#ffffff',
        backgroundColor: 'rgba(156, 39, 176, 0.9)',
        borderRadius: 4,
        padding: 8,
      },
    ],
  },
];

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
      <label className={styles.label}>Select Preset Template:</label>
      <select
        value={selectedPresetId}
        onChange={(e) => onPresetChange(e.target.value)}
        className={styles.select}
      >
        {OVERLAY_PRESETS.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.name} - {preset.description}
          </option>
        ))}
      </select>
    </div>
  );
}
