# Changelog

All notable changes to Kometa Studio will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Visual Overlay Builder with live preview
- TMDB integration for poster search and preview
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
- Replaced popup alerts with elegant on-page notifications
- Enhanced error handling for API failures with specific error messages
- Better YAML parsing with secret separation
- Improved TMDB error messages (shows specific API errors)

### Fixed
- Secret masking preventing secrets from being saved correctly
- Secrets not displaying properly after import
- Generic TMDB error messages not showing specific issues
- Missing service fields in profile form (Tautulli, MDBList, Sonarr, Trakt)
- Server restart issues during development

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
