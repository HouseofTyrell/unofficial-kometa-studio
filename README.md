# Kometa Studio

A modern, local-first IDE for creating and managing [Kometa](https://kometa.wiki/) (formerly Plex-Meta-Manager) configurations. Build your media library metadata and overlay configurations visually with real-time preview, profile management, and secure secret handling.

![Kometa Studio](https://img.shields.io/badge/status-alpha-orange)
![License](https://img.shields.io/badge/license-MIT-blue)

## ⚠️ Disclaimer

This is an **unofficial, community-created project** and is not affiliated with, endorsed by, or supported by the official Kometa team. Use at your own risk.

## ✨ Features

### 🔐 Profile Management

- **Secure Secret Storage**: Store API keys and tokens locally (unmasked for easy access)
- **Show/Hide Secrets Toggle**: Reveal or mask secrets with a single click
- **Test Connections**: Verify API credentials with one-click connection tests
- **Profile Switching**: Manage multiple environments (dev, staging, production)
- **Import/Export**: Share profiles securely without exposing secrets
- **Real-time Notifications**: On-page alerts for save/delete/test operations

### 📝 Configuration Editor

- **Visual YAML Editor**: Edit Kometa configs with a user-friendly interface
- **Real-time Validation**: Catch errors before deployment
- **Schema Support**: Full support for Kometa's configuration schema
- **Extras Preservation**: Unknown keys preserved in `extras` fields

### 🎨 Overlay Builder (In Progress)

- **Visual Preview**: See overlays on real TMDB posters instantly
- **Automatic Overlay Loading**: Overlays automatically appear based on your config when media is selected
- **Kometa-Compatible Rendering**: Matches Kometa's exact overlay output with proper positioning, sizing, and styling
- **Smart Overlay Generation**: Overlays adapt to media properties (resolution badges, ratings with logos, codecs)
- **Rating Badges**: Displays TMDB, IMDb, and Rotten Tomatoes ratings with proper logos and format
  - TMDB: Shows percentage (e.g., "78%")
  - IMDb: Shows 0-10 rating (e.g., "8.0")
  - RT: Shows Fresh/Rotten status with percentage (e.g., "FRESH 83%")
- **TV Show Hierarchy**: Preview overlays for series posters, season posters, and episode stills
- **Config & Overlay File Browser**: Load and preview existing overlays from your configuration
- **Plex Media Server Integration** (Optional):
  - Fetch real media information (resolution, video codec, audio codec, channels)
  - Automatic library search by title and year
  - Display accurate technical metadata for precise overlay previews
  - Required for audio/video codec overlays (e.g., "DOLBY DV", "TRUE HD ATMOS")
- **TMDB Integration**: Search movies/TV shows and fetch ratings
- **Kometa Defaults Repository**: Load official Kometa overlay templates directly
- **Preset Templates**: Start with pre-built templates (4K, HDR, Rating badges, etc.)
- **Code View**: View generated Kometa-compatible YAML configuration
- **Real-time Notifications**: On-page alerts for status updates

**Note**: The Overlay Builder currently focuses on accurate preview and rendering. Full visual editing capabilities (drag-and-drop, custom elements, save to config) are planned for future releases.

### 🔄 Import/Export

- **YAML Import**: Import existing `config.yml` files with auto-profile creation
- **Secret Extraction**: Automatically extracts and secures API keys during import
- **Multiple Export Modes**:
  - **Template**: For sharing (no secrets)
  - **Masked**: For backup (partial secrets shown)
  - **Full**: For deployment (complete with secrets)

### 🗄️ Local-First Architecture

- **No Cloud Dependencies**: All data stored locally in SQLite
- **Privacy Focused**: Your secrets never leave your machine
- **Offline Capable**: Works without internet (except TMDB features)

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and **pnpm** 8+
- **Git** (for cloning the repository)

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/HouseofTyrell/unofficial-kometa-studio.git
   cd unofficial-kometa-studio
   ```

2. **Install dependencies**:

   ```bash
   pnpm install
   ```

3. **Set up environment**:

   ```bash
   cp apps/server/.env.example apps/server/.env
   ```

   Generate and add a master encryption key to `apps/server/.env`:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

4. **Start the development server**:

   ```bash
   pnpm dev
   ```

5. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

📖 **New to Kometa Studio?** Check out the [Quick Start Guide](docs/QUICKSTART.md)

## 📖 Usage Guide

### First-Time Setup

1. **Create a Profile**:
   - Navigate to **Profiles** in the sidebar
   - Click **Create New Profile**
   - Enter a name (e.g., "Production")
   - Add your API keys and credentials:
     - **TMDB**: Required for Overlay Builder poster search
     - **Plex**: Optional but recommended for real media metadata (resolution, codecs)
     - **Radarr, Sonarr, Tautulli**: Optional for enhanced functionality
   - Use **Test** buttons to verify each connection
   - Toggle **Show Secrets** to reveal/hide your API keys

2. **Import Existing Config** (Optional):
   - Go to **Import / Export**
   - Paste your existing `config.yml`
   - Click **Import Configuration**
   - Secrets are automatically extracted and stored in a profile

3. **Start Building**:
   - Use the **Config Editor** to modify settings
   - Try the **Overlay Builder** to create visual overlays
   - Export when ready for deployment

### Creating Overlays

1. **Navigate to Overlay Builder**:
   - Click **Overlay Builder** in the sidebar
   - Select your profile (TMDB API key required)
   - Optionally add Plex server credentials for real media metadata

2. **Load Existing Config** (Optional):
   - Select a config file from the dropdown
   - Browse and preview existing overlay files
   - Overlays automatically load when you select media

3. **Search for Media**:
   - Use the search bar to find movies or TV shows
   - Select any title to load its poster
   - **For TV Shows**: Choose between series, season, or episode posters
   - **Automatic Preview**: Overlays from your config appear automatically based on media properties

4. **Choose a Template** (Optional):
   - Select from preset templates like 4K Badge, HDR Ribbon, Rating Badge
   - Or start from scratch with "+ Badge" or "+ Text"

5. **View Real Media Information**:
   - See technical details from Plex (resolution, codecs, audio channels)
   - View TMDB and IMDb ratings
   - Overlays adapt automatically to show relevant badges (4K, HDR, ratings, etc.)

6. **Customize Your Overlay**:
   - Select element type (Badge, Text, Ribbon, etc.)
   - Position with X/Y coordinates or drag
   - Customize colors, text, fonts, and sizes
   - Preview changes in real-time on TMDB posters

7. **Load from Kometa Defaults** (Optional):
   - Click **Load Overlay** to fetch official Kometa templates
   - Choose overlay type (resolution, audio_codec, ratings, etc.)
   - Templates automatically populate with your media's data

8. **Toggle Views**:
   - Switch between visual editor and code view
   - See the generated YAML in real-time

9. **Save to Config**:
   - Click **Save to Config**
   - Choose a library and overlay file name
   - Overlay YAML is added to your configuration

## 📁 Project Structure

```
kometa-studio/
├── apps/
│   ├── server/          # Backend API
│   │   ├── src/
│   │   │   ├── db/      # SQLite repositories
│   │   │   ├── routes/  # API endpoints
│   │   │   └── yaml/    # YAML parser/renderer
│   │   └── data/        # SQLite database (gitignored)
│   │
│   └── web/             # Frontend (React + Vite)
│       ├── src/
│       │   ├── api/     # API client
│       │   ├── components/
│       │   │   ├── layout/      # App layout
│       │   │   └── overlay/     # Overlay builder components
│       │   ├── pages/           # Route pages
│       │   └── services/        # External service integrations
│       │       ├── tmdb.service.ts          # TMDB API (movies, TV, ratings)
│       │       ├── plex.service.ts          # Plex Media Server integration
│       │       └── kometa-defaults.service.ts  # Kometa defaults repository
│       └── public/
│
└── packages/
    └── shared/          # Shared types & schemas
        └── src/
            └── schemas/ # Zod validation schemas
```

## 🛠️ Technology Stack

### Frontend

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **CSS Modules** - Scoped styling

### Backend

- **Fastify** - Fast web framework
- **better-sqlite3** - Local database
- **YAML** - Config parsing/rendering
- **Zod** - Schema validation

### Development

- **pnpm** - Package manager
- **tsx** - TypeScript execution
- **Monorepo** - Workspace structure

## 🔐 Security Features

### Secret Management

- **Local-First Storage**: All secrets stored locally on your machine (SQLite)
- **Profile Isolation**: Each profile's secrets are separate
- **Export Control**: Choose what to include when exporting (Template/Masked/Full)
- **Show/Hide Toggle**: Control secret visibility in the UI with a toggle switch
- **No Cloud Transmission**: Secrets never leave your machine (runs on localhost)

### Best Practices

- Never commit `.env` files or database files
- Use Template mode when sharing configs
- Regularly backup your profiles (without secrets)
- Validate configs before deployment

## 📦 Building for Production

```bash
# Build all packages
pnpm build

# Start production server
pnpm start
```

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details on:

- Code of conduct
- Development workflow
- Commit message conventions
- Pull request process

## 📚 Documentation

- [Quick Start Guide](docs/QUICKSTART.md) - Get started in 5 minutes
- [Development Guide](docs/DEVELOPMENT.md) - For contributors
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions

## 🐛 Bug Reports & Feature Requests

- **Bug Report**: Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md)
- **Feature Request**: Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md)
- **Questions**: Start a [discussion](https://github.com/HouseofTyrell/unofficial-kometa-studio/discussions)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Kometa](https://kometa.wiki/) - The amazing tool this IDE supports
- [TMDB](https://www.themoviedb.org/) - Movie/TV database and poster images
- All contributors and testers who helped make this project better

## ⚠️ Disclaimer (Again)

**Kometa Studio is NOT an official Kometa product**. It's a community-created tool to help users build Kometa configurations more easily. For official Kometa support, documentation, and resources, visit [kometa.wiki](https://kometa.wiki/).

---

**Made with ❤️ by the community, for the community.**
