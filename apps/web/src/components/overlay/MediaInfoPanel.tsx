/**
 * MediaInfoPanel Component
 *
 * Displays media metadata including resolution, codecs, and ratings.
 */

import styles from '../../pages/OverlayBuilderPage.module.css';
import type { MediaMetadata } from '../../hooks/useMediaSelection';

export interface MediaInfoPanelProps {
  metadata: MediaMetadata;
}

export function MediaInfoPanel({ metadata }: MediaInfoPanelProps) {
  return (
    <div className={styles.mediaInfoPanel}>
      {metadata.resolution && (
        <div className={styles.mediaInfoItem}>
          <strong>Resolution:</strong> <span>{metadata.resolution}</span>
        </div>
      )}
      {metadata.videoCodec && (
        <div className={styles.mediaInfoItem}>
          <strong>Video:</strong> <span>{metadata.videoCodec}</span>
        </div>
      )}
      {metadata.audioCodec && (
        <div className={styles.mediaInfoItem}>
          <strong>Audio:</strong>{' '}
          <span>
            {metadata.audioCodec} {metadata.audioChannels}
          </span>
        </div>
      )}
      {metadata.ratings && (
        <>
          <div className={styles.mediaInfoItem}>
            <strong>TMDB:</strong> <span>{metadata.ratings.tmdb.toFixed(1)}</span>
          </div>
          {metadata.ratings.imdb && (
            <div className={styles.mediaInfoItem}>
              <strong>IMDb:</strong> <span>{metadata.ratings.imdb.toFixed(1)}</span>
            </div>
          )}
        </>
      )}
      {!metadata.resolution && !metadata.videoCodec && (
        <div className={styles.mediaInfoItem} style={{ opacity: 0.7 }}>
          <span>No Plex data</span>
        </div>
      )}
    </div>
  );
}
