# Kometa Studio Feature Roadmap

This document outlines proposed features for Kometa Studio, organized by priority and category.

## Priority Levels
- 🔴 **Critical** - Core functionality gaps or blockers
- 🟠 **High** - Important features that significantly improve UX
- 🟡 **Medium** - Nice-to-have improvements
- 🟢 **Low** - Future enhancements

---

## 1. Overlay Builder Enhancements

### 🔴 Critical

| Feature | Description | Status |
|---------|-------------|--------|
| **Drag & Drop Positioning** | Allow users to visually drag overlay elements on the canvas instead of manual x/y input | Not started |
| **Missing Overlay Types** | Implement remaining Kometa overlay types: `content_rating`, `studio`, `network`, `versions`, `mediastinger` | Not started |
| **Badge Size Accuracy** | Audit and correct badge dimensions to match Kometa's actual rendering | Partial |
| **Asset Resolution Fixes** | Ensure logos and assets render consistently with proper fallbacks | Partial |

### 🟠 High

| Feature | Description | Status |
|---------|-------------|--------|
| **Undo/Redo Support** | Add history tracking for overlay changes | Not started |
| **Code View Editing** | Allow users to edit YAML in code view and sync back to visual editor | TODO in code |
| **More Preset Templates** | Add templates for: Dolby Vision, IMAX, Awards, Streaming Services | 5 presets exist |
| **Template Variable Editor** | UI for editing template variables before applying to overlays | Partial |
| **Preview Scale Options** | Allow zooming in/out on poster preview | Not started |

### 🟡 Medium

| Feature | Description | Status |
|---------|-------------|--------|
| **Multi-element Selection** | Select and move multiple overlay elements at once | Not started |
| **Element Layering Controls** | Bring to front/back, layer order management | Not started |
| **Element Snapping** | Snap to grid, guides, or other elements | Not started |
| **Element Duplication** | Quick duplicate selected element | Not started |
| **Custom Badge Designer** | Create custom badges with color picker, font selector | Not started |

---

## 2. Configuration Editor Improvements

### 🟠 High

| Feature | Description | Status |
|---------|-------------|--------|
| **Validation Feedback UI** | Show validation errors inline in the editor with helpful messages | Not started |
| **Collection Builder** | Visual interface for creating collections (like overlay builder) | Not started |
| **Operations Editor** | UI for configuring operations (schedule, library_operation, etc.) | Not started |
| **Metadata Editor** | Visual editor for metadata mappings and overrides | Not started |

### 🟡 Medium

| Feature | Description | Status |
|---------|-------------|--------|
| **Template Variables Panel** | Dedicated panel for managing template variables across config | Not started |
| **Smart Autocomplete** | Context-aware suggestions when typing YAML values | Not started |
| **Diff View** | Show differences between current and saved config | Not started |
| **Config Versioning** | Track changes to configs over time with ability to revert | Not started |
| **Advanced Settings UI** | Better organized settings editor with sections/tabs | Partial |

### 🟢 Low

| Feature | Description | Status |
|---------|-------------|--------|
| **Config Linting** | Real-time warnings for common mistakes or deprecated options | Not started |
| **Config Comments** | Preserve and edit YAML comments | Not started |

---

## 3. External Service Integrations

### 🟠 High

| Feature | Description | Status |
|---------|-------------|--------|
| **OMDb Integration** | Add OMDb API for IMDb ratings (mentioned in overlay plan) | Not started |
| **Trakt Library Sync** | Browse Trakt lists for collection building | Connection test only |
| **Radarr/Sonarr Browse** | Browse movies/shows from Radarr/Sonarr | Connection test only |

### 🟡 Medium

| Feature | Description | Status |
|---------|-------------|--------|
| **Notifiarr Integration** | Connect to Notifiarr for notifications | Not started |
| **Gotify Integration** | Alternative notification service | Not started |
| **Webhook Support** | Custom webhooks for events | Not started |
| **AniDB/MyAnimeList** | Anime database integration | Not started |

### 🟢 Low

| Feature | Description | Status |
|---------|-------------|--------|
| **Letterboxd Integration** | Import lists from Letterboxd | Not started |
| **IMDb List Import** | Import from IMDb public lists | Not started |

---

## 4. Import/Export Enhancements

### 🟠 High

| Feature | Description | Status |
|---------|-------------|--------|
| **Multi-file Import** | Import multiple YAML files at once (libraries, collections, overlays) | Not started |
| **File Structure Export** | Export to proper Kometa directory structure (config.yml + separate files) | Not started |
| **Git Integration** | Clone/push configs to Git repositories | Not started |
| **Profile Templates** | Pre-built profiles for common setups | Not started |

### 🟡 Medium

