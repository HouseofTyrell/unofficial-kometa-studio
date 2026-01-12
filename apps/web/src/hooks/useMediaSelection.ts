/**
 * Custom hook for media selection and metadata
 *
 * Handles TMDB media search, TV show hierarchy (seasons/episodes),
 * poster loading, and Plex metadata integration.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  TmdbService,
  DEFAULT_PREVIEW_TITLES,
  TmdbMovie,
  TmdbTVShow,
  TmdbRatings,
} from '../services/tmdb.service';
import { PlexService, PlexMediaInfo } from '../services/plex.service';
import { profileApi } from '../api/client';

export interface MediaMetadata {
  title: string;
  year?: number;
  status?: string;
  resolution?: string;
  videoCodec?: string;
  audioCodec?: string;
  audioChannels?: string;
  ratings?: TmdbRatings;
  plexInfo?: PlexMediaInfo;
}

export type MediaType = 'movie' | 'tv';
export type PosterType = 'show' | 'season' | 'episode';

export interface UseMediaSelectionResult {
  mediaType: MediaType;
  setMediaType: (type: MediaType) => void;
  currentMedia: TmdbMovie | TmdbTVShow | null;
  posterUrl: string | null;
  mediaMetadata: MediaMetadata | null;
  posterType: PosterType;
  setPosterType: (type: PosterType) => void;
  availableSeasons: number[];
  selectedSeason: number;
  setSelectedSeason: (season: number) => void;
  availableEpisodes: number[];
  selectedEpisode: number;
  setSelectedEpisode: (episode: number) => void;
  handleMediaSelect: (media: TmdbMovie | TmdbTVShow) => Promise<void>;
  handlePosterTypeChange: (type: PosterType) => void;
  handleSeasonChange: (seasonNumber: number) => void;
}

export function useMediaSelection(
  selectedProfile: string,
  profileReady: boolean
): UseMediaSelectionResult {
  const [mediaType, setMediaType] = useState<MediaType>('movie');
  const [currentMedia, setCurrentMedia] = useState<TmdbMovie | TmdbTVShow | null>(null);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [mediaMetadata, setMediaMetadata] = useState<MediaMetadata | null>(null);

  // TV Show hierarchy
  const [posterType, setPosterType] = useState<PosterType>('show');
  const [availableSeasons, setAvailableSeasons] = useState<number[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [availableEpisodes, setAvailableEpisodes] = useState<number[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);

  // Load default preview when profile is ready
  const loadDefaultPreview = useCallback(async () => {
    if (!selectedProfile || !profileReady) return;

    try {
      const tmdbService = new TmdbService(selectedProfile);
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
    }
  }, [selectedProfile, profileReady, mediaType]);

  useEffect(() => {
    if (profileReady && selectedProfile) {
      loadDefaultPreview();
    }
  }, [profileReady, selectedProfile, mediaType, loadDefaultPreview]);

  // Load seasons when a TV show is selected
  const loadSeasons = useCallback(async () => {
    if (!currentMedia || !('name' in currentMedia) || !selectedProfile) return;

    try {
      const tmdbService = new TmdbService(selectedProfile);
      const tvShow = await tmdbService.getTVShow(currentMedia.id);

      if (tvShow.seasons && tvShow.seasons.length > 0) {
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
  }, [currentMedia, selectedProfile]);

  useEffect(() => {
    if (mediaType === 'tv' && currentMedia && profileReady && selectedProfile) {
      loadSeasons();
    }
  }, [currentMedia, mediaType, profileReady, selectedProfile, loadSeasons]);

  // Load episodes for a season
  const loadEpisodesForSeason = useCallback(
    async (seasonNumber: number) => {
      if (!currentMedia || !('name' in currentMedia) || !selectedProfile) return;

      try {
        const tmdbService = new TmdbService(selectedProfile);
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
    },
    [currentMedia, selectedProfile]
  );

  // Load poster when poster type or season/episode changes
  const loadPosterForType = useCallback(async () => {
    if (!currentMedia || !selectedProfile) return;

    const tmdbService = new TmdbService(selectedProfile);

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
  }, [currentMedia, selectedProfile, mediaType, posterType, selectedSeason, selectedEpisode]);

  useEffect(() => {
    if (profileReady && selectedProfile && currentMedia) {
      loadPosterForType();
    }
  }, [
    posterType,
    selectedSeason,
    selectedEpisode,
    profileReady,
    selectedProfile,
    currentMedia,
    loadPosterForType,
  ]);

  // Load media metadata
  const loadMediaMetadata = useCallback(
    async (media: TmdbMovie | TmdbTVShow): Promise<MediaMetadata | null> => {
      try {
        const tmdbService = new TmdbService(selectedProfile);
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
            if (tvDetails.status) {
              metadata.status = tvDetails.status;
            }
          } catch {
            // Continue without status
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
            const plexService = new PlexService(selectedProfile);

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

              if (plexInfo.ratings) {
                metadata.ratings = {
                  tmdb: plexInfo.ratings.tmdb || metadata.ratings?.tmdb || 0,
                  imdb: plexInfo.ratings.imdb || metadata.ratings?.imdb,
                };
              }
            }
          }
        } catch (error) {
          console.error('Plex info not available:', error);
        }

        return metadata;
      } catch (error) {
        console.error('Failed to load media metadata:', error);
        return null;
      }
    },
    [selectedProfile, mediaType]
  );

  const handleMediaSelect = useCallback(
    async (media: TmdbMovie | TmdbTVShow) => {
      setCurrentMedia(media);
      setPosterType('show');
      const tmdbService = new TmdbService(selectedProfile);
      const poster = tmdbService.getPosterUrl(media.poster_path, 'w500');
      setPosterUrl(poster);

      const metadata = await loadMediaMetadata(media);
      if (metadata) {
        setMediaMetadata(metadata);
      }
    },
    [selectedProfile, loadMediaMetadata]
  );

  const handlePosterTypeChange = useCallback(
    (type: PosterType) => {
      setPosterType(type);
      if (type === 'season' || type === 'episode') {
        if (availableSeasons.length === 0) {
          loadSeasons();
        }
      }
      if (type === 'episode' && availableEpisodes.length === 0) {
        loadEpisodesForSeason(selectedSeason);
      }
    },
    [availableSeasons, availableEpisodes, selectedSeason, loadSeasons, loadEpisodesForSeason]
  );

  const handleSeasonChange = useCallback(
    (seasonNumber: number) => {
      setSelectedSeason(seasonNumber);
      loadEpisodesForSeason(seasonNumber);
    },
    [loadEpisodesForSeason]
  );

  return {
    mediaType,
    setMediaType,
    currentMedia,
    posterUrl,
    mediaMetadata,
    posterType,
    setPosterType,
    availableSeasons,
    selectedSeason,
    setSelectedSeason,
    availableEpisodes,
    selectedEpisode,
    setSelectedEpisode,
    handleMediaSelect,
    handlePosterTypeChange,
    handleSeasonChange,
  };
}
