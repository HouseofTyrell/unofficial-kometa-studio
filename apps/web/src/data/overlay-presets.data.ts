/**
 * Overlay Presets Data
 *
 * This file contains all the preset definitions for the overlay builder.
 * Presets are organized by category and define visual overlay elements
 * that can be applied to media posters.
 *
 * Canvas dimensions: 1000x1500 (Kometa standard)
 */

import { OverlayElement } from '../components/overlay/PosterPreview';

/**
 * Represents a complete overlay preset with metadata and elements
 */
export interface OverlayPreset {
  id: string;
  name: string;
  description: string;
  category?: string;
  elements: OverlayElement[];
}

/**
 * Available preset categories in display order
 */
export const PRESET_CATEGORIES = [
  'Basic',
  'Resolution',
  'HDR',
  'Audio',
  'Format',
  'Ratings',
  'Awards',
  'Status',
  'Streaming',
  'Content Rating',
  'Studio',
  'Network',
  'Versions',
  'MediaStinger',
  'Combined',
] as const;

export type PresetCategory = (typeof PRESET_CATEGORIES)[number];

// =============================================================================
// PRESET DEFINITIONS BY CATEGORY
// =============================================================================

const basicPresets: OverlayPreset[] = [
  {
    id: 'none',
    name: 'None',
    description: 'No overlay',
    category: 'Basic',
    elements: [],
  },
];

const resolutionPresets: OverlayPreset[] = [
  {
    id: '4k-badge',
    name: '4K Badge',
    description: 'Top-right 4K resolution badge',
    category: 'Resolution',
    elements: [
      {
        type: 'badge',
        x: 800,
        y: 40,
        width: 160,
        height: 70,
        text: '4K',
        fontSize: 42,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(33, 150, 243, 0.95)',
        borderRadius: 8,
        padding: 12,
      },
    ],
  },
  {
    id: '4k-uhd-badge',
    name: '4K UHD Badge',
    description: '4K Ultra HD badge with gradient style',
    category: 'Resolution',
    elements: [
      {
        type: 'badge',
        x: 760,
        y: 40,
        width: 200,
        height: 70,
        text: '4K UHD',
        fontSize: 36,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        borderRadius: 8,
        padding: 14,
      },
    ],
  },
  {
    id: '1080p-badge',
    name: '1080p Badge',
    description: 'HD 1080p resolution badge',
    category: 'Resolution',
    elements: [
      {
        type: 'badge',
        x: 800,
        y: 40,
        width: 160,
        height: 70,
        text: '1080p',
        fontSize: 36,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(76, 175, 80, 0.95)',
        borderRadius: 8,
        padding: 12,
      },
    ],
  },
];

const hdrPresets: OverlayPreset[] = [
  {
    id: 'hdr-ribbon',
    name: 'HDR Ribbon',
    description: 'Top banner with HDR text',
    category: 'HDR',
    elements: [
      {
        type: 'ribbon',
        x: 0,
        y: 0,
        width: 1000,
        height: 80,
        text: 'HDR',
        fontSize: 44,
        fontColor: '#000000',
        backgroundColor: 'rgba(255, 193, 7, 0.95)',
      },
    ],
  },
  {
    id: 'dolby-vision',
    name: 'Dolby Vision',
    description: 'Dolby Vision HDR badge',
    category: 'HDR',
    elements: [
      {
        type: 'badge',
        x: 40,
        y: 40,
        width: 220,
        height: 70,
        text: 'DOLBY VISION',
        fontSize: 28,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderRadius: 8,
        padding: 16,
      },
    ],
  },
  {
    id: 'hdr10-plus',
    name: 'HDR10+',
    description: 'HDR10+ badge',
    category: 'HDR',
    elements: [
      {
        type: 'badge',
        x: 40,
        y: 40,
        width: 180,
        height: 70,
        text: 'HDR10+',
        fontSize: 32,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(255, 152, 0, 0.95)',
        borderRadius: 8,
        padding: 14,
      },
    ],
  },
];

