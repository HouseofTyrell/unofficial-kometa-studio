import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './OverlayBuilderPage.module.css';
import { profileApi, configApi } from '../api/client';
import {
  TmdbService,
  DEFAULT_PREVIEW_TITLES,
  TmdbMovie,
  TmdbTVShow,
  TmdbSeason,
  TmdbEpisode,
  TmdbRatings,
} from '../services/tmdb.service';
import { KometaDefaultsService } from '../services/kometa-defaults.service';
import { PlexService, PlexMediaInfo } from '../services/plex.service';

export interface MediaMetadata {
  // Basic info
  title: string;
  year?: number;
  status?: string; // For TV shows: "Ended", "Canceled", "Returning Series", etc.

  // Technical details
  resolution?: string;
  videoCodec?: string;
  audioCodec?: string;
  audioChannels?: string;

  // Ratings
  ratings?: TmdbRatings;

  // Plex-specific
  plexInfo?: PlexMediaInfo;
}
import { PosterPreview, OverlayElement } from '../components/overlay/PosterPreview';
import {
  OverlayPresetSelector,
  OVERLAY_PRESETS,
} from '../components/overlay/OverlayPresetSelector';
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

  // Config and overlay files
  const [configs, setConfigs] = useState<any[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<string>('');
  const [overlayFiles, setOverlayFiles] = useState<
    Array<{
      libraryName: string;
      file: any;
      index: number;
      overlayType?: string;
      overlayPath?: string;
      level?: string;
      customFilePath?: string;
    }>
  >([]);
  const [overlayAssets, setOverlayAssets] = useState<Record<string, string>>({});

  // Media selection
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');
  const [currentMedia, setCurrentMedia] = useState<TmdbMovie | TmdbTVShow | null>(null);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [mediaMetadata, setMediaMetadata] = useState<MediaMetadata | null>(null);

  // TV Show hierarchy
  const [posterType, setPosterType] = useState<'show' | 'season' | 'episode'>('show');
  const [availableSeasons, setAvailableSeasons] = useState<number[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [availableEpisodes, setAvailableEpisodes] = useState<number[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);

  // Overlay configuration
  const [selectedPresetId, setSelectedPresetId] = useState<string>('none');
  const [overlayElements, setOverlayElements] = useState<OverlayElement[]>([]);
  const [selectedElementIndex, setSelectedElementIndex] = useState<number | null>(null);

  // View mode - now supports split view
  const [showCode, setShowCode] = useState(false);

  // Save dialog
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Notification state
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  useEffect(() => {
    loadProfiles();
    loadConfigs();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    if (tmdbApiKey) {
      loadDefaultPreview();
    }
  }, [tmdbApiKey, mediaType]);

  // Load seasons when a TV show is selected
  useEffect(() => {
    if (mediaType === 'tv' && currentMedia && tmdbApiKey) {
      loadSeasons();
    }
  }, [currentMedia, mediaType, tmdbApiKey]);

  // Load poster when poster type or season/episode changes
  useEffect(() => {
    if (tmdbApiKey && currentMedia) {
      loadPosterForType();
    }
  }, [posterType, selectedSeason, selectedEpisode]);

  // Load overlay files when config is selected
  useEffect(() => {
    if (selectedConfig) {
      loadOverlayFiles();
    }
  }, [selectedConfig]);

  // Auto-load all overlays when media metadata changes or poster type changes (replicating Kometa behavior)
  useEffect(() => {
    if (mediaMetadata && selectedConfig && overlayFiles.length > 0) {
      autoLoadOverlaysForMedia(mediaMetadata);
    }
  }, [mediaMetadata, overlayFiles, posterType]);

  const loadProfiles = async () => {
    try {
      const { profiles: profileList } = await profileApi.list();
      setProfiles(profileList);

      if (profileList.length === 0) {
        setNotification({
          message: 'Please create a profile first with your TMDB API key.',
          type: 'info',
        });
        navigate('/profiles');
        return;
      }

      // Auto-select first profile
      const firstProfile = profileList[0];
      setSelectedProfile(firstProfile.id);
      await checkProfileForApiKey(firstProfile.id);
    } catch (error) {
      console.error('Failed to load profiles:', error);
      setNotification({
        message: 'Failed to load profiles',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadConfigs = async () => {
    try {
      const { configs: configList } = await configApi.list();
      setConfigs(configList);

      // Auto-select first config if available
      if (configList.length > 0) {
        setSelectedConfig(configList[0].id);
      }
    } catch (error) {
      console.error('Failed to load configs:', error);
    }
  };

  const loadOverlayFiles = async () => {
    if (!selectedConfig) return;

    try {
      // Load overlay files
      const { overlayFiles: files } = await configApi.getOverlayFiles(selectedConfig);
      console.log('📄 Loaded overlay files from config:', files);
      console.log('📊 Overlay summary:', {
        total: files.length,
        byLibrary: files.reduce((acc: any, f) => {
          acc[f.libraryName] = (acc[f.libraryName] || 0) + 1;
          return acc;
        }, {}),
        byLevel: files.reduce((acc: any, f) => {
          const level = f.level || 'unknown';
          acc[level] = (acc[level] || 0) + 1;
          return acc;
        }, {}),
        byType: files.reduce((acc: any, f) => {
          const type = f.overlayType || 'unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {}),
      });
      setOverlayFiles(files);

      // Load overlay assets (images, logos, etc.)
      const { assets } = await configApi.getOverlayAssets(selectedConfig);
      console.log('🖼️  Loaded overlay assets:', Object.keys(assets).length, 'assets');
      setOverlayAssets(assets);
    } catch (error) {
      console.error('Failed to load overlay files:', error);
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
      setNotification({
        message: 'TMDB API key saved to profile!',
        type: 'success',
      });
    } catch (error) {
      console.error('Failed to save API key:', error);
      setNotification({
        message: 'Failed to save API key to profile',
        type: 'error',
      });
    }
  };

  const loadDefaultPreview = async () => {
    if (!tmdbApiKey) return;

    try {
      const tmdbService = new TmdbService(tmdbApiKey);
      const defaultTitle =
        mediaType === 'movie' ? DEFAULT_PREVIEW_TITLES.movie : DEFAULT_PREVIEW_TITLES.tv;

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

      // Only show notification if it's an API error, not initial load
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('API') || errorMessage.includes('TMDB')) {
        setNotification({
          message: `Failed to load preview from TMDB: ${errorMessage}. Please check your TMDB API key.`,
          type: 'error',
        });
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

  const loadSeasons = async () => {
    if (!currentMedia || !('name' in currentMedia)) return;

    try {
      const tmdbService = new TmdbService(tmdbApiKey);
      const tvShow = await tmdbService.getTVShow(currentMedia.id);

      if (tvShow.seasons && tvShow.seasons.length > 0) {
        // Filter out season 0 (specials) if you want, or keep it
        const seasonNumbers = tvShow.seasons
          .map((s) => s.season_number)
          .filter((n) => n >= 0)
          .sort((a, b) => a - b);

        setAvailableSeasons(seasonNumbers);
        if (seasonNumbers.length > 0) {
          setSelectedSeason(seasonNumbers[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load seasons:', error);
    }
  };

  const loadEpisodesForSeason = async (seasonNumber: number) => {
    if (!currentMedia || !('name' in currentMedia)) return;

    try {
      const tmdbService = new TmdbService(tmdbApiKey);
      const season = await tmdbService.getSeason(currentMedia.id, seasonNumber);

      if (season.episodes && season.episodes.length > 0) {
        const episodeNumbers = season.episodes.map((e) => e.episode_number).sort((a, b) => a - b);

        setAvailableEpisodes(episodeNumbers);
        if (episodeNumbers.length > 0) {
          setSelectedEpisode(episodeNumbers[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load episodes:', error);
    }
  };

  const loadPosterForType = async () => {
    if (!currentMedia) return;

    const tmdbService = new TmdbService(tmdbApiKey);

    try {
      if (mediaType === 'movie') {
        const poster = tmdbService.getPosterUrl(currentMedia.poster_path, 'w500');
        setPosterUrl(poster);
      } else if (mediaType === 'tv') {
        if (posterType === 'show') {
          const poster = tmdbService.getPosterUrl(currentMedia.poster_path, 'w500');
          setPosterUrl(poster);
        } else if (posterType === 'season') {
          const season = await tmdbService.getSeason(currentMedia.id, selectedSeason);
          const poster = tmdbService.getPosterUrl(season.poster_path, 'w500');
          setPosterUrl(poster);
        } else if (posterType === 'episode') {
          const episode = await tmdbService.getEpisode(
            currentMedia.id,
            selectedSeason,
            selectedEpisode
          );
          const still = tmdbService.getStillUrl(episode.still_path, 'w300');
          setPosterUrl(still);
        }
      }
    } catch (error) {
      console.error('Failed to load poster:', error);
    }
  };

  const handleMediaSelect = async (media: TmdbMovie | TmdbTVShow) => {
    setCurrentMedia(media);
    setPosterType('show'); // Reset to show poster
    const tmdbService = new TmdbService(tmdbApiKey);
    const poster = tmdbService.getPosterUrl(media.poster_path, 'w500');
    setPosterUrl(poster);

    // Fetch metadata
    await loadMediaMetadata(media);
  };

  const autoLoadOverlaysForMedia = async (metadata: MediaMetadata) => {
    if (!selectedConfig || overlayFiles.length === 0) {
      console.log('No config or overlay files selected');
      return;
    }

    const kometaService = new KometaDefaultsService();
    const allElements: OverlayElement[] = [];

    // Get the library name based on media type
    const libraryName = mediaType === 'movie' ? 'Movies' : 'TV Shows';

    // Determine the current level for TV shows
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

    // Filter overlay files for the current library and level
    const overlaysToLoad = overlayFiles.filter((overlay) => {
      // Must match library
      if (overlay.libraryName !== libraryName) return false;

      // Must have a default overlay type
      if (!overlay.file.default) return false;

      // For TV shows, must match the current level
      if (mediaType === 'tv' && overlay.level) {
        return overlay.level === currentLevel;
      }

      return true;
    });

    console.log(
      `Loading ${overlaysToLoad.length} applicable overlays for ${libraryName} (level: ${currentLevel})`
    );
    console.log(
      'Overlays to load:',
      overlaysToLoad.map((o) => ({ type: o.overlayType, level: o.level }))
    );

    // Generate overlays for each overlay file
    for (const overlayFile of overlaysToLoad) {
      try {
        const overlayName = overlayFile.file.default;
        if (!overlayName) {
          console.log(`Skipping overlay file without default type`);
          continue;
        }

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

        console.log(
          `Generated ${elements.length} elements for ${overlayName} (${overlayFile.level || 'movie'})`
        );
        allElements.push(...elements);
      } catch (error) {
        console.error(`Failed to generate overlay for ${overlayFile.file.default}:`, error);
      }
    }

    if (allElements.length > 0) {
      console.log('🎨 Setting overlay elements:', JSON.stringify(allElements, null, 2));
      setOverlayElements(allElements);
      setSelectedPresetId('none');
      setNotification({
        message: `Loaded ${allElements.length} overlay element(s) from ${overlaysToLoad.length} overlay file(s) for ${currentLevel} level.`,
        type: 'success',
      });
    } else {
      console.log('No applicable overlays generated - metadata may be missing required fields');
      setNotification({
        message: `No overlays found for ${currentLevel} level. This media may not match the conditions, or may be missing required metadata (resolution, codecs, ratings). Try adding Plex credentials for more accurate data.`,
        type: 'info',
      });
    }
  };

  const loadMediaMetadata = async (media: TmdbMovie | TmdbTVShow) => {
    try {
      const tmdbService = new TmdbService(tmdbApiKey);
      const title = 'title' in media ? media.title : media.name;
      const year =
        'release_date' in media
          ? parseInt(media.release_date?.split('-')[0] || '0')
          : parseInt(media.first_air_date?.split('-')[0] || '0');

      const metadata: MediaMetadata = {
        title,
        year,
      };

      // For TV shows, fetch full details to get status
      if (mediaType === 'tv') {
        try {
          const tvDetails = await tmdbService.getTVShow(media.id);
          console.log('📺 TV Show details:', { status: tvDetails.status, name: tvDetails.name });
          if (tvDetails.status) {
            metadata.status = tvDetails.status;
          }
        } catch (error) {
          console.log('Could not fetch TV show status:', error);
        }
      }

      // Fetch ratings from TMDB
      if (mediaType === 'movie') {
        metadata.ratings = await tmdbService.getMovieRatings(media.id);
      } else {
        metadata.ratings = await tmdbService.getTVShowRatings(media.id);
      }

      // Try to fetch Plex info if profile has Plex configured
      try {
        const profile = await profileApi.get(selectedProfile);
        if (profile.secrets?.plex?.url && profile.secrets?.plex?.token) {
          const plexService = new PlexService({
            url: profile.secrets.plex.url,
            token: profile.secrets.plex.token,
          });

          let plexInfo: PlexMediaInfo | null = null;
          if (mediaType === 'movie') {
            plexInfo = await plexService.searchMovie(title, year);
          } else {
            plexInfo = await plexService.searchTVShow(title);
          }

          if (plexInfo) {
            metadata.plexInfo = plexInfo;
            metadata.resolution = plexInfo.resolution;
            metadata.videoCodec = plexInfo.videoCodec;
            metadata.audioCodec = plexInfo.audioCodec;
            metadata.audioChannels = plexInfo.audioChannels;

            // Merge Plex ratings with TMDB ratings
            // Plex ratings come from Kometa's mass_*_rating_update operations
            if (plexInfo.ratings) {
              console.log('🎯 Merging Plex ratings with TMDB ratings:', {
                plex: plexInfo.ratings,
                tmdb: metadata.ratings,
              });

              // Prefer Plex ratings (which come from Kometa) over TMDB direct fetch
              metadata.ratings = {
                tmdb: plexInfo.ratings.tmdb || metadata.ratings?.tmdb || 0,
                imdb: plexInfo.ratings.imdb || metadata.ratings?.imdb,
              };

              console.log('  ✅ Final merged ratings:', metadata.ratings);
            }
          }
        }
      } catch (error) {
        console.log('Plex info not available:', error);
        // Not critical, continue without Plex data
      }

      setMediaMetadata(metadata);
      console.log('Loaded media metadata:', metadata);

      // Automatically load overlays based on the config
      await autoLoadOverlaysForMedia(metadata);
    } catch (error) {
      console.error('Failed to load media metadata:', error);
    }
  };

  const handlePosterTypeChange = (type: 'show' | 'season' | 'episode') => {
    setPosterType(type);
    if (type === 'season' || type === 'episode') {
      if (availableSeasons.length === 0) {
        loadSeasons();
      }
    }
    if (type === 'episode' && availableEpisodes.length === 0) {
      loadEpisodesForSeason(selectedSeason);
    }
  };

  const handleSeasonChange = (seasonNumber: number) => {
    setSelectedSeason(seasonNumber);
    loadEpisodesForSeason(seasonNumber);
  };

  if (loading) {
    return <div className={styles.page}>Loading...</div>;
  }

  if (needsApiKey) {
    return (
      <div className={styles.page}>
        <div className={styles.compactHeader}>
          <h1 className={styles.headerTitle}>Overlay Builder</h1>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span>⚠️ TMDB API key not found in profile.</span>
            <button onClick={handleApiKeySubmit} className={styles.button}>
              Add API Key
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Fixed notification at top center */}
      {notification && (
        <div className={`${styles.notification} ${styles[notification.type]}`}>
          {notification.message}
          <button
            type="button"
            onClick={() => setNotification(null)}
            className={styles.notificationClose}
          >
            ×
          </button>
        </div>
      )}

      {/* Compact header bar */}
      <div className={styles.compactHeader}>
        <h1 className={styles.headerTitle}>Overlay Builder</h1>

        <select
          value={selectedProfile}
          onChange={(e) => handleProfileChange(e.target.value)}
          className={styles.compactSelect}
        >
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name}
            </option>
          ))}
        </select>

        {configs.length > 0 && (
          <select
            value={selectedConfig}
            onChange={(e) => setSelectedConfig(e.target.value)}
            className={styles.compactSelect}
          >
            <option value="">Select Config...</option>
            {configs.map((config) => (
              <option key={config.id} value={config.id}>
                {config.name}
              </option>
            ))}
          </select>
        )}

        <select
          value={mediaType}
          onChange={(e) => setMediaType(e.target.value as 'movie' | 'tv')}
          className={styles.compactSelect}
        >
          <option value="movie">Movie</option>
          <option value="tv">TV Show</option>
        </select>

        <MediaSearch
          tmdbService={new TmdbService(tmdbApiKey)}
          mediaType={mediaType}
          onMediaSelect={handleMediaSelect}
        />

        {mediaType === 'tv' && currentMedia && (
          <>
            <select
              value={posterType}
              onChange={(e) =>
                handlePosterTypeChange(e.target.value as 'show' | 'season' | 'episode')
              }
              className={styles.compactSelect}
            >
              <option value="show">Show</option>
              <option value="season">Season</option>
              <option value="episode">Episode</option>
            </select>

            {(posterType === 'season' || posterType === 'episode') &&
              availableSeasons.length > 0 && (
                <select
                  value={selectedSeason}
                  onChange={(e) => handleSeasonChange(Number(e.target.value))}
                  className={styles.compactSelect}
                >
                  {availableSeasons.map((seasonNum) => (
                    <option key={seasonNum} value={seasonNum}>
                      S{seasonNum}
                    </option>
                  ))}
                </select>
              )}

            {posterType === 'episode' && availableEpisodes.length > 0 && (
              <select
                value={selectedEpisode}
                onChange={(e) => setSelectedEpisode(Number(e.target.value))}
                className={styles.compactSelect}
              >
                {availableEpisodes.map((episodeNum) => (
                  <option key={episodeNum} value={episodeNum}>
                    E{episodeNum}
                  </option>
                ))}
              </select>
            )}
          </>
        )}

        <button
          onClick={() => setShowSaveDialog(true)}
          disabled={overlayElements.length === 0}
          className={styles.saveButton}
        >
          Save to Config
        </button>
      </div>

      {/* Main content - side by side layout */}
      <div className={styles.mainContent}>
        {/* Left side - Preview */}
        <div className={styles.previewSection}>
          {currentMedia ? (
            <>
              {/* Media info panel at top */}
              {mediaMetadata && (
                <div className={styles.mediaInfoPanel}>
                  {mediaMetadata.resolution && (
                    <div className={styles.mediaInfoItem}>
                      <strong>Resolution:</strong> <span>{mediaMetadata.resolution}</span>
                    </div>
                  )}
                  {mediaMetadata.videoCodec && (
                    <div className={styles.mediaInfoItem}>
                      <strong>Video:</strong> <span>{mediaMetadata.videoCodec}</span>
                    </div>
                  )}
                  {mediaMetadata.audioCodec && (
                    <div className={styles.mediaInfoItem}>
                      <strong>Audio:</strong>{' '}
                      <span>
                        {mediaMetadata.audioCodec} {mediaMetadata.audioChannels}
                      </span>
                    </div>
                  )}
                  {mediaMetadata.ratings && (
                    <>
                      <div className={styles.mediaInfoItem}>
                        <strong>TMDB:</strong> <span>{mediaMetadata.ratings.tmdb.toFixed(1)}</span>
                      </div>
                      {mediaMetadata.ratings.imdb && (
                        <div className={styles.mediaInfoItem}>
                          <strong>IMDb:</strong>{' '}
                          <span>{mediaMetadata.ratings.imdb.toFixed(1)}</span>
                        </div>
                      )}
                    </>
                  )}
                  {!mediaMetadata.resolution && !mediaMetadata.videoCodec && (
                    <div className={styles.mediaInfoItem} style={{ opacity: 0.7 }}>
                      <span>No Plex data</span>
                    </div>
                  )}
                </div>
              )}

              <div className={styles.posterContainer}>
                <h2 className={styles.posterTitle}>
                  {'title' in currentMedia ? currentMedia.title : currentMedia.name}
                  {overlayElements.length > 0 && (
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 'normal',
                        marginLeft: '12px',
                        opacity: 0.7,
                      }}
                    >
                      ({overlayElements.length} overlay{overlayElements.length !== 1 ? 's' : ''})
                    </span>
                  )}
                  {mediaType === 'tv' && (
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 'normal',
                        marginLeft: '12px',
                        opacity: 0.5,
                        textTransform: 'uppercase',
                      }}
                    >
                      • {posterType} Level
                    </span>
                  )}
                </h2>
                <PosterPreview
                  posterUrl={posterUrl}
                  overlayElements={overlayElements}
                  width={500}
                  height={750}
                />
              </div>
            </>
          ) : (
            <div className={styles.loading}>Loading media preview...</div>
          )}
        </div>

        {/* Right side - Editor */}
        <div className={styles.editorSection}>
          <div className={styles.editorHeader}>
            <div className={styles.editorTitle}>
              Overlay Elements
              {overlayElements.length > 0 && (
                <span style={{ fontSize: '14px', fontWeight: 'normal', opacity: 0.7 }}>
                  ({overlayElements.length})
                </span>
              )}
            </div>
            <div className={styles.editorActions}>
              <OverlayPresetSelector
                selectedPresetId={selectedPresetId}
                onPresetChange={handlePresetChange}
              />
              <button className={styles.button} onClick={() => setShowCode(!showCode)}>
                {showCode ? 'Hide Code' : 'Show Code'}
              </button>
            </div>
          </div>

          <div className={styles.editorContent}>
            <OverlayElementEditor
              elements={overlayElements}
              selectedElementIndex={selectedElementIndex}
              onElementsChange={setOverlayElements}
              onSelectedElementChange={setSelectedElementIndex}
            />

            {showCode && (
              <div
                style={{
                  marginTop: '16px',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '16px',
                }}
              >
                <h3
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '12px',
                  }}
                >
                  YAML Code
                </h3>
                <OverlayCodeView elements={overlayElements} onElementsChange={setOverlayElements} />
              </div>
            )}
          </div>
        </div>
      </div>

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
