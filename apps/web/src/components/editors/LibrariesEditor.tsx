import { useState } from 'react';
import styles from './LibrariesEditor.module.css';
import { LibraryEditor } from './LibraryEditor';

interface LibrariesEditorProps {
  libraries: Record<string, any>;
  onChange: (libraries: Record<string, any>) => void;
}

export function LibrariesEditor({ libraries, onChange }: LibrariesEditorProps) {
  const [expandedLibrary, setExpandedLibrary] = useState<string | null>(
    Object.keys(libraries)[0] || null
  );
  const [showNewLibraryForm, setShowNewLibraryForm] = useState(false);
  const [newLibraryName, setNewLibraryName] = useState('');

  const handleAddLibrary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLibraryName.trim()) return;

    onChange({
      ...libraries,
      [newLibraryName]: {},
    });
    setNewLibraryName('');
    setShowNewLibraryForm(false);
    setExpandedLibrary(newLibraryName);
  };

  const handleDeleteLibrary = (name: string) => {
    if (!confirm(`Delete library "${name}"?`)) return;

    const { [name]: _, ...rest } = libraries;
    onChange(rest);
    if (expandedLibrary === name) {
      setExpandedLibrary(Object.keys(rest)[0] || null);
    }
  };

  const handleLibraryChange = (name: string, library: any) => {
    onChange({
      ...libraries,
      [name]: library,
    });
  };

  const libraryNames = Object.keys(libraries);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Libraries</h2>
        <button onClick={() => setShowNewLibraryForm(true)} className={styles.addButton}>
          + Add Library
        </button>
      </div>

      {showNewLibraryForm && (
        <form onSubmit={handleAddLibrary} className={styles.newLibraryForm}>
          <input
            type="text"
            value={newLibraryName}
            onChange={(e) => setNewLibraryName(e.target.value)}
            placeholder="Library name (e.g., Movies, TV Shows)"
            className={styles.input}
            autoFocus
          />
          <div className={styles.formButtons}>
            <button type="submit" className={styles.button}>
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setShowNewLibraryForm(false);
                setNewLibraryName('');
              }}
              className={styles.buttonSecondary}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {libraryNames.length === 0 ? (
        <div className={styles.emptyState}>No libraries configured. Add one to get started.</div>
      ) : (
        <div className={styles.libraryList}>
          {libraryNames.map((name) => (
            <div key={name} className={styles.libraryItem}>
              <div
                className={styles.libraryHeader}
                onClick={() => setExpandedLibrary(expandedLibrary === name ? null : name)}
              >
                <span className={styles.arrow}>{expandedLibrary === name ? '▼' : '▶'}</span>
                <span className={styles.libraryName}>{name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteLibrary(name);
                  }}
                  className={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
              {expandedLibrary === name && (
                <div className={styles.libraryContent}>
                  <LibraryEditor
                    library={libraries[name]}
                    onChange={(lib) => handleLibraryChange(name, lib)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