const audioPresets: OverlayPreset[] = [
  {
    id: 'dolby-atmos',
    name: 'Dolby Atmos',
    description: 'Dolby Atmos audio badge',
    category: 'Audio',
    elements: [
      {
        type: 'badge',
        x: 40,
        y: 1390,
        width: 220,
        height: 70,
        text: 'DOLBY ATMOS',
        fontSize: 28,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(30, 30, 30, 0.95)',
        borderRadius: 8,
        padding: 16,
      },
    ],
  },
  {
    id: 'dts-x',
    name: 'DTS:X',
    description: 'DTS:X audio badge',
    category: 'Audio',
    elements: [
      {
        type: 'badge',
        x: 40,
        y: 1390,
        width: 160,
        height: 70,
        text: 'DTS:X',
        fontSize: 36,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(220, 53, 69, 0.95)',
        borderRadius: 8,
        padding: 14,
      },
    ],
  },
];

const formatPresets: OverlayPreset[] = [
  {
    id: 'imax',
    name: 'IMAX',
    description: 'IMAX format badge',
    category: 'Format',
    elements: [
      {
        type: 'badge',
        x: 40,
        y: 40,
        width: 180,
        height: 70,
        text: 'IMAX',
        fontSize: 40,
        fontColor: '#00a8e8',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        borderRadius: 8,
        padding: 14,
      },
    ],
  },
  {
    id: 'imax-enhanced',
    name: 'IMAX Enhanced',
    description: 'IMAX Enhanced badge',
    category: 'Format',
    elements: [
      {
        type: 'badge',
        x: 40,
        y: 40,
        width: 260,
        height: 70,
        text: 'IMAX ENHANCED',
        fontSize: 28,
        fontColor: '#00a8e8',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        borderRadius: 8,
        padding: 16,
      },
    ],
  },
  {
    id: 'directors-cut',
    name: "Director's Cut",
    description: "Director's Cut version badge",
    category: 'Format',
    elements: [
      {
        type: 'ribbon',
        x: 0,
        y: 1420,
        width: 1000,
        height: 80,
        text: "DIRECTOR'S CUT",
        fontSize: 36,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(156, 39, 176, 0.95)',
      },
    ],
  },
  {
    id: 'extended-edition',
    name: 'Extended Edition',
    description: 'Extended Edition badge',
    category: 'Format',
    elements: [
      {
        type: 'ribbon',
        x: 0,
        y: 1420,
        width: 1000,
        height: 80,
        text: 'EXTENDED EDITION',
        fontSize: 34,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(103, 58, 183, 0.95)',
      },
    ],
  },
];

const ratingsPresets: OverlayPreset[] = [
  {
    id: 'rating-badge',
    name: 'Rating Badge',
    description: 'Bottom-right rating display',
    category: 'Ratings',
    elements: [
      {
        type: 'badge',
        x: 800,
        y: 1380,
        width: 160,
        height: 80,
        text: '8.5',
        fontSize: 42,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderRadius: 12,
        padding: 16,
      },
    ],
  },
  {
    id: 'imdb-rating',
    name: 'IMDb Rating',
    description: 'IMDb style rating badge',
    category: 'Ratings',
    elements: [
      {
        type: 'badge',
        x: 760,
        y: 1380,
        width: 200,
        height: 80,
        text: 'IMDb 8.5',
        fontSize: 36,
        fontColor: '#000000',
        backgroundColor: 'rgba(245, 197, 24, 0.95)',
        borderRadius: 8,
        padding: 16,
      },
    ],
  },
  {
    id: 'rotten-tomatoes',
    name: 'Rotten Tomatoes',
    description: 'Rotten Tomatoes style badge',
    category: 'Ratings',
    elements: [
      {
        type: 'badge',
        x: 800,
        y: 1380,
        width: 160,
        height: 80,
        text: '95%',
        fontSize: 42,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(250, 50, 10, 0.95)',
        borderRadius: 8,
        padding: 16,
      },
    ],
  },
];

const awardsPresets: OverlayPreset[] = [
  {
    id: 'oscar-winner',
    name: 'Oscar Winner',
    description: 'Academy Award winner ribbon',
    category: 'Awards',
    elements: [
      {
        type: 'ribbon',
        x: 0,
        y: 0,
        width: 1000,
        height: 80,
        text: 'OSCAR WINNER',
        fontSize: 38,
        fontColor: '#000000',
        backgroundColor: 'rgba(255, 215, 0, 0.95)',
      },
    ],
  },
  {
    id: 'emmy-winner',
    name: 'Emmy Winner',
    description: 'Emmy Award winner ribbon',
    category: 'Awards',
    elements: [
      {
        type: 'ribbon',
        x: 0,
        y: 0,
        width: 1000,
        height: 80,
        text: 'EMMY WINNER',
        fontSize: 38,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(184, 134, 11, 0.95)',
      },
    ],
  },
  {
    id: 'award-nominated',
    name: 'Award Nominated',
    description: 'Generic award nomination badge',
    category: 'Awards',
    elements: [
      {
        type: 'badge',
        x: 40,
        y: 40,
        width: 260,
        height: 70,
        text: 'AWARD NOMINATED',
        fontSize: 26,
        fontColor: '#000000',
        backgroundColor: 'rgba(192, 192, 192, 0.95)',
        borderRadius: 8,
        padding: 16,
      },
    ],
  },
];

