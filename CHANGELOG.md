# Changelog

All notable changes to Kometa Studio will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Visual Overlay Builder with live preview
- TMDB integration for poster search and preview
- TV Show hierarchy support (Show/Season/Episode poster types)
- Season and episode selector for TV show overlays
- Config and overlay file browser in Overlay Builder
- Overlay file information display (type, reference, and template variables)
- Load overlay functionality from Kometa defaults repository
- YAML parsing and conversion of Kometa overlays to visual elements
- **Smart overlay generation** - automatically creates overlays based on media properties
- Kometa defaults service for fetching and parsing overlay definitions
- **Plex Media Server integration** for real media information
- **Real-time metadata fetching** (resolution, video codec, audio codec, ratings)
- **Dynamic overlay rendering** with actual media data (resolution badges, ratings, codecs)
- **Accurate overlay preview** - shows exactly what would be applied to selected media
- Media info display showing technical details and ratings
- Automatic Plex library search by title and year
- Preset overlay templates (4K, HDR, Rating, Watched, Multi-badge)
- Element editor for customizing overlay properties
- Visual/Code toggle for overlay configuration
- Media search functionality
- Save overlay to config functionality
- Profile management with secure secret storage
- Show/Hide Secrets toggle for revealing API keys and tokens
- Test connection buttons for all services (TMDB, Plex, Radarr, Sonarr, Tautulli)
- Real-time on-page notifications for save/delete/test operations
- Support for all Kometa services (Tautulli, MDBList, Trakt added)
- YAML import with automatic secret extraction
- Multiple export modes (Template, Masked, Full)
- Real-time configuration validation
- Extras field preservation for unknown YAML keys
- SQLite database for local data storage
- Dark theme UI
- Responsive layout with sidebar navigation

### Changed

- Removed secret masking from Profile API (local-first app, no security risk)
- **Replaced popup alerts with elegant on-page notifications** in Overlay Builder
- Added slide-in animation for notifications (auto-dismiss after 5 seconds)
- Improved user feedback for all operations (load overlay, save API key, errors)
- Enhanced error handling for API failures with specific error messages
- Better YAML parsing with secret separation
- Improved TMDB error messages (shows specific API errors)

### Fixed

- Secret masking preventing secrets from being saved correctly
- Secrets not displaying properly after import
- Generic TMDB error messages not showing specific issues
- Missing service fields in profile form (Tautulli, MDBList, Sonarr, Trakt)
- Server restart issues during development
- **Rating badge format** - now displays in Kometa's exact format (TMDB 78%, IMDb 8.0, FRESH 83%)
- **Duplicate rating badges** - filters out duplicate rating sources automatically
- **Rating logo URLs** - corrected to use Fresh/Rotten variants based on rating value
- **Overlay asset extraction** - loads all images and logos from user's Kometa config

## [0.1.0] - 2024-01-XX

### Added

- Initial release
- Basic configuration editor
- Profile management
- Import/Export functionality
- YAML parser and renderer
- Kometa schema validation
- Local-first architecture with SQLite
- React frontend with Vite
- Fastify backend
- TypeScript throughout
- pnpm monorepo structure

[Unreleased]: https://github.com/yourusername/kometa-studio/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/yourusername/kometa-studio/releases/tag/v0.1.0
