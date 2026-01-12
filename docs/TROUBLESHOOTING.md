# Troubleshooting Guide

Common issues and how to fix them.

## Overlay Builder Issues

### "Failed to load preview from TMDB"

**Cause**: Invalid or missing TMDB API key.

**Solution**:

1. Check that your profile has a TMDB API key
2. Go to **Profiles** → Select your profile → Edit
3. Verify the TMDB API key is correct
4. Get a free API key at: https://www.themoviedb.org/settings/api
5. Click "Add API Key" button in Overlay Builder if prompted

**How to test your API key**:

```bash
# Replace YOUR_API_KEY with your actual key
curl "https://api.themoviedb.org/3/movie/603?api_key=YOUR_API_KEY"
```

If this returns movie data, your key is valid.

### "TMDB API error: Invalid API key"

**Cause**: The API key in your profile is incorrect or expired.

**Solution**:

1. Go to https://www.themoviedb.org/settings/api
2. Generate a new API key
3. Update your profile with the new key
4. Reload the Overlay Builder page

### Preview shows "Loading..." forever

**Cause**: Network issue or CORS problem.

**Solution**:

1. Check your internet connection
2. Open browser DevTools (F12) → Console tab
3. Look for specific error messages
4. Try refreshing the page
5. Clear browser cache (Ctrl/Cmd+Shift+Delete)

### Search returns no results

**Possible causes**:

- No movies/shows match your query
- API key issue
- Network problem

**Solution**:

1. Try a different search term
2. Check spelling
3. Verify API key (see above)
4. Try searching for popular titles: "Matrix", "Breaking Bad"

## Import/Export Issues

### "Import failed: Invalid YAML"

**Cause**: YAML syntax errors in your config.

**Solution**:

1. Validate YAML syntax at: https://www.yamllint.com/
2. Common issues:
   - Incorrect indentation (use 2 spaces, not tabs)
   - Missing colons after keys
   - Unquoted strings with special characters
3. Fix syntax errors and try again

### Secrets not extracted during import

**Cause**: Profile wasn't created or secrets in wrong format.

**Solution**:

1. After import, check **Profiles** page
2. Look for a profile with "Imported" in the name
3. Edit the profile to verify secrets were extracted
4. If missing, manually add them to the profile

### Export shows "[MASKED]" instead of values

**Cause**: Using "Masked" or "Template" export mode.

**Solution**:

- Use "Full" mode for actual deployment
- "Template" mode = no secrets
- "Masked" mode = partial secrets (abcd\*\*\*\*wxyz)
- "Full" mode = complete secrets

## Profile Issues

### Can't see my API keys in profile

**Cause**: Security feature - secrets are masked by default.

**Solution**:
This is intentional. Secrets are shown as `abcd****wxyz` for security.
They are stored securely and used internally by the app.

### Profile deleted accidentally

**Cause**: Clicked "Delete" or used "Reset All Data".

**Solution**:

- Profiles are stored in SQLite database
- No automatic backups (local-first design)
- **Prevention**: Export profiles regularly
- **Recovery**: Re-enter API keys manually

## Server Issues

### Port 3001 already in use

**Cause**: Another process is using the backend port.

**Solution**:

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3001 | xargs kill -9

# Or use npx
npx kill-port 3001
```

### Port 5176 already in use

**Cause**: Another process is using the frontend port.

**Solution**:

```bash
# Kill the process
npx kill-port 5176

# Or change port in vite.config.ts
server: {
  port: 5177  # Use different port
}
```

### Database errors

**Error**: "database is locked"

**Solution**:

```bash
# Close all running instances
pkill node