const statusPresets: OverlayPreset[] = [
  {
    id: 'watched-ribbon',
    name: 'Watched Banner',
    description: 'Diagonal "WATCHED" ribbon',
    category: 'Status',
    elements: [
      {
        type: 'ribbon',
        x: -200,
        y: 200,
        width: 1400,
        height: 100,
        text: 'WATCHED',
        fontSize: 50,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(76, 175, 80, 0.9)',
        rotation: -30,
      },
    ],
  },
  {
    id: 'new-episode',
    name: 'New Episode',
    description: 'New episode available badge',
    category: 'Status',
    elements: [
      {
        type: 'badge',
        x: 40,
        y: 40,
        width: 240,
        height: 70,
        text: 'NEW EPISODE',
        fontSize: 30,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(244, 67, 54, 0.95)',
        borderRadius: 8,
        padding: 14,
      },
    ],
  },
  {
    id: 'returning-series',
    name: 'Returning Series',
    description: 'Show is returning for new season',
    category: 'Status',
    elements: [
      {
        type: 'ribbon',
        x: 0,
        y: 1420,
        width: 1000,
        height: 80,
        text: 'RETURNING SERIES',
        fontSize: 34,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(33, 150, 243, 0.95)',
      },
    ],
  },
  {
    id: 'ended',
    name: 'Ended',
    description: 'Show has ended',
    category: 'Status',
    elements: [
      {
        type: 'ribbon',
        x: 0,
        y: 1420,
        width: 1000,
        height: 80,
        text: 'ENDED',
        fontSize: 40,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(158, 158, 158, 0.95)',
      },
    ],
  },
  {
    id: 'canceled',
    name: 'Canceled',
    description: 'Show has been canceled',
    category: 'Status',
    elements: [
      {
        type: 'ribbon',
        x: 0,
        y: 1420,
        width: 1000,
        height: 80,
        text: 'CANCELED',
        fontSize: 40,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(244, 67, 54, 0.95)',
      },
    ],
  },
];

const streamingPresets: OverlayPreset[] = [
  {
    id: 'netflix-original',
    name: 'Netflix Original',
    description: 'Netflix Original badge',
    category: 'Streaming',
    elements: [
      {
        type: 'badge',
        x: 40,
        y: 1390,
        width: 280,
        height: 70,
        text: 'NETFLIX ORIGINAL',
        fontSize: 26,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(229, 9, 20, 0.95)',
        borderRadius: 4,
        padding: 16,
      },
    ],
  },
  {
    id: 'prime-video',
    name: 'Prime Video',
    description: 'Amazon Prime Video badge',
    category: 'Streaming',
    elements: [
      {
        type: 'badge',
        x: 40,
        y: 1390,
        width: 240,
        height: 70,
        text: 'PRIME VIDEO',
        fontSize: 28,
        fontColor: '#00a8e1',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        borderRadius: 4,
        padding: 16,
      },
    ],
  },
  {
    id: 'disney-plus',
    name: 'Disney+',
    description: 'Disney+ badge',
    category: 'Streaming',
    elements: [
      {
        type: 'badge',
        x: 40,
        y: 1390,
        width: 200,
        height: 70,
        text: 'DISNEY+',
        fontSize: 32,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(17, 60, 207, 0.95)',
        borderRadius: 4,
        padding: 16,
      },
    ],
  },
  {
    id: 'hbo-max',
    name: 'Max',
    description: 'Max (HBO) badge',
    category: 'Streaming',
    elements: [
      {
        type: 'badge',
        x: 40,
        y: 1390,
        width: 160,
        height: 70,
        text: 'MAX',
        fontSize: 40,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(0, 46, 255, 0.95)',
        borderRadius: 4,
        padding: 14,
      },
    ],
  },
  {
    id: 'apple-tv-plus',
    name: 'Apple TV+',
    description: 'Apple TV+ badge',
    category: 'Streaming',
    elements: [
      {
        type: 'badge',
        x: 40,
        y: 1390,
        width: 220,
        height: 70,
        text: 'APPLE TV+',
        fontSize: 30,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        borderRadius: 4,
        padding: 16,
      },
    ],
  },
];

