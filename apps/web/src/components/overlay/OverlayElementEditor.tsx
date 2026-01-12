import { OverlayElement } from './PosterPreview';
import styles from './OverlayElementEditor.module.css';

export interface OverlayElementEditorProps {
  elements: OverlayElement[];
  selectedElementIndex: number | null;
  onElementsChange: (elements: OverlayElement[]) => void;
  onSelectedElementChange: (index: number | null) => void;
}

export function OverlayElementEditor({
  elements,
  selectedElementIndex,
  onElementsChange,
  onSelectedElementChange,
}: OverlayElementEditorProps) {
  const selectedElement = selectedElementIndex !== null ? elements[selectedElementIndex] : null;

  // Helper to get display values for position
  const getPositionDisplay = (element: OverlayElement) => {
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
  };

  const removeElement = (index: number) => {
    const newElements = elements.filter((_, i) => i !== index);
    onElementsChange(newElements);
    if (selectedElementIndex === index) {
      onSelectedElementChange(null);
    } else if (selectedElementIndex !== null && selectedElementIndex > index) {
      onSelectedElementChange(selectedElementIndex - 1);
    }
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
          <h3 className={styles.sectionTitle}>Elements ({elements.length})</h3>
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

              return (
                <div
                  key={index}
                  className={`${styles.elementItem} ${selectedElementIndex === index ? styles.selected : ''}`}
                  onClick={() => onSelectedElementChange(index)}
                >
                  <div className={styles.elementInfo}>
                    <span className={styles.elementType}>
                      {element.type.toUpperCase()}{getPositionInfo()}
                    </span>
                    <span className={styles.elementText}>{getElementLabel()}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeElement(index);
                    }}
                    className={styles.removeButton}
                  >
                    ×
                  </button>
                </div>
              );
            })}
            {elements.length === 0 && (
              <div className={styles.emptyMessage}>No elements yet. Add one above.</div>
            )}
          </div>
        </div>

        {/* Edit form */}
        {selectedElement !== null && selectedElementIndex !== null ? (
          <div className={styles.editorFormSection}>
            <h3 className={styles.sectionTitle}>
              Edit {selectedElement.type.toUpperCase()}
            </h3>

            <div className={styles.form}>
            {selectedElement.position ? (
              <>
                {/* Position-based layout (Kometa style) */}
                <div className={styles.formRow}>
                  <label>Horizontal Align:</label>
                  <select
                    value={selectedElement.position.horizontal || 'left'}
                    onChange={(e) =>
                      updateElement(selectedElementIndex, {
                        position: { ...selectedElement.position, horizontal: e.target.value as any }
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
                      updateElement(selectedElementIndex, {
                        position: { ...selectedElement.position, vertical: e.target.value as any }
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
                      updateElement(selectedElementIndex, {
                        offset: { ...selectedElement.offset, horizontal: Number(e.target.value) }
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
                      updateElement(selectedElementIndex, {
                        offset: { ...selectedElement.offset, vertical: Number(e.target.value) }
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
                      updateElement(selectedElementIndex, { x: Number(e.target.value) })
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
                      updateElement(selectedElementIndex, { y: Number(e.target.value) })
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
                      updateElement(selectedElementIndex, {
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
                      updateElement(selectedElementIndex, {
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
                      const updates: any = { text: e.target.value };
                      if (selectedElement.content !== undefined) {
                        updates.content = e.target.value;
                      }
                      updateElement(selectedElementIndex, updates);
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
                      updateElement(selectedElementIndex, {
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
                      updateElement(selectedElementIndex, { color: e.target.value })
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
                    updateElement(selectedElementIndex, {
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
                      updateElement(selectedElementIndex, {
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
                      updateElement(selectedElementIndex, {
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
                    updateElement(selectedElementIndex, { imageUrl: e.target.value })
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
                  updateElement(selectedElementIndex, {
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
              Select an element to edit its properties
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
