/**
 * EditorSection Component
 *
 * Right-side editor panel with element list, presets, and code view.
 */

import styles from '../../pages/OverlayBuilderPage.module.css';
import { OverlayPresetSelector } from './OverlayPresetSelector';
import { OverlayElementEditor } from './OverlayElementEditor';
import { OverlayCodeView } from './OverlayCodeView';
import type { OverlayElement } from './PosterPreview';

export interface EditorSectionProps {
  overlayElements: OverlayElement[];
  selectedElementIndex: number | null;
  selectedElementIndices: number[];
  onElementsChange: (elements: OverlayElement[]) => void;
  onSelectedElementChange: (index: number | null) => void;
  onSelectedElementsChange: (indices: number[]) => void;
  selectedPresetId: string;
  onPresetChange: (presetId: string) => void;
  showCode: boolean;
  onShowCodeChange: (show: boolean) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onImport: () => void;
}

export function EditorSection({
  overlayElements,
  selectedElementIndex,
  selectedElementIndices,
  onElementsChange,
  onSelectedElementChange,
  onSelectedElementsChange,
  selectedPresetId,
  onPresetChange,
  showCode,
  onShowCodeChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onImport,
}: EditorSectionProps) {
  return (
    <div className={styles.editorSection}>
      <div className={styles.editorHeader}>
        <div className={styles.editorTitle}>
          Overlay Elements
          {overlayElements.length > 0 && (
            <span style={{ fontSize: '14px', fontWeight: 'normal', opacity: 0.7 }}>
              ({overlayElements.length})
            </span>
          )}
        </div>
        <div className={styles.editorActions}>
          <div className={styles.historyButtons}>
            <button
              className={styles.iconButton}
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
            >
              ↩
            </button>
            <button
              className={styles.iconButton}
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo (Ctrl+Shift+Z)"
            >
              ↪
            </button>
          </div>
          <OverlayPresetSelector
            selectedPresetId={selectedPresetId}
            onPresetChange={onPresetChange}
          />
          <button className={styles.importButton} onClick={onImport} title="Import from GitHub">
            Import
          </button>
          <button className={styles.button} onClick={() => onShowCodeChange(!showCode)}>
            {showCode ? 'Hide Code' : 'Show Code'}
          </button>
        </div>
      </div>

      <div className={styles.editorContent}>
        <OverlayElementEditor
          elements={overlayElements}
          selectedElementIndex={selectedElementIndex}
          selectedElementIndices={selectedElementIndices}
          onElementsChange={onElementsChange}
          onSelectedElementChange={onSelectedElementChange}
          onSelectedElementsChange={onSelectedElementsChange}
        />

        {showCode && (
          <div
            style={{
              marginTop: '16px',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '16px',
            }}
          >
            <h3
              style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '12px',
              }}
            >
              YAML Code
            </h3>
            <OverlayCodeView elements={overlayElements} onElementsChange={onElementsChange} />
          </div>
        )}
      </div>
    </div>
  );
}
