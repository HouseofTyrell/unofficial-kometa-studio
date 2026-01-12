/**
 * Custom hook for notification management
 *
 * Handles showing and auto-dismissing notifications.
 */

import { useState, useEffect, useCallback } from 'react';

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  message: string;
  type: NotificationType;
}

export interface UseNotificationResult {
  notification: Notification | null;
  showNotification: (message: string, type: NotificationType) => void;
  clearNotification: () => void;
}

export function useNotification(autoDismissMs = 5000): UseNotificationResult {
  const [notification, setNotification] = useState<Notification | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), autoDismissMs);
      return () => clearTimeout(timer);
    }
  }, [notification, autoDismissMs]);

  const showNotification = useCallback((message: string, type: NotificationType) => {
    setNotification({ message, type });
  }, []);

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return {
    notification,
    showNotification,
    clearNotification,
  };
}
