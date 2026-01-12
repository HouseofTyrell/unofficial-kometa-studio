/**
 * PosterSection Component
 *
 * Preview area with zoom controls and interactive overlay positioning.
 */

import { useState } from 'react';
import styles from '../../pages/OverlayBuilderPage.module.css';
import { PosterPreview, OverlayElement } from './PosterPreview';
import { MediaInfoPanel } from './MediaInfoPanel';
import { ZOOM, DISPLAY } from '../../constants/overlay.constants';
import type { TmdbMovie, TmdbTVShow } from '../../services/tmdb.service';
import type { MediaMetadata, MediaType, PosterType } from '../../hooks/useMediaSelection';

export interface PosterSectionProps {
  currentMedia: TmdbMovie | TmdbTVShow | null;
  posterUrl: string | null;
  mediaMetadata: MediaMetadata | null;
  mediaType: MediaType;
  posterType: PosterType;
  overlayElements: OverlayElement[];
  selectedElementIndex: number | null;
  selectedElementIndices: number[];
  onElementSelect: (index: number | null) => void;
  onElementsSelect: (indices: number[]) => void;
  onElementMove: (index: number, x: number, y: number) => void;
  onElementsMove: (indices: number[], deltaX: number, deltaY: number) => void;
}

export function PosterSection({
  currentMedia,
  posterUrl,
  mediaMetadata,
  mediaType,
  posterType,
  overlayElements,
  selectedElementIndex,
  selectedElementIndices,
  onElementSelect,
  onElementsSelect,
  onElementMove,
  onElementsMove,
}: PosterSectionProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(ZOOM.DEFAULT);

  const previewWidth = Math.round(DISPLAY.WIDTH * (zoomLevel / 100));
  const previewHeight = Math.round(DISPLAY.HEIGHT * (zoomLevel / 100));

  if (!currentMedia) {
    return <div className={styles.loading}>Loading media preview...</div>;
  }

  const mediaTitle = 'title' in currentMedia ? currentMedia.title : currentMedia.name;

  return (
    <>
      {mediaMetadata && <MediaInfoPanel metadata={mediaMetadata} />}

      <div className={styles.posterContainer}>
        <div className={styles.posterHeader}>
          <h2 className={styles.posterTitle}>
            {mediaTitle}
            {overlayElements.length > 0 && (
              <span className={styles.overlayCount}>
                ({overlayElements.length} overlay{overlayElements.length !== 1 ? 's' : ''})
              </span>
            )}
            {mediaType === 'tv' && (
              <span className={styles.posterLevel}>• {posterType} Level</span>
            )}
          </h2>
          <div className={styles.zoomControls}>
            <button
              className={styles.zoomButton}
              onClick={() => setZoomLevel((prev) => Math.max(ZOOM.MIN, prev - ZOOM.STEP))}
              disabled={zoomLevel <= ZOOM.MIN}
              title="Zoom out"
            >
              −
            </button>
            <select
              className={styles.zoomSelect}
              value={zoomLevel}
              onChange={(e) => setZoomLevel(Number(e.target.value))}
              title="Zoom level"
            >
              {ZOOM.LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}%
                </option>
              ))}
            </select>
            <button
              className={styles.zoomButton}
              onClick={() => setZoomLevel((prev) => Math.min(ZOOM.MAX, prev + ZOOM.STEP))}
              disabled={zoomLevel >= ZOOM.MAX}
              title="Zoom in"
            >
              +
            </button>
          </div>
        </div>
        <div
          className={styles.posterWrapper}
          style={{ maxHeight: zoomLevel > 100 ? '600px' : 'auto' }}
        >
          <PosterPreview
            posterUrl={posterUrl}
            overlayElements={overlayElements}
            width={previewWidth}
            height={previewHeight}
            interactive={true}
            selectedElementIndex={selectedElementIndex}
            selectedElementIndices={selectedElementIndices}
            onElementSelect={onElementSelect}
            onElementsSelect={onElementsSelect}
            onElementMove={onElementMove}
            onElementsMove={onElementsMove}
          />
        </div>
      </div>
    </>
  );
}
