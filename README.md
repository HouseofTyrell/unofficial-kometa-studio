# Kometa Studio

**This is an unofficial project and is not affiliated with or endorsed by Kometa.**

An unofficial, local-first IDE for building, validating, and previewing Kometa `config.yml` files.

Kometa Studio is designed to help power users create and manage Kometa configurations safely and ergonomically without running Kometa itself. It provides a visual interface, live validation, and secure secret management.

---

## 🎯 Features

- **Local-First**: All data stored on your machine, no cloud dependencies
- **Secure Secret Storage**: AES-256-GCM encryption for all API keys and tokens
- **3-Panel IDE Layout**: Navigation tree, editor forms, and live YAML preview
- **Real-Time Validation**: Catch configuration issues before running Kometa
- **Profile Management**: Multiple environment profiles (dev, prod, etc.)
- **Import/Export**: Import existing configs, export with template/masked/full modes
- **Collection & Overlay Files**: Full support for repeated defaults with different `template_variables`
- **Extras Preservation**: Unknown keys are preserved during import/export
- **Zero Bundle Exposure**: Secrets never touch the frontend bundle

---

## ⚠️ Disclaimer

This is an **unofficial community tool** created to help Kometa users. It is not part of the official Kometa project and receives no support or endorsement from the Kometa team.

Use at your own risk. Always back up your configurations before making changes.

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18
- TypeScript
- Vite
- React Router
- CSS Modules

**Backend:**
- Node.js
- Fastify
- TypeScript
- SQLite (better-sqlite3)
- AES-256-GCM encryption

**Shared:**
- Zod schemas for validation
- Shared TypeScript types

### Monorepo Structure

```
unofficial-kometa-studio/
├── apps/
│   ├── web/          # React frontend
│   └── server/       # Fastify backend
├── packages/
│   └── shared/       # Shared schemas & types
├── pnpm-workspace.yaml
└── package.json
```

---

## 🔒 Security Model

### How Secrets Are Handled

1. **Backend-Only Storage**: All secrets (Plex tokens, API keys) are stored in the backend SQLite database
2. **Encryption at Rest**: Secrets are encrypted using AES-256-GCM before storage
3. **Master Key**: A 32-byte master key (`KOMETA_STUDIO_MASTER_KEY`) is required to encrypt/decrypt secrets
4. **No Frontend Exposure**: Secrets are **never** sent to or stored in the browser
5. **Masked Responses**: By default, API responses return masked secrets (e.g., `abcd****wxyz`)

### What Gets Encrypted

- Plex token & URL
- TMDB API key
- Radarr/Sonarr tokens & URLs
- Tautulli API key & URL
- Trakt client secret & authorization tokens
- MDBList API key
- Any custom service secrets

### YAML Export Modes

- **Template**: No secrets included (safe for sharing)
- **Masked**: Secrets partially masked (for preview/debugging)
- **Full**: All secrets included (⚠️ for deployment only)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/unofficial-kometa-studio.git
   cd unofficial-kometa-studio
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Generate a master encryption key:**

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

4. **Configure the backend:**

   ```bash
   cd apps/server
   cp .env.example .env
   ```

   Edit `.env` and set your `KOMETA_STUDIO_MASTER_KEY`:

   ```env
   KOMETA_STUDIO_MASTER_KEY=your-generated-key-here
   PORT=3001
   HOST=127.0.0.1
   DATABASE_PATH=./data/kometa-studio.db
   CORS_ORIGIN=http://localhost:5173
   ```

5. **Start the development servers:**

   From the root directory:

   ```bash
   pnpm dev
   ```

   This starts:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

---

## 📖 Usage Guide

### Creating Your First Configuration

1. Navigate to the home page
2. Click **"+ New Configuration"**
3. Give it a name (e.g., "My Kometa Config")
4. Start editing in the main panel

### Setting Up a Profile

Profiles store your secrets (tokens, API keys) separately from your configuration.

1. Go to **Profiles** in the sidebar
2. Click **"+ New"**
3. Enter profile name (e.g., "Production")
4. Add your secrets:
   - Plex URL and token
   - TMDB API key
   - Radarr/Sonarr credentials (if used)
   - etc.