const contentRatingPresets: OverlayPreset[] = [
  {
    id: 'rated-r',
    name: 'Rated R',
    description: 'R rating badge',
    category: 'Content Rating',
    elements: [
      {
        type: 'badge',
        x: 40,
        y: 40,
        width: 100,
        height: 100,
        text: 'R',
        fontSize: 60,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(220, 53, 69, 0.95)',
        borderRadius: 8,
        padding: 16,
      },
    ],
  },
  {
    id: 'rated-pg13',
    name: 'Rated PG-13',
    description: 'PG-13 rating badge',
    category: 'Content Rating',
    elements: [
      {
        type: 'badge',
        x: 40,
        y: 40,
        width: 140,
        height: 80,
        text: 'PG-13',
        fontSize: 40,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(255, 152, 0, 0.95)',
        borderRadius: 8,
        padding: 14,
      },
    ],
  },
  {
    id: 'tv-ma',
    name: 'TV-MA',
    description: 'TV-MA rating badge',
    category: 'Content Rating',
    elements: [
      {
        type: 'badge',
        x: 40,
        y: 40,
        width: 140,
        height: 80,
        text: 'TV-MA',
        fontSize: 36,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(139, 0, 0, 0.95)',
        borderRadius: 8,
        padding: 14,
      },
    ],
  },
];

const studioPresets: OverlayPreset[] = [
  {
    id: 'studio-warner',
    name: 'Warner Bros.',
    description: 'Warner Bros. studio badge',
    category: 'Studio',
    elements: [
      {
        type: 'badge',
        x: 40,
        y: 1390,
        width: 240,
        height: 70,
        text: 'WARNER BROS.',
        fontSize: 26,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(0, 51, 102, 0.95)',
        borderRadius: 6,
        padding: 14,
      },
    ],
  },
  {
    id: 'studio-disney',
    name: 'Walt Disney Pictures',
    description: 'Disney studio badge',
    category: 'Studio',
    elements: [
      {
        type: 'badge',
        x: 40,
        y: 1390,
        width: 200,
        height: 70,
        text: 'DISNEY',
        fontSize: 32,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(17, 60, 207, 0.95)',
        borderRadius: 6,
        padding: 14,
      },
    ],
  },
  {
    id: 'studio-marvel',
    name: 'Marvel Studios',
    description: 'Marvel Studios badge',
    category: 'Studio',
    elements: [
      {
        type: 'badge',
        x: 40,
        y: 1390,
        width: 260,
        height: 70,
        text: 'MARVEL STUDIOS',
        fontSize: 26,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(237, 29, 36, 0.95)',
        borderRadius: 6,
        padding: 14,
      },
    ],
  },
  {
    id: 'studio-universal',
    name: 'Universal Pictures',
    description: 'Universal Pictures badge',
    category: 'Studio',
    elements: [
      {
        type: 'badge',
        x: 40,
        y: 1390,
        width: 240,
        height: 70,
        text: 'UNIVERSAL',
        fontSize: 30,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        borderRadius: 6,
        padding: 14,
      },
    ],
  },
  {
    id: 'studio-a24',
    name: 'A24',
    description: 'A24 studio badge',
    category: 'Studio',
    elements: [
      {
        type: 'badge',
        x: 40,
        y: 1390,
        width: 120,
        height: 70,
        text: 'A24',
        fontSize: 36,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        borderRadius: 6,
        padding: 14,
      },
    ],
  },
];

