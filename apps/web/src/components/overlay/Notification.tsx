/**
 * Notification Component
 *
 * Toast-style notification that appears at the top of the screen.
 */

import styles from '../../pages/OverlayBuilderPage.module.css';

export interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export function Notification({ message, type, onClose }: NotificationProps) {
  return (
    <div className={`${styles.notification} ${styles[type]}`}>
      {message}
      <button type="button" onClick={onClose} className={styles.notificationClose}>
        ×
      </button>
    </div>
  );
}
