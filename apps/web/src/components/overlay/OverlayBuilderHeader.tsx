/**
 * OverlayBuilderHeader Component
 *
 * Header bar with profile, config, and media selection controls.
 */

import styles from '../../pages/OverlayBuilderPage.module.css';
import { MediaSearch } from './MediaSearch';
import { TmdbService, TmdbMovie, TmdbTVShow } from '../../services/tmdb.service';
import type { Profile } from '../../hooks/useProfiles';
import type { Config } from '../../hooks/useConfigs';
import type { MediaType, PosterType } from '../../hooks/useMediaSelection';

export interface OverlayBuilderHeaderProps {
  // Profile selection
  profiles: Profile[];
  selectedProfile: string;
  onProfileChange: (profileId: string) => void;

  // Config selection
  configs: Config[];
  selectedConfig: string;
  onConfigChange: (configId: string) => void;

  // Media selection
  mediaType: MediaType;
  onMediaTypeChange: (type: MediaType) => void;
  onMediaSelect: (media: TmdbMovie | TmdbTVShow) => void;

  // TV show hierarchy
  currentMedia: TmdbMovie | TmdbTVShow | null;
  posterType: PosterType;
  onPosterTypeChange: (type: PosterType) => void;
  availableSeasons: number[];
  selectedSeason: number;
  onSeasonChange: (season: number) => void;
  availableEpisodes: number[];
  selectedEpisode: number;
  onEpisodeChange: (episode: number) => void;

  // Save action
  overlayCount: number;
  onSave: () => void;
}

export function OverlayBuilderHeader({
  profiles,
  selectedProfile,
  onProfileChange,
  configs,
  selectedConfig,
  onConfigChange,
  mediaType,
  onMediaTypeChange,
  onMediaSelect,
  currentMedia,
  posterType,
  onPosterTypeChange,
  availableSeasons,
  selectedSeason,
  onSeasonChange,
  availableEpisodes,
  selectedEpisode,
  onEpisodeChange,
  overlayCount,
  onSave,
}: OverlayBuilderHeaderProps) {
  return (
    <div className={styles.compactHeader}>
      <h1 className={styles.headerTitle}>Overlay Builder</h1>

      <select
        value={selectedProfile}
        onChange={(e) => onProfileChange(e.target.value)}
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
          onChange={(e) => onConfigChange(e.target.value)}
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
        onChange={(e) => onMediaTypeChange(e.target.value as MediaType)}
        className={styles.compactSelect}
      >
        <option value="movie">Movie</option>
        <option value="tv">TV Show</option>
      </select>

      <MediaSearch
        tmdbService={new TmdbService(selectedProfile)}
        mediaType={mediaType}
        onMediaSelect={onMediaSelect}
      />

      {mediaType === 'tv' && currentMedia && (
        <>
          <select
            value={posterType}
            onChange={(e) => onPosterTypeChange(e.target.value as PosterType)}
            className={styles.compactSelect}
          >
            <option value="show">Show</option>
            <option value="season">Season</option>
            <option value="episode">Episode</option>
          </select>

          {(posterType === 'season' || posterType === 'episode') && availableSeasons.length > 0 && (
            <select
              value={selectedSeason}
              onChange={(e) => onSeasonChange(Number(e.target.value))}
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
              onChange={(e) => onEpisodeChange(Number(e.target.value))}
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

      <button onClick={onSave} disabled={overlayCount === 0} className={styles.saveButton}>
        Save to Config
      </button>
    </div>
  );
}
