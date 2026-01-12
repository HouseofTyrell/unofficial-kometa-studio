import { useState } from 'react';
import styles from './ValidationPanel.module.css';

export interface ValidationIssue {
  type: 'error' | 'warning';
  path: string[];
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface ValidationPanelProps {
  validation: ValidationResult | null;
  onIssueClick?: (issue: ValidationIssue) => void;
  compact?: boolean;
}

export function ValidationPanel({
  validation,
  onIssueClick,
  compact = false,
}: ValidationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!validation) {
    return null;
  }

  const totalIssues = validation.errors.length + validation.warnings.length;

  if (totalIssues === 0) {
    if (compact) {
      return (
        <div className={styles.successBadge} title="No validation issues">
          <span className={styles.checkmark}>✓</span>
        </div>
      );
    }
    return (
      <div className={styles.successPanel}>
        <span className={styles.checkmark}>✓</span>
        <span>Configuration is valid</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div
        className={`${styles.badge} ${validation.errors.length > 0 ? styles.errorBadge : styles.warningBadge}`}
        title={`${validation.errors.length} errors, ${validation.warnings.length} warnings`}
      >
        {totalIssues}
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <button
        className={styles.header}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <div className={styles.summary}>
          {validation.errors.length > 0 && (
            <span className={styles.errorCount}>
              <span className={styles.icon}>!</span>
              {validation.errors.length} error{validation.errors.length !== 1 ? 's' : ''}
            </span>
          )}
          {validation.warnings.length > 0 && (
            <span className={styles.warningCount}>
              <span className={styles.icon}>⚠</span>
              {validation.warnings.length} warning{validation.warnings.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <span className={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
      </button>

      {isExpanded && (
        <div className={styles.issues}>
          {validation.errors.map((issue, index) => (
            <button
              key={`error-${index}`}
              className={`${styles.issue} ${styles.error}`}
              onClick={() => onIssueClick?.(issue)}
              type="button"
            >
              <span className={styles.issueIcon}>!</span>
              <div className={styles.issueContent}>
                <span className={styles.issuePath}>{issue.path.join(' › ')}</span>
                <span className={styles.issueMessage}>{issue.message}</span>
              </div>
            </button>
          ))}
          {validation.warnings.map((issue, index) => (
            <button
              key={`warning-${index}`}
              className={`${styles.issue} ${styles.warning}`}
              onClick={() => onIssueClick?.(issue)}
              type="button"
            >
              <span className={styles.issueIcon}>⚠</span>
              <div className={styles.issueContent}>
                <span className={styles.issuePath}>{issue.path.join(' › ')}</span>
                <span className={styles.issueMessage}>{issue.message}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Tab badge component for showing validation status on tabs
export interface ValidationTabBadgeProps {
  section: 'settings' | 'libraries' | 'integrations';
  validation: ValidationResult | null;
}

export function ValidationTabBadge({ section, validation }: ValidationTabBadgeProps) {
  if (!validation) return null;

  // Filter issues for this section
  const sectionErrors = validation.errors.filter((issue) => {
    const rootPath = issue.path[0]?.toLowerCase();
    if (section === 'settings') return rootPath === 'settings';
    if (section === 'libraries') return rootPath === 'libraries';
    if (section === 'integrations') {
      return ['plex', 'tmdb', 'tautulli', 'mdblist', 'radarr', 'sonarr', 'trakt'].includes(
        rootPath
      );
    }
    return false;
  });

  const sectionWarnings = validation.warnings.filter((issue) => {
    const rootPath = issue.path[0]?.toLowerCase();
    if (section === 'settings') return rootPath === 'settings';
    if (section === 'libraries') return rootPath === 'libraries';
    if (section === 'integrations') {
      return ['plex', 'tmdb', 'tautulli', 'mdblist', 'radarr', 'sonarr', 'trakt'].includes(
        rootPath
      );
    }
    return false;
  });

  const totalIssues = sectionErrors.length + sectionWarnings.length;

  if (totalIssues === 0) return null;

  return (
    <span
      className={`${styles.tabBadge} ${sectionErrors.length > 0 ? styles.tabBadgeError : styles.tabBadgeWarning}`}
      title={`${sectionErrors.length} errors, ${sectionWarnings.length} warnings`}
    >
      {totalIssues}
    </span>
  );
}
