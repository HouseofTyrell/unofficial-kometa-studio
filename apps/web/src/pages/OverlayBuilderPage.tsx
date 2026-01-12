/**
 * OverlayBuilderPage
 *
 * Visual overlay builder with real-time preview, preset selection,
 * and YAML code generation. Integrates with TMDB for poster images
 * and Plex for media metadata.
 */

import { useState, useEffect, useCallback } from 'react';
import styles from './OverlayBuilderPage.module.css';

// Custom hooks
import { useProfiles } from '../hooks/useProfiles';
import { useConfigs } from '../hooks/useConfigs';
import { useMediaSelection, MediaMetadata } from '../hooks/useMediaSelection';
import { useNotification } from '../hooks/useNotification';
import { useHistory, useHistoryKeyboard } from '../hooks/useHistory';

// Components
import { Notification } from '../components/overlay/Notification';
import { OverlayBuilderHeader } from '../components/overlay/OverlayBuilderHeader';
import { PosterSection } from '../components/overlay/PosterSection';
import { EditorSection } from '../components/overlay/EditorSection';
import { SaveOverlayDialog } from '../components/overlay/SaveOverlayDialog';
import { GitHubImport } from '../components/overlay/GitHubImport';

// Services
import { KometaDefaultsService } from '../services/kometa-defaults.service';
import { OVERLAY_PRESETS } from '../components/overlay/OverlayPresetSelector';
import { ELEMENT_BOUNDS } from '../constants/overlay.constants';
import type { OverlayElement } from '../components/overlay/PosterPreview';

// Re-export MediaMetadata type for external use
export type { MediaMetadata } from '../hooks/useMediaSelection';

