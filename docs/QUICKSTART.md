# Quick Start Guide

Get up and running with Kometa Studio in 5 minutes!

## Prerequisites

You need:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **pnpm** - Install with: `npm install -g pnpm`

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/kometa-studio.git
cd kometa-studio

# 2. Install dependencies
pnpm install

# 3. Start the application
pnpm dev
```

That's it! The app will open at:

- **Frontend**: http://localhost:5176
- **Backend**: http://localhost:3001

## First Steps

### 1. Create Your First Profile

Profiles store your API keys securely.

1. Click **"Profiles"** in the sidebar
2. Click **"Create New Profile"**
3. Enter a name (e.g., "My Setup")
4. Add your TMDB API key (required for Overlay Builder)
   - Get one free at: https://www.themoviedb.org/settings/api
5. Optionally add other API keys (Plex, etc.)
6. Click **"Create Profile"**

### 2. Import Existing Config (Optional)

Already have a Kometa config? Import it!

1. Click **"Import / Export"** in the sidebar
2. Copy your entire `config.yml` file
3. Paste it into the text area
4. Click **"Import Configuration"**
5. Give it a name
6. Secrets are automatically extracted to your profile

### 3. Try the Overlay Builder

Create visual overlays with live preview!

1. Click **"Overlay Builder"** in the sidebar
2. Choose **Movie** or **TV Show**
3. Search for a title or use the default
4. Select a **Preset Template** (try "4K Badge" or "HDR Ribbon")
5. Click **"+ Badge"** to add your own element
6. Customize position, text, colors in the editor
7. See changes instantly in the preview
8. Toggle to **"Code"** view to see the YAML
9. Click **"Save to Config"** when done

### 4. Edit Your Configuration

1. Click on a config name in the sidebar
2. Edit settings in the form
3. Preview YAML on the right
4. Toggle between **Template**, **Masked**, and **Full** modes
5. Click **"Download"** to save

## Next Steps

### Learn More

- Read the full [README](../README.md)
- Check [Development Guide](./DEVELOPMENT.md) if contributing
- Review [Contributing Guidelines](../CONTRIBUTING.md)

### Common Tasks

**Add more profiles:**

- Profiles → Create New Profile

**Reset everything:**

- Import / Export → Reset All Local Data

**Export your config:**

- Open config → Choose mode → Download

**Share configs without secrets:**

- Use "Template" mode when exporting

## Tips & Tricks

### Keyboard Shortcuts

- Press `Enter` in search fields to search
- Use browser's Find (Ctrl/Cmd+F) in code view

### Best Practices

1. **Create separate profiles** for dev/staging/production
2. **Use Template mode** when sharing configs
3. **Backup regularly** by exporting configs
4. **Test configs** before deploying to Kometa

### Overlay Builder Tips

- Start with presets, then customize
- Use X/Y inputs for precise positioning
- Toggle to Code view to understand YAML structure
- Search TMDB to preview on specific titles

## Troubleshooting

### Port Already in Use

```bash
npx kill-port 3001  # Backend
npx kill-port 5176  # Frontend
```

### Can't See My Changes

- Hard refresh browser (Ctrl/Cmd+Shift+R)
- Restart dev server

### TMDB Search Not Working

- Verify API key in your profile
- Check browser console for errors
- Ensure internet connection

### Import Failed

- Check YAML syntax is valid
- Some Kometa features may not be supported yet
- Check console for specific error

## Getting Help

- **Bug?** Open an [issue](https://github.com/yourusername/kometa-studio/issues)
- **Question?** Start a [discussion](https://github.com/yourusername/kometa-studio/discussions)
- **Feature idea?** Use [feature request template](https://github.com/yourusername/kometa-studio/issues/new?template=feature_request.md)

## What's Next?

Now that you're set up, explore:

- **Config Editor**: Build complete Kometa configurations
- **Overlay Builder**: Create visual overlays for your media
- **Profile Management**: Manage multiple environments
- **Import/Export**: Migrate existing configs

Happy configuring! 🎉
