import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as yaml from 'js-yaml';
import styles from './CommunityOverlaysPage.module.css';
import { profileApi } from '../api/client';
import { TmdbService, DEFAULT_PREVIEW_TITLES } from '../services/tmdb.service';
import { PosterPreview, OverlayElement } from '../components/overlay/PosterPreview';

// Define community overlay presets with metadata
interface CommunityOverlay {
  id: string;
  name: string;
  description: string;
  category: string;
  author: string;
  sourceUrl: string;
  thumbnail?: string;
  tags: string[];
  popularity: number; // 1-5 stars
}

const COMMUNITY_OVERLAYS: CommunityOverlay[] = [
  // Kometa Official Defaults
  {
    id: 'resolution',
    name: 'Resolution',
    description: 'Display video resolution (4K, 1080p, 720p, etc.) on posters',
    category: 'Kometa Defaults',
    author: 'Kometa Team',
    sourceUrl:
      'https://raw.githubusercontent.com/Kometa-Team/Kometa/master/defaults/overlays/resolution.yml',
    tags: ['resolution', '4k', '1080p', 'quality'],
    popularity: 5,
  },
  {
    id: 'ratings',
    name: 'Ratings',
    description: 'Show IMDb, TMDB, and Rotten Tomatoes ratings with logos',
    category: 'Kometa Defaults',
    author: 'Kometa Team',
    sourceUrl:
      'https://raw.githubusercontent.com/Kometa-Team/Kometa/master/defaults/overlays/ratings.yml',
    tags: ['ratings', 'imdb', 'tmdb', 'rotten tomatoes'],
    popularity: 5,
  },
  {
    id: 'audio_codec',
    name: 'Audio Codec',
    description: 'Display audio codec information (Dolby Atmos, DTS-X, etc.)',
    category: 'Kometa Defaults',
    author: 'Kometa Team',
    sourceUrl:
      'https://raw.githubusercontent.com/Kometa-Team/Kometa/master/defaults/overlays/audio_codec.yml',
    tags: ['audio', 'codec', 'dolby', 'dts', 'atmos'],
    popularity: 4,
  },
  {
    id: 'video_format',
    name: 'Video Format',
    description: 'Show video format badges (HDR, Dolby Vision, etc.)',
    category: 'Kometa Defaults',
    author: 'Kometa Team',
    sourceUrl:
      'https://raw.githubusercontent.com/Kometa-Team/Kometa/master/defaults/overlays/video_format.yml',
    tags: ['video', 'hdr', 'dolby vision', 'format'],
    popularity: 4,
  },
  {
    id: 'ribbon',
    name: 'Ribbon',
    description: 'Add ribbon banners for new releases, awards, etc.',
    category: 'Kometa Defaults',
    author: 'Kometa Team',
    sourceUrl:
      'https://raw.githubusercontent.com/Kometa-Team/Kometa/master/defaults/overlays/ribbon.yml',
    tags: ['ribbon', 'banner', 'new', 'award'],
    popularity: 4,
  },
  {
    id: 'status',
    name: 'Status (TV Shows)',
    description: 'Show airing status: Returning, Ended, Canceled',
    category: 'Kometa Defaults',
    author: 'Kometa Team',
    sourceUrl:
      'https://raw.githubusercontent.com/Kometa-Team/Kometa/master/defaults/overlays/status.yml',
    tags: ['status', 'tv', 'airing', 'ended', 'canceled'],
    popularity: 4,
  },
  {
    id: 'streaming',
    name: 'Streaming Services',
    description: 'Display streaming platform logos (Netflix, Disney+, etc.)',
    category: 'Kometa Defaults',
    author: 'Kometa Team',
    sourceUrl:
      'https://raw.githubusercontent.com/Kometa-Team/Kometa/master/defaults/overlays/streaming.yml',
    tags: ['streaming', 'netflix', 'disney', 'hbo', 'amazon'],
    popularity: 5,
  },
  {
    id: 'studio',
    name: 'Studio',
    description: 'Show production studio logos on posters',
    category: 'Kometa Defaults',
    author: 'Kometa Team',
    sourceUrl:
      'https://raw.githubusercontent.com/Kometa-Team/Kometa/master/defaults/overlays/studio.yml',
    tags: ['studio', 'production', 'logo'],
    popularity: 3,
  },
  {
    id: 'network',
    name: 'Network',
    description: 'Display TV network logos for shows',
    category: 'Kometa Defaults',
    author: 'Kometa Team',
    sourceUrl:
      'https://raw.githubusercontent.com/Kometa-Team/Kometa/master/defaults/overlays/network.yml',
    tags: ['network', 'tv', 'channel', 'logo'],
    popularity: 3,
  },
  {
    id: 'episode_info',
    name: 'Episode Info',
    description: 'Show season and episode numbers on episode posters',
    category: 'Kometa Defaults',
    author: 'Kometa Team',
    sourceUrl:
      'https://raw.githubusercontent.com/Kometa-Team/Kometa/master/defaults/overlays/episode_info.yml',
    tags: ['episode', 'season', 'tv', 'info'],
    popularity: 3,
  },
  {
    id: 'runtimes',
    name: 'Runtimes',
    description: 'Display movie/episode runtime duration',
    category: 'Kometa Defaults',
    author: 'Kometa Team',
    sourceUrl:
      'https://raw.githubusercontent.com/Kometa-Team/Kometa/master/defaults/overlays/runtimes.yml',
    tags: ['runtime', 'duration', 'time', 'length'],
    popularity: 3,
  },
  {
    id: 'mediastinger',
    name: 'MediaStinger',
    description: 'Indicate if movie has post-credits scene',
    category: 'Kometa Defaults',
    author: 'Kometa Team',
    sourceUrl:
      'https://raw.githubusercontent.com/Kometa-Team/Kometa/master/defaults/overlays/mediastinger.yml',
    tags: ['credits', 'stinger', 'post-credits', 'scene'],
    popularity: 3,
  },
  {
    id: 'versions',
    name: 'Versions',
    description: 'Show file version info (Extended, Directors Cut, etc.)',
    category: 'Kometa Defaults',
    author: 'Kometa Team',
    sourceUrl:
      'https://raw.githubusercontent.com/Kometa-Team/Kometa/master/defaults/overlays/versions.yml',
    tags: ['version', 'edition', 'extended', 'directors cut'],
    popularity: 3,
  },
  {
    id: 'languages',
    name: 'Languages',
    description: 'Display audio/subtitle language flags',
    category: 'Kometa Defaults',
    author: 'Kometa Team',
    sourceUrl:
      'https://raw.githubusercontent.com/Kometa-Team/Kometa/master/defaults/overlays/languages.yml',
    tags: ['language', 'audio', 'subtitle', 'flag'],
    popularity: 4,
  },
  {
    id: 'content_rating',
    name: 'Content Rating',
    description: 'Show age ratings (PG, R, TV-MA, etc.)',
    category: 'Kometa Defaults',
    author: 'Kometa Team',
    sourceUrl:
      'https://raw.githubusercontent.com/Kometa-Team/Kometa/master/defaults/overlays/content_rating_us.yml',
    tags: ['rating', 'age', 'pg', 'r', 'content'],
    popularity: 4,
  },
];