const networkPresets: OverlayPreset[] = [
  {
    id: 'network-hbo',
    name: 'HBO',
    description: 'HBO network badge',
    category: 'Network',
    elements: [
      {
        type: 'badge',
        x: 820,
        y: 1390,
        width: 140,
        height: 70,
        text: 'HBO',
        fontSize: 36,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        borderRadius: 6,
        padding: 14,
      },
    ],
  },
  {
    id: 'network-amc',
    name: 'AMC',
    description: 'AMC network badge',
    category: 'Network',
    elements: [
      {
        type: 'badge',
        x: 820,
        y: 1390,
        width: 140,
        height: 70,
        text: 'AMC',
        fontSize: 36,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(0, 102, 52, 0.95)',
        borderRadius: 6,
        padding: 14,
      },
    ],
  },
  {
    id: 'network-fx',
    name: 'FX',
    description: 'FX network badge',
    category: 'Network',
    elements: [
      {
        type: 'badge',
        x: 820,
        y: 1390,
        width: 120,
        height: 70,
        text: 'FX',
        fontSize: 40,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(255, 153, 0, 0.95)',
        borderRadius: 6,
        padding: 14,
      },
    ],
  },
  {
    id: 'network-showtime',
    name: 'Showtime',
    description: 'Showtime network badge',
    category: 'Network',
    elements: [
      {
        type: 'badge',
        x: 760,
        y: 1390,
        width: 200,
        height: 70,
        text: 'SHOWTIME',
        fontSize: 30,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(255, 0, 0, 0.95)',
        borderRadius: 6,
        padding: 14,
      },
    ],
  },
];

const versionsPresets: OverlayPreset[] = [
  {
    id: 'version-extended',
    name: 'Extended Edition',
    description: 'Extended edition badge',
    category: 'Versions',
    elements: [
      {
        type: 'badge',
        x: 350,
        y: 1390,
        width: 300,
        height: 70,
        text: 'EXTENDED EDITION',
        fontSize: 26,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(156, 39, 176, 0.95)',
        borderRadius: 6,
        padding: 14,
      },
    ],
  },
  {
    id: 'version-directors-cut',
    name: "Director's Cut",
    description: "Director's cut badge",
    category: 'Versions',
    elements: [
      {
        type: 'badge',
        x: 350,
        y: 1390,
        width: 280,
        height: 70,
        text: "DIRECTOR'S CUT",
        fontSize: 26,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(233, 30, 99, 0.95)',
        borderRadius: 6,
        padding: 14,
      },
    ],
  },
  {
    id: 'version-unrated',
    name: 'Unrated',
    description: 'Unrated edition badge',
    category: 'Versions',
    elements: [
      {
        type: 'badge',
        x: 400,
        y: 1390,
        width: 200,
        height: 70,
        text: 'UNRATED',
        fontSize: 32,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(244, 67, 54, 0.95)',
        borderRadius: 6,
        padding: 14,
      },
    ],
  },
  {
    id: 'version-imax',
    name: 'IMAX',
    description: 'IMAX version badge',
    category: 'Versions',
    elements: [
      {
        type: 'badge',
        x: 400,
        y: 1390,
        width: 200,
        height: 70,
        text: 'IMAX',
        fontSize: 40,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(0, 188, 212, 0.95)',
        borderRadius: 6,
        padding: 14,
      },
    ],
  },
  {
    id: 'version-remastered',
    name: 'Remastered',
    description: 'Remastered edition badge',
    category: 'Versions',
    elements: [
      {
        type: 'badge',
        x: 370,
        y: 1390,
        width: 260,
        height: 70,
        text: 'REMASTERED',
        fontSize: 30,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(76, 175, 80, 0.95)',
        borderRadius: 6,
        padding: 14,
      },
    ],
  },
];

const mediaStingerPresets: OverlayPreset[] = [
  {
    id: 'mediastinger-post-credits',
    name: 'Post-Credits Scene',
    description: 'Indicates post-credits scene',
    category: 'MediaStinger',
    elements: [
      {
        type: 'badge',
        x: 780,
        y: 120,
        width: 180,
        height: 50,
        text: 'POST-CREDITS',
        fontSize: 20,
        fontColor: '#000000',
        backgroundColor: 'rgba(255, 215, 0, 0.95)',
        borderRadius: 4,
        padding: 10,
      },
    ],
  },
  {
    id: 'mediastinger-mid-credits',
    name: 'Mid-Credits Scene',
    description: 'Indicates mid-credits scene',
    category: 'MediaStinger',
    elements: [
      {
        type: 'badge',
        x: 780,
        y: 120,
        width: 180,
        height: 50,
        text: 'MID-CREDITS',
        fontSize: 20,
        fontColor: '#000000',
        backgroundColor: 'rgba(255, 193, 7, 0.95)',
        borderRadius: 4,
        padding: 10,
      },
    ],
  },
  {
    id: 'mediastinger-stinger-icon',
    name: 'Stinger Icon',
    description: 'Small stinger indicator',
    category: 'MediaStinger',
    elements: [
      {
        type: 'badge',
        x: 920,
        y: 40,
        width: 60,
        height: 60,
        text: '!',
        fontSize: 40,
        fontColor: '#000000',
        backgroundColor: 'rgba(255, 215, 0, 0.95)',
        borderRadius: 30,
        padding: 8,
      },
    ],
  },
];

