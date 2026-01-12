import { OverlayElement } from './PosterPreview';
import styles from './OverlayElementEditor.module.css';

export interface OverlayElementEditorProps {
  elements: OverlayElement[];
  selectedElementIndex: number | null; // Legacy single selection
  selectedElementIndices?: number[]; // Multi-selection
  onElementsChange: (elements: OverlayElement[]) => void;
  onSelectedElementChange: (index: number | null) => void;
  onSelectedElementsChange?: (indices: number[]) => void;
}

export function OverlayElementEditor({
  elements,
  selectedElementIndex,
  selectedElementIndices = [],
  onElementsChange,
  onSelectedElementChange,
  onSelectedElementsChange,
}: OverlayElementEditorProps) {
  // Compute effective selected indices
  const effectiveSelectedIndices =
    selectedElementIndices.length > 0
      ? selectedElementIndices
      : selectedElementIndex !== null
        ? [selectedElementIndex]
        : [];

  const isMultiSelect = effectiveSelectedIndices.length > 1;
  const selectedElement =
    effectiveSelectedIndices.length === 1 ? elements[effectiveSelectedIndices[0]] : null;
  const primarySelectedIndex =
    effectiveSelectedIndices.length > 0 ? effectiveSelectedIndices[0] : null;

  // Helper to get display values for position
  const _getPositionDisplay = (element: OverlayElement) => {
    if (element.position) {
      return {
        horizontal: element.position.horizontal || 'left',
        vertical: element.position.vertical || 'top',
        horizontalOffset: element.offset?.horizontal || 0,
        verticalOffset: element.offset?.vertical || 0,
      };
    }
    return {
      horizontal: 'left',
      vertical: 'top',
      horizontalOffset: element.x || 0,
      verticalOffset: element.y || 0,
    };
  };

  const updateElement = (index: number, updates: Partial<OverlayElement>) => {
    const newElements = [...elements];
    newElements[index] = { ...newElements[index], ...updates };
    onElementsChange(newElements);
  };

  const addElement = (type: OverlayElement['type']) => {
    const newElement: OverlayElement = {
      type,
      x: 50,
      y: 50,
      ...(type === 'text' && {
        text: 'New Text',
        fontSize: 24,
        color: '#ffffff',
      }),
      ...(type === 'badge' && {
        text: 'BADGE',
        fontSize: 20,
        color: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderRadius: 6,
        padding: 10,
      }),
      ...(type === 'ribbon' && {
        text: 'RIBBON',
        width: 500,
        height: 50,
        fontSize: 22,
        color: '#000000',
        backgroundColor: 'rgba(255, 193, 7, 0.95)',
      }),
      ...(type === 'image' && {
        imageUrl: '',
        width: 100,
        height: 100,
      }),
    };

    const newElements = [...elements, newElement];
    onElementsChange(newElements);
    onSelectedElementChange(newElements.length - 1);
    onSelectedElementsChange?.([newElements.length - 1]);
  };

  const removeElement = (index: number) => {
    const newElements = elements.filter((_, i) => i !== index);
    onElementsChange(newElements);

    // Update selection
    if (effectiveSelectedIndices.includes(index)) {
      const newSelection = effectiveSelectedIndices
        .filter((i) => i !== index)
        .map((i) => (i > index ? i - 1 : i));
      if (newSelection.length > 0) {
        onSelectedElementChange(newSelection[0]);
        onSelectedElementsChange?.(newSelection);
      } else {
        onSelectedElementChange(null);
        onSelectedElementsChange?.([]);
      }
    } else {
      // Adjust indices for removed element
      const newSelection = effectiveSelectedIndices.map((i) => (i > index ? i - 1 : i));
      if (newSelection.length > 0) {
        onSelectedElementChange(newSelection[0]);
        onSelectedElementsChange?.(newSelection);
      }
    }
  };

  // Remove all selected elements
  const removeSelectedElements = () => {
    if (effectiveSelectedIndices.length === 0) return;

    const indicesToRemove = new Set(effectiveSelectedIndices);
    const newElements = elements.filter((_, i) => !indicesToRemove.has(i));
    onElementsChange(newElements);
    onSelectedElementChange(null);
    onSelectedElementsChange?.([]);
  };

  // Duplicate selected elements
  const duplicateSelectedElements = () => {
    if (effectiveSelectedIndices.length === 0) return;

    const duplicates = effectiveSelectedIndices.map((idx) => {
      const original = elements[idx];
      return {
        ...original,
        x: (original.x || 0) + 20,
        y: (original.y || 0) + 20,
        offset: original.offset
          ? {
              horizontal: (original.offset.horizontal || 0) + 20,
              vertical: (original.offset.vertical || 0) + 20,
            }
          : undefined,
      };
    });

    const newElements = [...elements, ...duplicates];
    const newIndices = duplicates.map((_, i) => elements.length + i);
    onElementsChange(newElements);
    onSelectedElementChange(newIndices[0]);
    onSelectedElementsChange?.(newIndices);
  };

  // Layering controls
  const moveElementUp = (index: number) => {
    if (index >= elements.length - 1) return;
    const newElements = [...elements];
    [newElements[index], newElements[index + 1]] = [newElements[index + 1], newElements[index]];
    onElementsChange(newElements);
    onSelectedElementChange(index + 1);
    onSelectedElementsChange?.(effectiveSelectedIndices.map((i) => (i === index ? index + 1 : i)));
  };

  const moveElementDown = (index: number) => {
    if (index <= 0) return;
    const newElements = [...elements];
    [newElements[index], newElements[index - 1]] = [newElements[index - 1], newElements[index]];
    onElementsChange(newElements);
    onSelectedElementChange(index - 1);
    onSelectedElementsChange?.(effectiveSelectedIndices.map((i) => (i === index ? index - 1 : i)));
  };

  const bringToFront = (index: number) => {
    if (index >= elements.length - 1) return;
    const newElements = [...elements];
    const [element] = newElements.splice(index, 1);
    newElements.push(element);
    onElementsChange(newElements);
    const newIndex = newElements.length - 1;
    onSelectedElementChange(newIndex);
    onSelectedElementsChange?.([newIndex]);
  };

  const sendToBack = (index: number) => {
    if (index <= 0) return;
    const newElements = [...elements];
    const [element] = newElements.splice(index, 1);
    newElements.unshift(element);
    onElementsChange(newElements);
    onSelectedElementChange(0);
    onSelectedElementsChange?.([0]);
  };

  // Handle click on element item with multi-select support
  const handleElementClick = (index: number, e: React.MouseEvent) => {
    const isShiftKey = e.shiftKey;
    const isCtrlKey = e.ctrlKey || e.metaKey;

    if (onSelectedElementsChange && (isShiftKey || isCtrlKey)) {
      const currentSelection = [...effectiveSelectedIndices];

      if (isCtrlKey) {
        // Toggle selection
        const existingIdx = currentSelection.indexOf(index);
        if (existingIdx >= 0) {
          currentSelection.splice(existingIdx, 1);
        } else {
          currentSelection.push(index);
        }
        onSelectedElementsChange(currentSelection);
        if (currentSelection.length > 0) {
          onSelectedElementChange(currentSelection[0]);
        } else {
          onSelectedElementChange(null);
        }
      } else if (isShiftKey && currentSelection.length > 0) {
        // Range selection
        const lastSelected = currentSelection[currentSelection.length - 1];
        const start = Math.min(lastSelected, index);
        const end = Math.max(lastSelected, index);
        const rangeSelection = new Set(currentSelection);
        for (let i = start; i <= end; i++) {
          rangeSelection.add(i);
        }
        const newSelection = Array.from(rangeSelection);
        onSelectedElementsChange(newSelection);
        onSelectedElementChange(newSelection[0]);
      }
    } else {
      // Single selection
      onSelectedElementChange(index);
      onSelectedElementsChange?.([index]);
    }
  };

  // Select all elements
  const selectAll = () => {
    const allIndices = elements.map((_, i) => i);
    onSelectedElementChange(allIndices.length > 0 ? allIndices[0] : null);
    onSelectedElementsChange?.(allIndices);
  };

  return (
    <div className={styles.container}>
      {/* Add buttons */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Add Element</h3>
        <div className={styles.buttonGroup}>
          <button onClick={() => addElement('text')} className={styles.addButton}>
            + Text
          </button>
          <button onClick={() => addElement('badge')} className={styles.addButton}>
            + Badge
          </button>
          <button onClick={() => addElement('ribbon')} className={styles.addButton}>
            + Ribbon
          </button>
          <button onClick={() => addElement('image')} className={styles.addButton}>
            + Image
          </button>
        </div>
      </div>

      {/* Element list and editor side by side */}
      <div className={styles.topSection}>
        {/* Element list */}
        <div className={styles.section} style={{ flex: '0 0 280px' }}>
          <div className={styles.listHeader}>
            <h3 className={styles.sectionTitle}>Elements ({elements.length})</h3>
            {elements.length > 0 && (
              <button
                className={styles.selectAllButton}
                onClick={selectAll}
                title="Select all (Ctrl+A)"
              >
                Select All
              </button>
            )}
          </div>

          {/* Multi-selection actions */}
          {isMultiSelect && (
            <div className={styles.multiSelectActions}>
              <span className={styles.multiSelectLabel}>
                {effectiveSelectedIndices.length} selected
              </span>
              <button
                className={styles.multiActionButton}
                onClick={duplicateSelectedElements}
                title="Duplicate selected"
              >
                Duplicate
              </button>
              <button
                className={styles.multiActionButtonDanger}
                onClick={removeSelectedElements}
                title="Delete selected"
              >
                Delete
              </button>
            </div>
          )}

          <div className={styles.elementList}>
            {elements.map((element, index) => {
              // Create descriptive label for element
              const getElementLabel = () => {
                const text = element.text || element.content;
                if (text) {
                  return `"${text}"`;
                }
                if (element.type === 'image' && element.imageUrl) {
                  const filename = element.imageUrl.split('/').pop() || 'Image';
                  return filename.length > 20 ? filename.substring(0, 20) + '...' : filename;
                }
                return 'No content';
              };

              // Get position info for additional context
              const getPositionInfo = () => {
                if (element.position) {
                  const h = element.position.horizontal || 'left';
                  const v = element.position.vertical || 'top';
                  return ` • ${h}-${v}`;
                }
                return '';
              };

              const isSelected = effectiveSelectedIndices.includes(index);

              return (
                <div
                  key={index}
                  className={`${styles.elementItem} ${isSelected ? styles.selected : ''} ${isSelected && isMultiSelect ? styles.multiSelected : ''}`}
                  onClick={(e) => handleElementClick(index, e)}
                >
                  <div className={styles.elementInfo}>
                    <span className={styles.elementType}>
                      <span className={styles.elementIndex}>{index + 1}.</span>
                      {element.type.toUpperCase()}
                      {getPositionInfo()}
                    </span>
                    <span className={styles.elementText}>{getElementLabel()}</span>
                  </div>
                  <div className={styles.elementActions}>
                    {/* Layering controls */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveElementUp(index);
                      }}
                      className={styles.layerButton}
                      disabled={index >= elements.length - 1}
                      title="Move up (render on top)"
                    >
                      ↑
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveElementDown(index);
                      }}
                      className={styles.layerButton}
                      disabled={index <= 0}
                      title="Move down (render behind)"
                    >
                      ↓
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeElement(index);
                      }}
                      className={styles.removeButton}
                      title="Remove element"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
            {elements.length === 0 && (
              <div className={styles.emptyMessage}>No elements yet. Add one above.</div>
            )}
          </div>

          {/* Layer ordering hint */}
          {elements.length > 1 && (
            <div className={styles.layerHint}>
              Elements at the bottom of the list render on top.
            </div>
          )}
        </div>

        {/* Edit form */}
        {isMultiSelect ? (
          <div className={styles.editorFormSection}>
            <h3 className={styles.sectionTitle}>
              {effectiveSelectedIndices.length} Elements Selected
            </h3>
            <div className={styles.multiSelectInfo}>
              <p>Select a single element to edit its properties.</p>
              <p>Use Ctrl/Cmd+Click to toggle selection, Shift+Click for range.</p>
            </div>
            <div className={styles.bulkActions}>
              <h4 className={styles.bulkActionsTitle}>Bulk Actions</h4>
              <div className={styles.bulkButtonGroup}>
                <button className={styles.bulkButton} onClick={duplicateSelectedElements}>
                  Duplicate All
                </button>
                <button className={styles.bulkButtonDanger} onClick={removeSelectedElements}>
                  Delete All
                </button>
              </div>
            </div>
          </div>
        ) : selectedElement !== null && primarySelectedIndex !== null ? (
          <div className={styles.editorFormSection}>
            <div className={styles.editorFormHeader}>
              <h3 className={styles.sectionTitle}>Edit {selectedElement.type.toUpperCase()}</h3>
              <div className={styles.layerControls}>
                <button
                  className={styles.layerControlButton}
                  onClick={() => bringToFront(primarySelectedIndex)}
                  disabled={primarySelectedIndex >= elements.length - 1}
                  title="Bring to front"
                >
                  ⬆ Front
                </button>
                <button
                  className={styles.layerControlButton}
                  onClick={() => sendToBack(primarySelectedIndex)}
                  disabled={primarySelectedIndex <= 0}
                  title="Send to back"
                >
                  ⬇ Back
                </button>
              </div>
            </div>

            <div className={styles.form}>
              {selectedElement.position ? (
                <>
                  {/* Position-based layout (Kometa style) */}
                  <div className={styles.formRow}>
                    <label>Horizontal Align:</label>
                    <select
                      value={selectedElement.position.horizontal || 'left'}
                      onChange={(e) =>
                        updateElement(primarySelectedIndex, {
                          position: {
                            ...selectedElement.position,
                            horizontal: e.target.value as 'left' | 'center' | 'right',
                          },
                        })
                      }
                      className={styles.input}
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>

                  <div className={styles.formRow}>
                    <label>Vertical Align:</label>
                    <select
                      value={selectedElement.position.vertical || 'top'}
                      onChange={(e) =>
                        updateElement(primarySelectedIndex, {
                          position: {
                            ...selectedElement.position,
                            vertical: e.target.value as 'top' | 'center' | 'bottom',
                          },
                        })
                      }
                      className={styles.input}
                    >
                      <option value="top">Top</option>
                      <option value="center">Center</option>
                      <option value="bottom">Bottom</option>
                    </select>
                  </div>

                  <div className={styles.formRow}>
                    <label>Horizontal Offset:</label>
                    <input
                      type="number"
                      value={selectedElement.offset?.horizontal || 0}
                      onChange={(e) =>
                        updateElement(primarySelectedIndex, {
                          offset: { ...selectedElement.offset, horizontal: Number(e.target.value) },
                        })
                      }
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formRow}>
                    <label>Vertical Offset:</label>
                    <input
                      type="number"
                      value={selectedElement.offset?.vertical || 0}
                      onChange={(e) =>
                        updateElement(primarySelectedIndex, {
                          offset: { ...selectedElement.offset, vertical: Number(e.target.value) },
                        })
                      }
                      className={styles.input}
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Absolute positioning */}
                  <div className={styles.formRow}>
                    <label>X Position:</label>
                    <input
                      type="number"
                      value={selectedElement.x || 0}
                      onChange={(e) =>
                        updateElement(primarySelectedIndex, { x: Number(e.target.value) })
                      }
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formRow}>
                    <label>Y Position:</label>
                    <input
                      type="number"
                      value={selectedElement.y || 0}
                      onChange={(e) =>
                        updateElement(primarySelectedIndex, { y: Number(e.target.value) })
                      }
                      className={styles.input}
                    />
                  </div>
                </>
              )}

              {(selectedElement.type === 'badge' ||
                selectedElement.type === 'ribbon' ||
                selectedElement.type === 'image') && (
                <>
                  <div className={styles.formRow}>
                    <label>Width:</label>
                    <input
                      type="number"
                      value={selectedElement.width || ''}
                      onChange={(e) =>
                        updateElement(primarySelectedIndex, {
                          width: Number(e.target.value),
                        })
                      }
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formRow}>
                    <label>Height:</label>
                    <input
                      type="number"
                      value={selectedElement.height || ''}
                      onChange={(e) =>
                        updateElement(primarySelectedIndex, {
                          height: Number(e.target.value),
                        })
                      }
                      className={styles.input}
                    />
                  </div>
                </>
              )}

              {(selectedElement.type === 'text' ||
                selectedElement.type === 'badge' ||
                selectedElement.type === 'ribbon') && (
                <>
                  <div className={styles.formRow}>
                    <label>Text:</label>
                    <input
                      type="text"
                      value={selectedElement.text || selectedElement.content || ''}
                      onChange={(e) => {
                        // Update both text and content to stay in sync
                        const updates: Partial<OverlayElement> = { text: e.target.value };
                        if (selectedElement.content !== undefined) {
                          updates.content = e.target.value;
                        }
                        updateElement(primarySelectedIndex, updates);
                      }}
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formRow}>
                    <label>Font Size:</label>
                    <input
                      type="number"
                      value={selectedElement.fontSize || 24}
                      onChange={(e) =>
                        updateElement(primarySelectedIndex, {
                          fontSize: Number(e.target.value),
                        })
                      }
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formRow}>
                    <label>Text Color:</label>
                    <input
                      type="text"
                      value={selectedElement.color || '#ffffff'}
                      onChange={(e) =>
                        updateElement(primarySelectedIndex, { color: e.target.value })
                      }
                      className={styles.input}
                      placeholder="#ffffff"
                    />
                  </div>
                </>
              )}

              {(selectedElement.type === 'badge' || selectedElement.type === 'ribbon') && (
                <div className={styles.formRow}>
                  <label>Background:</label>
                  <input
                    type="text"
                    value={selectedElement.backgroundColor || ''}
                    onChange={(e) =>
                      updateElement(primarySelectedIndex, {
                        backgroundColor: e.target.value,
                      })
                    }
                    className={styles.input}
                    placeholder="rgba(0, 0, 0, 0.8)"
                  />
                </div>
              )}

              {selectedElement.type === 'badge' && (
                <>
                  <div className={styles.formRow}>
                    <label>Border Radius:</label>
                    <input
                      type="number"
                      value={selectedElement.borderRadius || 0}
                      onChange={(e) =>
                        updateElement(primarySelectedIndex, {
                          borderRadius: Number(e.target.value),
                        })
                      }
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formRow}>
                    <label>Padding:</label>
                    <input
                      type="number"
                      value={selectedElement.padding || 0}
                      onChange={(e) =>
                        updateElement(primarySelectedIndex, {
                          padding: Number(e.target.value),
                        })
                      }
                      className={styles.input}
                    />
                  </div>
                </>
              )}

              {selectedElement.type === 'image' && (
                <div className={styles.formRow}>
                  <label>Image URL:</label>
                  <input
                    type="text"
                    value={selectedElement.imageUrl || ''}
                    onChange={(e) =>
                      updateElement(primarySelectedIndex, { imageUrl: e.target.value })
                    }
                    className={styles.input}
                    placeholder="https://..."
                  />
                </div>
              )}

              <div className={styles.formRow}>
                <label>Rotation (deg):</label>
                <input
                  type="number"
                  value={selectedElement.rotation || 0}
                  onChange={(e) =>
                    updateElement(primarySelectedIndex, {
                      rotation: Number(e.target.value),
                    })
                  }
                  className={styles.input}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.editorFormSection}>
            <div className={styles.emptyMessage} style={{ padding: '40px', textAlign: 'center' }}>
              <p>Select an element to edit its properties</p>
              <p style={{ fontSize: '12px', opacity: 0.7, marginTop: '8px' }}>
                Tip: Use Ctrl/Cmd+Click to select multiple elements
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
