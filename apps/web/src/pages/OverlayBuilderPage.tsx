import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './OverlayBuilderPage.module.css';
import { profileApi } from '../api/client';
import { TmdbService, DEFAULT_PREVIEW_TITLES, TmdbMovie, TmdbTVShow } from '../services/tmdb.service';
import { PosterPreview, OverlayElement } from '../components/overlay/PosterPreview';
import { OverlayPresetSelector, OVERLAY_PRESETS } from '../components/overlay/OverlayPresetSelector';
import { OverlayElementEditor } from '../components/overlay/OverlayElementEditor';
import { OverlayCodeView } from '../components/overlay/OverlayCodeView';
import { MediaSearch } from '../components/overlay/MediaSearch';
import { SaveOverlayDialog } from '../components/overlay/SaveOverlayDialog';

export function OverlayBuilderPage() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [tmdbApiKey, setTmdbApiKey] = useState<string>('');
  const [needsApiKey, setNeedsApiKey] = useState(false);
  const [loading, setLoading] = useState(true);

  // Media selection
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');
  const [currentMedia, setCurrentMedia] = useState<TmdbMovie | TmdbTVShow | null>(null);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);

  // Overlay configuration
  const [selectedPresetId, setSelectedPresetId] = useState<string>('none');
  const [overlayElements, setOverlayElements] = useState<OverlayElement[]>([]);
  const [selectedElementIndex, setSelectedElementIndex] = useState<number | null>(null);

  // View mode
  const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');

  // Save dialog
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    if (tmdbApiKey) {
      loadDefaultPreview();
    }
  }, [tmdbApiKey, mediaType]);

  const loadProfiles = async () => {
    try {
      const { profiles: profileList } = await profileApi.list();
      setProfiles(profileList);

      if (profileList.length === 0) {
        alert('Please create a profile first with your TMDB API key.');
        navigate('/profiles');
        return;
      }

      // Auto-select first profile
      const firstProfile = profileList[0];
      setSelectedProfile(firstProfile.id);
      await checkProfileForApiKey(firstProfile.id);
    } catch (error) {
      console.error('Failed to load profiles:', error);
      alert('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const checkProfileForApiKey = async (profileId: string) => {
    try {
      const profile = await profileApi.get(profileId);
      const apiKey = profile.secrets?.tmdb?.apikey;

      if (apiKey) {
        setTmdbApiKey(apiKey);
        setNeedsApiKey(false);
      } else {
        setNeedsApiKey(true);
      }
    } catch (error) {
      console.error('Failed to check profile for API key:', error);
      setNeedsApiKey(true);
    }
  };

  const handleProfileChange = async (profileId: string) => {
    setSelectedProfile(profileId);
    await checkProfileForApiKey(profileId);
  };

  const handleApiKeySubmit = async () => {
    const key = prompt('Enter your TMDB API key:');
    if (!key) return;

    try {
      const profile = await profileApi.get(selectedProfile);
      const updatedSecrets = {
        ...profile.secrets,
        tmdb: {
          ...profile.secrets?.tmdb,
          apikey: key,
        },
      };

      await profileApi.update(selectedProfile, { secrets: updatedSecrets });
      setTmdbApiKey(key);
      setNeedsApiKey(false);
      alert('TMDB API key saved to profile!');
    } catch (error) {
      console.error('Failed to save API key:', error);
      alert('Failed to save API key to profile');
    }
  };

  const loadDefaultPreview = async () => {
    if (!tmdbApiKey) return;

    try {
      const tmdbService = new TmdbService(tmdbApiKey);
      const defaultTitle = mediaType === 'movie' ? DEFAULT_PREVIEW_TITLES.movie : DEFAULT_PREVIEW_TITLES.tv;

      let media;
      if (mediaType === 'movie') {
        media = await tmdbService.getMovie(defaultTitle.id);
      } else {
        media = await tmdbService.getTVShow(defaultTitle.id);
      }

      setCurrentMedia(media);
      const poster = tmdbService.getPosterUrl(media.poster_path, 'w500');
      setPosterUrl(poster);
    } catch (error) {
      console.error('Failed to load default preview:', error);

      // Only show alert if it's an API error, not initial load
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('API') || errorMessage.includes('TMDB')) {
        alert(`Failed to load preview from TMDB: ${errorMessage}\n\nPlease check your TMDB API key.`);
      }
    }
  };

  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = OVERLAY_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setOverlayElements([...preset.elements]);
    }
  };

  const handleMediaSelect = (media: TmdbMovie | TmdbTVShow) => {
    setCurrentMedia(media);
    const tmdbService = new TmdbService(tmdbApiKey);
    const poster = tmdbService.getPosterUrl(media.poster_path, 'w500');
    setPosterUrl(poster);
  };

  if (loading) {
    return <div className={styles.page}>Loading...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Overlay Builder</h1>
        <p className={styles.description}>
          Create and preview overlays for your media library
        </p>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <label htmlFor="profile-select">Profile:</label>
          <select
            id="profile-select"
            value={selectedProfile}
            onChange={(e) => handleProfileChange(e.target.value)}
            className={styles.select}
          >
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
        </div>

        {needsApiKey && (
          <div className={styles.warning}>
            <span>⚠️ TMDB API key not found in profile.</span>
            <button onClick={handleApiKeySubmit} className={styles.button}>
              Add API Key
            </button>
          </div>
        )}
      </div>

      {!needsApiKey && (
        <div className={styles.content}>
          <div className={styles.editor}>
            <div className={styles.editorHeader}>
              <h2>Overlay Configuration</h2>
              <div className={styles.viewToggle}>
                <button
                  className={`${styles.toggleButton} ${viewMode === 'visual' ? styles.active : ''}`}
                  onClick={() => setViewMode('visual')}
                >
                  Visual
                </button>
                <button
                  className={`${styles.toggleButton} ${viewMode === 'code' ? styles.active : ''}`}
                  onClick={() => setViewMode('code')}
                >
                  Code
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="media-type">Media Type:</label>
              <select
                id="media-type"
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value as 'movie' | 'tv')}
                className={styles.select}
              >
                <option value="movie">Movie</option>
                <option value="tv">TV Show</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Current Preview:</label>
              <div className={styles.currentMedia}>
                {currentMedia ? (
                  <span>
                    {'title' in currentMedia ? currentMedia.title : currentMedia.name}
                  </span>
                ) : (
                  <span className={styles.placeholder}>Loading...</span>
                )}
              </div>
            </div>

            <MediaSearch
              tmdbService={new TmdbService(tmdbApiKey)}
              mediaType={mediaType}
              onMediaSelect={handleMediaSelect}
            />

            {viewMode === 'visual' ? (
              <>
                <OverlayPresetSelector
                  selectedPresetId={selectedPresetId}
                  onPresetChange={handlePresetChange}
                />

                <OverlayElementEditor
                  elements={overlayElements}
                  selectedElementIndex={selectedElementIndex}
                  onElementsChange={setOverlayElements}
                  onSelectedElementChange={setSelectedElementIndex}
                />
              </>
            ) : (
              <OverlayCodeView
                elements={overlayElements}
                onElementsChange={setOverlayElements}
              />
            )}
          </div>

          <div className={styles.preview}>
            <div className={styles.previewHeader}>
              <h2>Preview</h2>
              <button
                onClick={() => setShowSaveDialog(true)}
                disabled={overlayElements.length === 0}
                className={styles.saveButton}
              >
                Save to Config
              </button>
            </div>
            <PosterPreview
              posterUrl={posterUrl}
              overlayElements={overlayElements}
              width={500}
              height={750}
            />
          </div>
        </div>
      )}

      {showSaveDialog && (
        <SaveOverlayDialog
          overlayElements={overlayElements}
          mediaType={mediaType}
          onClose={() => setShowSaveDialog(false)}
        />
      )}
    </div>
  );
}