export function OverlayBuilderPage() {
  // Profile and config management
  const {
    profiles,
    selectedProfile,
    profileReady,
    needsApiKey,
    loading,
    setSelectedProfile,
    handleApiKeySubmit,
  } = useProfiles();

  const { configs, selectedConfig, setSelectedConfig, overlayFiles, overlayAssets } = useConfigs();

  // Media selection and metadata
  const {
    mediaType,
    setMediaType,
    currentMedia,
    posterUrl,
    mediaMetadata,
    posterType,
    availableSeasons,
    selectedSeason,
    availableEpisodes,
    selectedEpisode,
    setSelectedEpisode,
    handleMediaSelect,
    handlePosterTypeChange,
    handleSeasonChange,
  } = useMediaSelection(selectedProfile, profileReady);

  // Notifications
  const { notification, showNotification, clearNotification } = useNotification();

  // Overlay elements with undo/redo
  const {
    state: overlayElements,
    setState: setOverlayElements,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory<OverlayElement[]>([]);

  // Element selection
  const [selectedElementIndex, setSelectedElementIndex] = useState<number | null>(null);
  const [selectedElementIndices, setSelectedElementIndices] = useState<number[]>([]);

  // Preset selection
  const [selectedPresetId, setSelectedPresetId] = useState<string>('none');

  // View mode
  const [showCode, setShowCode] = useState(false);

  // Dialogs
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [_importSource, setImportSource] = useState<string | null>(null);

  // Enable keyboard shortcuts for undo/redo
  useHistoryKeyboard(undo, redo, canUndo, canRedo);

  // Check for community overlay from gallery on mount
  useEffect(() => {
    const communityData = sessionStorage.getItem('communityOverlay');
    if (communityData) {
      try {
        const { elements, source, name } = JSON.parse(communityData);
        if (elements && elements.length > 0) {
          setOverlayElements(elements);
          setImportSource(source);
          setSelectedPresetId('none');
          showNotification(`Loaded "${name}" overlay from Community Gallery`, 'success');
        }
      } catch (err) {
        console.error('Failed to load community overlay:', err);
      } finally {
        sessionStorage.removeItem('communityOverlay');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Run once on mount
  }, []);

  // Auto-load overlays when metadata changes
  const autoLoadOverlaysForMedia = useCallback(
    async (metadata: MediaMetadata) => {
      if (!selectedConfig || overlayFiles.length === 0) {
        return;
      }

      const kometaService = new KometaDefaultsService();
      const allElements: OverlayElement[] = [];

      const libraryName = mediaType === 'movie' ? 'Movies' : 'TV Shows';

      let currentLevel = 'movie';
      if (mediaType === 'tv') {
        if (posterType === 'episode') {
          currentLevel = 'episode';
        } else if (posterType === 'season') {
          currentLevel = 'season';
        } else {
          currentLevel = 'series';
        }
      }

      const overlaysToLoad = overlayFiles.filter((overlay) => {
        if (overlay.libraryName !== libraryName) return false;
        if (!overlay.file.default) return false;
        if (mediaType === 'tv' && overlay.level) {
          return overlay.level === currentLevel;
        }
        return true;
      });

      for (const overlayFile of overlaysToLoad) {
        try {
          const overlayName = overlayFile.file.default;
          if (!overlayName) continue;

          const templateVars = overlayFile.file.template_variables;

          const metadataForOverlay = {
            resolution: metadata.resolution,
            videoCodec: metadata.videoCodec,
            audioCodec: metadata.audioCodec,
            audioChannels: metadata.audioChannels,
            status: metadata.status,
            ratings: {
              tmdb: metadata.ratings?.tmdb,
              imdb: metadata.ratings?.imdb,
            },
          };

          const elements = kometaService.generateOverlaysForMedia(
            overlayName,
            metadataForOverlay,
            templateVars,
            overlayAssets
          );

          allElements.push(...elements);
        } catch (error) {
          console.error(`Failed to generate overlay for ${overlayFile.file.default}:`, error);
        }
      }

      if (allElements.length > 0) {
        setOverlayElements(allElements);
        setSelectedPresetId('none');
        showNotification(
          `Loaded ${allElements.length} overlay element(s) from ${overlaysToLoad.length} overlay file(s) for ${currentLevel} level.`,
          'success'
        );
      } else {
        showNotification(
          `No overlays found for ${currentLevel} level. This media may not match the conditions, or may be missing required metadata (resolution, codecs, ratings). Try adding Plex credentials for more accurate data.`,
          'info'
        );
      }
    },
    [selectedConfig, overlayFiles, overlayAssets, mediaType, posterType, setOverlayElements, showNotification]
  );

  // Load overlays when metadata changes
  useEffect(() => {
    if (mediaMetadata && selectedConfig && overlayFiles.length > 0) {
      autoLoadOverlaysForMedia(mediaMetadata);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only trigger on metadata/overlay changes
  }, [mediaMetadata, overlayFiles, posterType]);

  // Handlers
  const handlePresetChange = useCallback(
    (presetId: string) => {
      setSelectedPresetId(presetId);
      const preset = OVERLAY_PRESETS.find((p) => p.id === presetId);
      if (preset) {
        setOverlayElements([...preset.elements]);
      }
    },
    [setOverlayElements]
  );

  const handleElementMove = useCallback(
    (index: number, x: number, y: number) => {
      setOverlayElements((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          x,
          y,
          position: undefined,
          offset: undefined,
        };
        return updated;
      });
    },
    [setOverlayElements]
  );

  const handleElementsMove = useCallback(
    (indices: number[], deltaX: number, deltaY: number) => {
      setOverlayElements((prev) => {
        const updated = [...prev];
        for (const index of indices) {
          const element = updated[index];
          const currentX = element.x || 0;
          const currentY = element.y || 0;
          const newX = Math.max(0, Math.min(ELEMENT_BOUNDS.MAX_X, currentX + deltaX));
          const newY = Math.max(0, Math.min(ELEMENT_BOUNDS.MAX_Y, currentY + deltaY));

          updated[index] = {
            ...element,
            x: Math.round(newX),
            y: Math.round(newY),
            position: undefined,
            offset: undefined,
          };
        }
        return updated;
      });
    },
    [setOverlayElements]
  );

  const handleGitHubImport = useCallback(
    (elements: OverlayElement[], _yamlContent: string, sourceUrl: string) => {
      setOverlayElements(elements);
      setImportSource(sourceUrl);
      setSelectedPresetId('none');
      setShowImportDialog(false);
      showNotification(`Imported ${elements.length} overlay element(s) from GitHub`, 'success');
    },
    [setOverlayElements, showNotification]
  );

  const handleApiKeySubmitWithNotification = useCallback(async () => {
    const success = await handleApiKeySubmit();
    if (success) {
      showNotification('TMDB API key saved to profile!', 'success');
    } else {
      showNotification('Failed to save API key to profile', 'error');
    }
  }, [handleApiKeySubmit, showNotification]);

  // Loading state
  if (loading) {
    return <div className={styles.page}>Loading...</div>;
  }

  // API key needed state
  if (needsApiKey) {
    return (
      <div className={styles.page}>
        <div className={styles.compactHeader}>
          <h1 className={styles.headerTitle}>Overlay Builder</h1>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span>⚠️ TMDB API key not found in profile.</span>
            <button onClick={handleApiKeySubmitWithNotification} className={styles.button}>
              Add API Key
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={clearNotification}
        />
      )}

      <OverlayBuilderHeader
        profiles={profiles}
        selectedProfile={selectedProfile}
        onProfileChange={setSelectedProfile}
        configs={configs}
        selectedConfig={selectedConfig}
        onConfigChange={setSelectedConfig}
        mediaType={mediaType}
        onMediaTypeChange={setMediaType}
        onMediaSelect={handleMediaSelect}
        currentMedia={currentMedia}
        posterType={posterType}
        onPosterTypeChange={handlePosterTypeChange}
        availableSeasons={availableSeasons}
        selectedSeason={selectedSeason}
        onSeasonChange={handleSeasonChange}
        availableEpisodes={availableEpisodes}
        selectedEpisode={selectedEpisode}
        onEpisodeChange={setSelectedEpisode}
        overlayCount={overlayElements.length}
        onSave={() => setShowSaveDialog(true)}
      />

      <div className={styles.mainContent}>
        <div className={styles.previewSection}>
          <PosterSection
            currentMedia={currentMedia}
            posterUrl={posterUrl}
            mediaMetadata={mediaMetadata}
            mediaType={mediaType}
            posterType={posterType}
            overlayElements={overlayElements}
            selectedElementIndex={selectedElementIndex}
            selectedElementIndices={selectedElementIndices}
            onElementSelect={setSelectedElementIndex}
            onElementsSelect={setSelectedElementIndices}
            onElementMove={handleElementMove}
            onElementsMove={handleElementsMove}
          />
        </div>

        <EditorSection
          overlayElements={overlayElements}
          selectedElementIndex={selectedElementIndex}
          selectedElementIndices={selectedElementIndices}
          onElementsChange={setOverlayElements}
          onSelectedElementChange={setSelectedElementIndex}
          onSelectedElementsChange={setSelectedElementIndices}
          selectedPresetId={selectedPresetId}
          onPresetChange={handlePresetChange}
          showCode={showCode}
          onShowCodeChange={setShowCode}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          onImport={() => setShowImportDialog(true)}
        />
      </div>

      {showSaveDialog && (
        <SaveOverlayDialog
          overlayElements={overlayElements}
          mediaType={mediaType}
          onClose={() => setShowSaveDialog(false)}
        />
      )}

      {showImportDialog && (
        <GitHubImport onImport={handleGitHubImport} onClose={() => setShowImportDialog(false)} />
      )}
    </div>
  );
}