# Remove database and restart
rm apps/server/data/kometa-studio.db
pnpm dev
```

**Error**: "no such table: configs"

**Solution**:

```bash
# Database corrupted or not initialized
rm apps/server/data/kometa-studio.db
pnpm dev
# Database will be recreated automatically
```

## Frontend Issues

### Blank page or white screen

**Causes**:

- JavaScript error
- Build issue
- Browser cache

**Solution**:

1. Open DevTools (F12) → Console
2. Check for errors (red messages)
3. Hard refresh: Ctrl/Cmd+Shift+R
4. Clear cache and cookies
5. Try incognito/private mode
6. Restart dev server

### Changes not showing up

**Solution**:

```bash
# Hard refresh browser
Ctrl+Shift+R (Windows)
Cmd+Shift+R (Mac)

# Or restart dev server
# Stop with Ctrl+C, then:
pnpm dev
```

### "Module not found" error

**Cause**: Missing dependencies or build cache issue.

**Solution**:

```bash
# Clean install
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install

# Clean build
pnpm clean
pnpm dev
```

## Build/Install Issues

### pnpm install fails

**Error**: "EACCES: permission denied"

**Solution**:

```bash
# Don't use sudo with pnpm
# Fix npm permissions instead
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

**Error**: "No matching version found"

**Solution**:

```bash
# Update pnpm
npm install -g pnpm@latest

# Clear cache
pnpm store prune
pnpm install
```

### TypeScript errors during build

**Solution**:

```bash
# Clean TypeScript cache
rm -rf dist
rm -rf .tsbuildinfo
pnpm build
```

### Build succeeds but app doesn't work

**Solution**:

```bash
# Check environment
node --version  # Should be 18+
pnpm --version  # Should be 8+

# Rebuild from scratch
pnpm clean
rm -rf node_modules
pnpm install
pnpm build
```

## Performance Issues

### App is slow or laggy

**Solutions**:

1. Close browser DevTools when not debugging
2. Restart dev server periodically
3. Clear browser cache
4. Check RAM usage (Node.js memory leak?)
5. Restart computer if needed

### High memory usage

**Cause**: Development mode keeps old builds in memory.

**Solution**:

```bash
# Restart dev server
Ctrl+C
pnpm dev
```

## Browser-Specific Issues

### Doesn't work in [browser]

**Supported browsers**:

- Chrome 100+
- Firefox 100+
- Edge 100+
- Safari 15+

**Solution**:

1. Update your browser
2. Try a different browser
3. Disable browser extensions
4. Check console for errors

### CORS errors in console

**Error**: "blocked by CORS policy"

**Cause**: Usually affects external APIs (TMDB).

**Solution**:

- TMDB API should work from browser
- If persists, check firewall/antivirus
- Try different network (VPN off)

## Data Loss Prevention

### How to backup my data

**Configs**:

```bash
# Export each config as YAML
# Use Template mode for sharing
# Use Full mode for backup (contains secrets)
```

**Profiles**:

```bash
# Use Profile export feature
# Copy with secrets for backup
# Copy without secrets for sharing
```

**Database**:

```bash
# Copy the database file
cp apps/server/data/kometa-studio.db backup/
```

## Getting More Help

If your issue isn't listed here:

1. **Check Console**:
   - Browser DevTools (F12) → Console tab
   - Look for error messages
   - Copy full error text

2. **Check Server Logs**:
   - Look at terminal where `pnpm dev` is running
   - Copy any error messages

3. **Search Issues**:
   - https://github.com/yourusername/kometa-studio/issues
   - Someone may have had the same problem

4. **Report Bug**:
   - Use bug report template
   - Include error messages
   - Describe steps to reproduce
   - Mention OS, Node version, browser

5. **Ask for Help**:
   - GitHub Discussions
   - Provide context and error details
   - Screenshots help!

## Quick Diagnostic

Run this to check your setup:

```bash
# Check versions
node --version   # Should be 18+
pnpm --version   # Should be 8+
git --version    # Should work

# Check ports
lsof -i :3001   # Should be free or running Kometa Studio
lsof -i :5176   # Should be free or running Kometa Studio

# Check database
ls -lh apps/server/data/kometa-studio.db

# Check install
pnpm list --depth 0
```

Everything good? Then:

```bash
pnpm dev
```

Visit http://localhost:5176 and it should work!
