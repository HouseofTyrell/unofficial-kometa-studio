/**
 * Overlay Builder Constants
 *
 * Centralized constants for the overlay builder feature.
 * Kometa uses a 1000x1500 coordinate system for poster overlays.
 */

// Kometa's internal coordinate system for poster overlays
export const KOMETA_CANVAS = {
  WIDTH: 1000,
  HEIGHT: 1500,
} as const;

// Display dimensions (scaled down from Kometa canvas)
export const DISPLAY = {
  WIDTH: 500,
  HEIGHT: 750,
  SCALE_FACTOR: 0.5, // DISPLAY.WIDTH / KOMETA_CANVAS.WIDTH
} as const;

// Maximum element positions (slightly less than full canvas to keep elements visible)
export const ELEMENT_BOUNDS = {
  MAX_X: KOMETA_CANVAS.WIDTH - 50, // 950
  MAX_Y: KOMETA_CANVAS.HEIGHT - 50, // 1450
} as const;

// Zoom configuration
export const ZOOM = {
  LEVELS: [50, 75, 100, 125, 150] as const,
  DEFAULT: 100,
  MIN: 50,
  MAX: 150,
  STEP: 25,
} as const;

// Default element positions and sizes
export const DEFAULT_ELEMENT = {
  POSITION: { x: 50, y: 50 },
  TEXT: {
    width: 500,
    height: 50,
  },
  IMAGE: {
    width: 100,
    height: 100,
  },
} as const;

// UI timing
export const TIMING = {
  NOTIFICATION_DURATION_MS: 5000,
  DEBOUNCE_MS: 300,
} as const;

// TMDB poster sizes
export const TMDB_POSTER_SIZE = {
  SMALL: 'w185',
  MEDIUM: 'w342',
  LARGE: 'w500',
  ORIGINAL: 'original',
} as const;
