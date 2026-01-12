import { useState } from 'react';
import type { FileEntry, TemplateVariables } from '@kometa-studio/shared';
import styles from './FileListEditor.module.css';

type FileType = 'file' | 'default' | 'url' | 'git';

interface FileListEditorProps {
  files: FileEntry[];
  onChange: (files: FileEntry[]) => void;
}

export function FileListEditor({ files, onChange }: FileListEditorProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFileType, setNewFileType] = useState<FileType>('default');
  const [newFileValue, setNewFileValue] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileValue.trim()) return;

    const newFile = {
      [newFileType]: newFileValue,
    } as FileEntry;

    onChange([...files, newFile]);
    setNewFileValue('');
    setShowAddForm(false);
  };

  const handleDelete = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  const handleDuplicate = (index: number) => {
    const duplicated = { ...files[index] };
    onChange([...files.slice(0, index + 1), duplicated, ...files.slice(index + 1)]);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newFiles = [...files];
    [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
    onChange(newFiles);
  };

  const handleMoveDown = (index: number) => {
    if (index === files.length - 1) return;
    const newFiles = [...files];
    [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
    onChange(newFiles);
  };

  const handleUpdateTemplateVars = (index: number, templateVars: TemplateVariables) => {
    const newFiles = [...files];
    newFiles[index] = {
      ...newFiles[index],
      template_variables: templateVars,
    };
    onChange(newFiles);
  };

  const getFileDisplay = (file: FileEntry): { type: string; value: string } => {
    if ('file' in file && file.file) return { type: 'file', value: file.file };
    if ('default' in file && file.default) return { type: 'default', value: file.default };
    if ('url' in file && file.url) return { type: 'url', value: file.url };
    if ('git' in file && file.git) return { type: 'git', value: file.git };
    if ('repo' in file && file.repo) return { type: 'repo', value: file.repo };
    return { type: 'unknown', value: JSON.stringify(file) };
  };

  return (
    <div className={styles.container}>
      {files.length === 0 ? (
        <div className={styles.emptyState}>No files configured. Add one to get started.</div>
      ) : (
        <div className={styles.fileList}>
          {files.map((file, index) => {
            const { type, value } = getFileDisplay(file);
            return (
              <div key={index} className={styles.fileItem}>
                <div className={styles.fileHeader}>
                  <div className={styles.fileInfo}>
                    <span className={styles.fileType}>{type}</span>
                    <span className={styles.fileValue}>{value}</span>
                  </div>
                  <div className={styles.fileActions}>
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className={styles.iconButton}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === files.length - 1}
                      className={styles.iconButton}
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => handleDuplicate(index)}
                      className={styles.iconButton}
                      title="Duplicate"
                    >
                      ⧉
                    </button>
                    <button
                      onClick={() => handleDelete(index)}
                      className={styles.deleteButton}
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {file.template_variables && (
                  <div className={styles.templateVars}>
                    <div className={styles.templateVarsLabel}>Template Variables:</div>
                    <textarea
                      value={JSON.stringify(file.template_variables, null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          handleUpdateTemplateVars(index, parsed);
                        } catch {
                          // Invalid JSON, ignore
                        }
                      }}
                      className={styles.jsonEditor}
                    />
                  </div>
                )}

                {!file.template_variables && (
                  <button
                    onClick={() => handleUpdateTemplateVars(index, {})}
                    className={styles.addVarsButton}
                  >
                    + Add template_variables
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!showAddForm ? (
        <button onClick={() => setShowAddForm(true)} className={styles.addButton}>
          + Add File
        </button>
      ) : (
        <form onSubmit={handleAdd} className={styles.addForm}>
          <div className={styles.addFormRow}>
            <select
              value={newFileType}
              onChange={(e) => setNewFileType(e.target.value as FileType)}
              className={styles.select}
            >
              <option value="default">default</option>
              <option value="file">file</option>
              <option value="url">url</option>
              <option value="git">git</option>
            </select>
            <input
              type="text"
              value={newFileValue}
              onChange={(e) => setNewFileValue(e.target.value)}
              placeholder={`Enter ${newFileType} path`}
              className={styles.input}
              autoFocus
            />
          </div>
          <div className={styles.addFormButtons}>
            <button type="submit" className={styles.button}>
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewFileValue('');
              }}
              className={styles.buttonSecondary}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
