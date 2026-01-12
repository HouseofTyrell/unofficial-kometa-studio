import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './ConfirmDialog.module.css';

export interface ConfirmDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Title of the dialog */
  title: string;
  /** Main message to display */
  message: string;
  /** Optional warning text shown in a highlighted box */
  warning?: string;
  /** Text for the confirm button */
  confirmText?: string;
  /** Text for the cancel button */
  cancelText?: string;
  /** Whether this is a dangerous/destructive action */
  isDanger?: boolean;
  /** If set, user must type this text to confirm (for extra dangerous actions) */
  confirmPhrase?: string;
  /** Called when user confirms */
  onConfirm: () => void;
  /** Called when user cancels */
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  warning,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  confirmPhrase,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [typedPhrase, setTypedPhrase] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Reset typed phrase when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setTypedPhrase('');
      // Focus the input if there's a confirm phrase, otherwise focus confirm button
      setTimeout(() => {
        if (confirmPhrase && inputRef.current) {
          inputRef.current.focus();
        } else if (confirmButtonRef.current) {
          confirmButtonRef.current.focus();
        }
      }, 0);
    }
  }, [isOpen, confirmPhrase]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Enter' && !confirmPhrase) {
        // Only allow Enter to confirm if there's no phrase requirement
        e.preventDefault();
        onConfirm();
      }
    },
    [isOpen, onCancel, onConfirm, confirmPhrase]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Trap focus within the dialog
  useEffect(() => {
    if (!isOpen) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusableElements = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const canConfirm = !confirmPhrase || typedPhrase === confirmPhrase;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div
        ref={dialogRef}
        className={`${styles.dialog} ${isDanger ? styles.dialogDanger : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div className={styles.header}>
          <h2
            id="confirm-dialog-title"
            className={`${styles.title} ${isDanger ? styles.titleDanger : ''}`}
          >
            {isDanger && <span className={styles.icon}>&#9888;</span>}
            {title}
          </h2>
          <button
            className={styles.closeButton}
            onClick={onCancel}
            aria-label="Close dialog"
            type="button"
          >
            &times;
          </button>
        </div>

        <div className={styles.content}>
          <p className={styles.message}>{message}</p>

          {warning && <div className={styles.warning}>{warning}</div>}

          {confirmPhrase && (
            <div className={styles.confirmInputGroup}>
              <label className={styles.confirmLabel}>
                Type <code>{confirmPhrase}</code> to confirm:
              </label>
              <input
                ref={inputRef}
                type="text"
                className={styles.confirmInput}
                value={typedPhrase}
                onChange={(e) => setTypedPhrase(e.target.value)}
                placeholder={confirmPhrase}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onCancel} type="button">
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            className={`${styles.confirmButton} ${isDanger ? styles.confirmButtonDanger : ''}`}
            onClick={handleConfirm}
            disabled={!canConfirm}
            type="button"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