5. Click **"Save Profile"**

### Editing Libraries

Libraries are where you define your Plex libraries and the collections/overlays they use.

1. Open a configuration
2. Go to the **Libraries** tab
3. Click **"+ Add Library"**
4. Enter library name (e.g., "Movies", "TV Shows")
5. Add collection files and overlay files:
   - Click **"+ Add File"**
   - Choose type: `default`, `file`, `url`, or `git`
   - Enter the path (e.g., `imdb`, `config/MyCollections.yml`)
   - Optionally add `template_variables`

**Important**: You can add the same default multiple times with different `template_variables`. Order is preserved!

Example:
```yaml
overlay_files:
  - default: studio
    template_variables:
      builder_level: movie
  - default: studio
    template_variables:
      builder_level: collection
```

### Live YAML Preview

The right panel shows a live preview of your generated YAML:

1. Select a profile (or "No Profile")
2. Choose mode:
   - **Template**: No secrets (safe to share)
   - **Masked**: Secrets partially visible
   - **Full**: All secrets included (⚠️ deployment only)
3. Copy or download the YAML

### Validation

Validation runs automatically and shows:
- **Errors**: Critical issues that will prevent Kometa from running
- **Warnings**: Non-critical issues or missing recommended settings

Click on validation messages to jump to the relevant section.

### Importing Existing Configs

1. Go to **Import / Export**
2. Paste your existing `config.yml` content
3. Click **"Import Configuration"**
4. Unknown keys will be preserved in `extras` fields

---

## 🧪 Testing

Run tests:

```bash
# All tests
pnpm test

# Backend only
cd apps/server && pnpm test

# Shared package only
cd packages/shared && pnpm test
```

---

## 📦 Building for Production

```bash
# Build all packages
pnpm build

# Start production server
cd apps/server
pnpm start
```

For the frontend, deploy the `apps/web/dist` directory to a static host.

---

## 🗺️ Roadmap

- [ ] Advanced template variable editor with autocomplete
- [ ] Visual diff for configuration changes
- [ ] Export to Docker Compose environment variables
- [ ] Bulk operations (duplicate library across configs)
- [ ] Configuration presets/templates
- [ ] Integration testing with actual Kometa
- [ ] Cloud sync (optional, with E2E encryption)
- [ ] Plugin system for custom validators
- [ ] Dark/light theme toggle

---

## 🤝 Contributing

Contributions are welcome! This is a community project.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests if applicable
5. Submit a pull request

Please ensure:
- Code follows existing style
- Tests pass (`pnpm test`)
- TypeScript compiles without errors
- Security best practices are maintained

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- The [Kometa](https://github.com/Kometa-Team/Kometa) project for creating an amazing tool for Plex automation
- The Kometa community for inspiration and feature ideas
- All contributors to this project

---

## 🐛 Reporting Issues

Found a bug? Have a feature request?

[Open an issue on GitHub](https://github.com/yourusername/unofficial-kometa-studio/issues)

---

## ⚡ Quick Reference

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `KOMETA_STUDIO_MASTER_KEY` | 32-byte base64 encryption key | ✅ Yes |
| `PORT` | Backend server port | ❌ No (default: 3001) |
| `HOST` | Backend server host | ❌ No (default: 127.0.0.1) |
| `DATABASE_PATH` | SQLite database path | ❌ No (default: ./data/kometa-studio.db) |
| `CORS_ORIGIN` | Frontend URL for CORS | ❌ No (default: http://localhost:5173) |

### Supported Kometa Sections

- ✅ `settings` - Global Kometa settings
- ✅ `plex` - Plex configuration
- ✅ `tmdb` - TMDB configuration
- ✅ `tautulli` - Tautulli integration
- ✅ `mdblist` - MDBList integration
- ✅ `radarr` - Radarr integration
- ✅ `sonarr` - Sonarr integration
- ✅ `trakt` - Trakt integration
- ✅ `libraries` - Library configurations with collection/overlay files
- ✅ Unknown keys preserved via `extras`

---

**Made with ❤️ by the community, for the community**