// Group overlays by category
const groupByCategory = (overlays: CommunityOverlay[]): Record<string, CommunityOverlay[]> => {
  return overlays.reduce(
    (acc, overlay) => {
      if (!acc[overlay.category]) {
        acc[overlay.category] = [];
      }
      acc[overlay.category].push(overlay);
      return acc;
    },
    {} as Record<string, CommunityOverlay[]>
  );
};

export function CommunityOverlaysPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedOverlay, setSelectedOverlay] = useState<CommunityOverlay | null>(null);
  const [previewElements, setPreviewElements] = useState<OverlayElement[]>([]);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [yamlContent, setYamlContent] = useState<string>('');

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const { profiles: profileList } = await profileApi.list();
      setProfiles(profileList);
      if (profileList.length > 0) {
        setSelectedProfile(profileList[0].id);
      }
    } catch (err) {
      console.error('Failed to load profiles:', err);
    }
  };

  const loadDefaultPoster = useCallback(async () => {
    if (!selectedProfile) return;

    try {
      const tmdbService = new TmdbService(selectedProfile);
      const movie = await tmdbService.getMovie(DEFAULT_PREVIEW_TITLES.movie.id);
      const poster = tmdbService.getPosterUrl(movie.poster_path, 'w500');
      setPosterUrl(poster);
    } catch (err) {
      console.error('Failed to load default poster:', err);
    }
  }, [selectedProfile]);

  // Load default poster when profile is ready
  useEffect(() => {
    if (selectedProfile) {
      loadDefaultPoster();
    }
  }, [selectedProfile, loadDefaultPoster]);

  // Filter overlays based on search and category
  const filteredOverlays = COMMUNITY_OVERLAYS.filter((overlay) => {
    const matchesSearch =
      !searchQuery ||
      overlay.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      overlay.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      overlay.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = !selectedCategory || overlay.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const groupedOverlays = groupByCategory(filteredOverlays);
  const categories = Object.keys(groupByCategory(COMMUNITY_OVERLAYS));

  // Parse overlay YAML and generate preview elements
  const parseOverlayForPreview = async (overlay: CommunityOverlay) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(overlay.sourceUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const content = await response.text();
      setYamlContent(content);

      const parsed = yaml.load(content) as any;
      const elements: OverlayElement[] = [];
      const overlays = parsed.overlays || parsed;
      const templates = parsed.templates || {};

      // Helper to resolve template
      const resolveTemplate = (overlayDef: any): any => {
        if (!overlayDef.template) return overlayDef;
        const templateName = Array.isArray(overlayDef.template)
          ? overlayDef.template[0]
          : overlayDef.template;
        const template = templates[templateName];
        return template ? { ...template, ...overlayDef } : overlayDef;
      };

      // Get only first few overlays for preview
      const overlayEntries = Object.entries(overlays).slice(0, 5);

      for (const [name, def] of overlayEntries) {
        if (name === 'templates' || name === 'template_variables') continue;

        const overlayDef = resolveTemplate(def as any);

        const getHorizontal = (align: string): 'left' | 'center' | 'right' => {
          if (align === 'left') return 'left';
          if (align === 'right') return 'right';
          return 'center';
        };

        const getVertical = (align: string): 'top' | 'center' | 'bottom' => {
          if (align === 'top') return 'top';
          if (align === 'bottom') return 'bottom';
          return 'center';
        };

        const position = {
          horizontal: getHorizontal(overlayDef.horizontal_align || 'left'),
          vertical: getVertical(overlayDef.vertical_align || 'top'),
        };

        const offset = {
          horizontal: overlayDef.horizontal_offset || 0,
          vertical: overlayDef.vertical_offset || 0,
        };

        if (overlayDef.file || overlayDef.git || overlayDef.url) {
          let imageUrl = overlayDef.url || '';
          if (overlayDef.git) {
            const gitPath = overlayDef.git;
            if (gitPath.startsWith('PMM/') || gitPath.startsWith('Kometa/')) {
              imageUrl = `https://raw.githubusercontent.com/Kometa-Team/Kometa/master/defaults/${gitPath.replace(/^(PMM|Kometa)\//, '')}`;
            } else {
              imageUrl = `https://raw.githubusercontent.com/Kometa-Team/Kometa/master/defaults/overlays/images/${gitPath}`;
            }
          }

          elements.push({
            type: 'image',
            imageUrl,
            position,
            offset,
            width: overlayDef.back_width || 200,
            height: overlayDef.back_height || 100,
          });
        } else {
          const displayText = overlayDef.text || name;
          elements.push({
            type: 'badge',
            content: displayText,
            text: displayText,
            position,
            offset,
            fontSize: overlayDef.font_size || 36,
            fontColor: overlayDef.font_color || '#FFFFFF',
            backgroundColor: overlayDef.back_color || '#00000099',
            width: overlayDef.back_width || 200,
            height: overlayDef.back_height || 80,
            borderRadius: overlayDef.back_radius || 0,
            padding: overlayDef.back_padding || 0,
          });
        }
      }

      setPreviewElements(elements);
    } catch (err) {
      console.error('Failed to load overlay:', err);
      setError(err instanceof Error ? err.message : 'Failed to load overlay');
    } finally {
      setLoading(false);
    }
  };

  // Handle overlay selection
  const handleOverlaySelect = (overlay: CommunityOverlay) => {
    setSelectedOverlay(overlay);
    parseOverlayForPreview(overlay);
  };

  // Open in Overlay Builder with these settings
  const handleUseOverlay = () => {
    if (!selectedOverlay) return;

    // Store overlay data in sessionStorage for the builder to use
    sessionStorage.setItem(
      'communityOverlay',
      JSON.stringify({
        elements: previewElements,
        yaml: yamlContent,
        source: selectedOverlay.sourceUrl,
        name: selectedOverlay.name,
      })
    );

    navigate('/overlay-builder');
  };

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= rating ? styles.starFilled : styles.starEmpty}>
            {star <= rating ? '★' : '☆'}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Community Overlays</h1>
        <p className={styles.subtitle}>
          Browse and preview popular overlay configurations from the Kometa community
        </p>
      </div>

      <div className={styles.toolbar}>
        <input
          type="text"
          placeholder="Search overlays..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
        <div className={styles.categoryFilter}>
          <button
            className={`${styles.categoryButton} ${!selectedCategory ? styles.active : ''}`}
            onClick={() => setSelectedCategory(null)}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              className={`${styles.categoryButton} ${selectedCategory === category ? styles.active : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.gallery}>
          {Object.entries(groupedOverlays).map(([category, overlays]) => (
            <div key={category} className={styles.categorySection}>
              <h2 className={styles.categoryTitle}>{category}</h2>
              <div className={styles.overlayGrid}>
                {overlays.map((overlay) => (
                  <button
                    key={overlay.id}
                    className={`${styles.overlayCard} ${selectedOverlay?.id === overlay.id ? styles.selected : ''}`}
                    onClick={() => handleOverlaySelect(overlay)}
                  >
                    <div className={styles.cardHeader}>
                      <h3 className={styles.overlayName}>{overlay.name}</h3>
                      {renderStars(overlay.popularity)}
                    </div>
                    <p className={styles.overlayDescription}>{overlay.description}</p>
                    <div className={styles.tags}>
                      {overlay.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className={styles.tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className={styles.author}>by {overlay.author}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {filteredOverlays.length === 0 && (
            <div className={styles.emptyState}>
              <p>No overlays found matching your search.</p>
            </div>
          )}
        </div>

        <div className={styles.preview}>
          <div className={styles.previewHeader}>
            <h2>Preview</h2>
            {selectedProfile && profiles.length > 0 && (
              <select
                value={selectedProfile}
                onChange={(e) => setSelectedProfile(e.target.value)}
                className={styles.profileSelect}
              >
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedOverlay ? (
            <div className={styles.previewContent}>
              <div className={styles.selectedInfo}>
                <h3>{selectedOverlay.name}</h3>
                <p>{selectedOverlay.description}</p>
              </div>

              {loading && <div className={styles.loading}>Loading preview...</div>}

              {error && <div className={styles.error}>{error}</div>}

              {!loading && !error && posterUrl && (
                <div className={styles.posterContainer}>
                  <PosterPreview
                    posterUrl={posterUrl}
                    overlayElements={previewElements}
                    width={300}
                    height={450}
                  />
                </div>
              )}

              <button
                className={styles.useButton}
                onClick={handleUseOverlay}
                disabled={loading || previewElements.length === 0}
              >
                Open in Overlay Builder
              </button>

              <div className={styles.sourceLink}>
                <a href={selectedOverlay.sourceUrl} target="_blank" rel="noopener noreferrer">
                  View Source YAML
                </a>
              </div>
            </div>
          ) : (
            <div className={styles.previewPlaceholder}>
              <p>Select an overlay to preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