| Feature | Description | Status |
|---------|-------------|--------|
| **Docker Compose Generator** | Generate docker-compose.yml for Kometa with correct paths | Not started |
| **Backup/Restore** | Full backup of all configs, profiles, and settings | Not started |
| **Cloud Sync** | Optional sync to cloud storage (user-provided) | Not started |

---

## 5. User Experience

### 🟠 High

| Feature | Description | Status |
|---------|-------------|--------|
| **Dark/Light Theme Toggle** | User-selectable theme | Not started |
| **Keyboard Shortcuts** | Power-user shortcuts for common actions | Not started |
| **Guided Setup Wizard** | First-time setup wizard for profiles and initial config | Not started |
| **In-app Help/Docs** | Contextual help and links to Kometa documentation | Not started |

### 🟡 Medium

| Feature | Description | Status |
|---------|-------------|--------|
| **Search/Filter Configs** | Search and filter when many configs exist | Not started |
| **Favorites/Pinning** | Pin frequently used configs/profiles | Not started |
| **Recent Items** | Quick access to recently edited items | Not started |
| **Bulk Operations** | Select multiple configs for delete/export | Not started |
| **Responsive Mobile UI** | Better support for tablet/mobile viewing | Not started |

### 🟢 Low

| Feature | Description | Status |
|---------|-------------|--------|
| **Customizable Layout** | User can rearrange panels | Not started |
| **UI Density Options** | Compact/comfortable/spacious modes | Not started |

---

## 6. Testing & Validation

### 🔴 Critical

| Feature | Description | Status |
|---------|-------------|--------|
| **Fix TypeScript Build** | Resolve web TypeScript errors blocking CI | TODO in CI |
| **Fix YAML Parser Tests** | Resolve pre-existing test failures | TODO in CI |

### 🟠 High

| Feature | Description | Status |
|---------|-------------|--------|
| **Dry Run Mode** | Validate config against actual Plex/TMDB data without making changes | Not started |
| **Connection Health Dashboard** | Show status of all service connections at a glance | Not started |
| **Config Preview** | Preview what Kometa would do with current config | Not started |

### 🟡 Medium

| Feature | Description | Status |
|---------|-------------|--------|
| **API Response Caching** | Cache TMDB/Plex responses with configurable TTL | Not started |
| **Rate Limiting Display** | Show API rate limits and usage | Not started |

---

## 7. Advanced Features

### 🟡 Medium

| Feature | Description | Status |
|---------|-------------|--------|
| **Scheduler Visualization** | Visual cron/schedule builder with calendar preview | Not started |
| **Collection Analytics** | Show stats about collections (item counts, missing posters, etc.) | Not started |
| **Overlay Preview Gallery** | Preview all overlay variations at once | Not started |
| **Asset Manager** | Upload and manage custom overlay assets | Not started |

### 🟢 Low

| Feature | Description | Status |
|---------|-------------|--------|
| **Recipe Sharing** | Share configs/overlays as importable recipes | Not started |
| **Community Templates** | Browse community-contributed templates | Not started |
| **Plugin System** | Allow custom extensions | Not started |

---

## 8. Infrastructure & DevOps

### 🟠 High

| Feature | Description | Status |
|---------|-------------|--------|
| **Docker Image** | Official Docker image for easy deployment | Not started |
| **Database Migrations** | Proper migration system for schema changes | Not started |

### 🟡 Medium

| Feature | Description | Status |
|---------|-------------|--------|
| **Health Metrics** | Expose Prometheus metrics | Not started |
| **Structured Logging** | Enhanced logging with levels and export | Partial |
| **Automatic Updates** | Check for and notify about new versions | Not started |

---

## Implementation Priorities (Recommended Order)

### Phase 1: Stability & Critical Fixes
1. Fix TypeScript build errors in web app
2. Fix YAML parser test failures
3. Complete asset resolution for overlay builder
4. Accurate badge sizing

### Phase 2: Core Feature Completion
1. Drag & drop overlay positioning
2. Missing overlay types (content_rating, studio, network, etc.)
3. Undo/redo in overlay builder
4. Code view editing for overlays

### Phase 3: UX Polish
1. Dark/light theme
2. Validation feedback UI
3. Keyboard shortcuts
4. Guided setup wizard

### Phase 4: Expanded Functionality
1. Collection builder
2. Operations editor
3. Multi-file import/export
4. OMDb integration

### Phase 5: Advanced Features
1. Git integration
2. Dry run mode
3. Docker image
4. Scheduler visualization

---

## Contributing

When implementing a feature:
1. Create a branch from `main` with naming: `feature/<feature-name>`
2. Update this document to mark status as "In Progress" or "Complete"
3. Add tests for new functionality
4. Update CLAUDE.md if adding new patterns or conventions
5. Submit PR with description of changes

---

*Last updated: 2026-01-12*