const combinedPresets: OverlayPreset[] = [
  {
    id: 'multi-badge',
    name: 'Multi-Badge (Quality)',
    description: 'Multiple quality badges',
    category: 'Combined',
    elements: [
      {
        type: 'badge',
        x: 40,
        y: 40,
        width: 120,
        height: 60,
        text: '4K',
        fontSize: 32,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(33, 150, 243, 0.95)',
        borderRadius: 6,
        padding: 12,
      },
      {
        type: 'badge',
        x: 180,
        y: 40,
        width: 120,
        height: 60,
        text: 'HDR',
        fontSize: 32,
        fontColor: '#000000',
        backgroundColor: 'rgba(255, 193, 7, 0.95)',
        borderRadius: 6,
        padding: 12,
      },
      {
        type: 'badge',
        x: 320,
        y: 40,
        width: 140,
        height: 60,
        text: 'ATMOS',
        fontSize: 28,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(156, 39, 176, 0.95)',
        borderRadius: 6,
        padding: 12,
      },
    ],
  },
  {
    id: 'full-quality-stack',
    name: 'Full Quality Stack',
    description: '4K + Dolby Vision + Atmos',
    category: 'Combined',
    elements: [
      {
        type: 'badge',
        x: 40,
        y: 40,
        width: 120,
        height: 60,
        text: '4K',
        fontSize: 32,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(33, 150, 243, 0.95)',
        borderRadius: 6,
        padding: 12,
      },
      {
        type: 'badge',
        x: 40,
        y: 120,
        width: 220,
        height: 60,
        text: 'DOLBY VISION',
        fontSize: 24,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        borderRadius: 6,
        padding: 14,
      },
      {
        type: 'badge',
        x: 40,
        y: 200,
        width: 200,
        height: 60,
        text: 'DOLBY ATMOS',
        fontSize: 24,
        fontColor: '#ffffff',
        backgroundColor: 'rgba(30, 30, 30, 0.95)',
        borderRadius: 6,
        padding: 14,
      },
    ],
  },
];

// =============================================================================
// COMBINED EXPORT
// =============================================================================

/**
 * All overlay presets combined in a single array
 */
export const OVERLAY_PRESETS: OverlayPreset[] = [
  ...basicPresets,
  ...resolutionPresets,
  ...hdrPresets,
  ...audioPresets,
  ...formatPresets,
  ...ratingsPresets,
  ...awardsPresets,
  ...statusPresets,
  ...streamingPresets,
  ...contentRatingPresets,
  ...studioPresets,
  ...networkPresets,
  ...versionsPresets,
  ...mediaStingerPresets,
  ...combinedPresets,
];

/**
 * Presets organized by category for quick lookup
 */
export const PRESETS_BY_CATEGORY: Record<PresetCategory, OverlayPreset[]> = {
  Basic: basicPresets,
  Resolution: resolutionPresets,
  HDR: hdrPresets,
  Audio: audioPresets,
  Format: formatPresets,
  Ratings: ratingsPresets,
  Awards: awardsPresets,
  Status: statusPresets,
  Streaming: streamingPresets,
  'Content Rating': contentRatingPresets,
  Studio: studioPresets,
  Network: networkPresets,
  Versions: versionsPresets,
  MediaStinger: mediaStingerPresets,
  Combined: combinedPresets,
};

/**
 * Find a preset by its ID
 */
export function findPresetById(id: string): OverlayPreset | undefined {
  return OVERLAY_PRESETS.find((p) => p.id === id);
}

/**
 * Get all presets in a specific category
 */
export function getPresetsByCategory(category: PresetCategory): OverlayPreset[] {
  return PRESETS_BY_CATEGORY[category] ?? [];
}
