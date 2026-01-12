# Development Guide

This guide covers common development tasks and workflows for Kometa Studio.

## 🚀 Quick Start

```bash
# Clone and setup
git clone https://github.com/HouseofTyrell/unofficial-kometa-studio.git
cd unofficial-kometa-studio
pnpm install

# Start development
pnpm dev
```

## 📁 Project Structure

### Monorepo Layout

```
kometa-studio/
├── apps/
│   ├── server/          # Backend API (Fastify)
│   │   ├── src/
│   │   │   ├── db/      # Database models
│   │   │   ├── routes/  # API endpoints
│   │   │   └── yaml/    # YAML processing
│   │   └── data/        # SQLite database (gitignored)
│   │
│   └── web/             # Frontend UI (React)
│       ├── src/
│       │   ├── api/           # API client
│       │   ├── components/    # React components
│       │   ├── pages/         # Page components
│       │   └── services/      # Business logic
│       └── public/            # Static assets
│
└── packages/
    └── shared/          # Shared types & schemas
        └── src/
            └── schemas/ # Zod schemas
```

### Key Files

- `apps/server/src/index.ts` - Backend entry point
- `apps/web/src/App.tsx` - Frontend routing
- `apps/web/src/components/layout/Sidebar.tsx` - Navigation
- `packages/shared/src/schemas/config.schema.ts` - Config schema

## 🔧 Common Tasks

### Starting Development Servers

```bash
# Start both frontend and backend
pnpm dev

# Frontend only (port 5173)
pnpm --filter @kometa-studio/web dev

# Backend only (port 3001)
pnpm --filter @kometa-studio/server dev
```

### Building for Production

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @kometa-studio/web build
pnpm --filter @kometa-studio/server build

# Start production server
pnpm start
```

### Database Management

The SQLite database is stored at `apps/server/data/kometa-studio.db`.

```bash
# View database
sqlite3 apps/server/data/kometa-studio.db

# Common queries
.tables                    # List tables
.schema configs            # View schema
SELECT * FROM configs;     # View all configs
DELETE FROM configs;       # Clear configs (careful!)

# Reset database (development only)
rm apps/server/data/kometa-studio.db
# Restart server to recreate
```

### Working with Schemas

Schemas are defined in `packages/shared/src/schemas/` using Zod.

**Adding a new field:**

1. Update schema:

```typescript
// packages/shared/src/schemas/config.schema.ts
export const PlexConfigSchema = z.object({
  enabled: z.boolean(),
  timeout: z.number().optional(),
  // Add new field
  new_field: z.string().optional(),
});
```

2. Update parser:

```typescript
// apps/server/src/yaml/parser.ts
const plexKnownKeys = ['timeout', 'clean_bundles', 'new_field'];
```

3. Update generator:

```typescript
// apps/server/src/yaml/generator.ts
if (plex.new_field) {
  plexYaml['new_field'] = plex.new_field;
}
```

### Adding a New API Endpoint

1. **Create route file** (or add to existing):

```typescript
// apps/server/src/routes/myfeature.routes.ts
import { FastifyInstance } from 'fastify';

export async function myFeatureRoutes(fastify: FastifyInstance) {
  fastify.get('/api/myfeature', async (request, reply) => {
    return { message: 'Hello!' };
  });

  fastify.post('/api/myfeature', async (request, reply) => {
    const body = request.body;
    return { success: true };
  });
}
```

2. **Register route**:

```typescript
// apps/server/src/index.ts
import { myFeatureRoutes } from './routes/myfeature.routes';

await fastify.register(myFeatureRoutes);
```

3. **Add client method**:

```typescript
// apps/web/src/api/client.ts
export const myFeatureApi = {
  get: () => request<{ message: string }>('/api/myfeature'),
  create: (data: any) =>
    request<{ success: boolean }>('/api/myfeature', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
```

### Adding a New Page

1. **Create page component**:

```tsx
// apps/web/src/pages/MyPage.tsx
import styles from './MyPage.module.css';

export function MyPage() {
  return (
    <div className={styles.page}>
      <h1>My Page</h1>
    </div>
  );
}
```

2. **Create styles**:

```css
/* apps/web/src/pages/MyPage.module.css */
.page {
  padding: 24px;
}
```

3. **Add route**:

```tsx
// apps/web/src/App.tsx
import { MyPage } from './pages/MyPage';

<Route path="/my-page" element={<MyPage />} />;
```

4. **Add navigation**:

```tsx
// apps/web/src/components/layout/Sidebar.tsx
<Link to="/my-page" className={styles.navItem}>
  My Page
</Link>
```

## 🧪 Testing

### Manual Testing Checklist

- [ ] Create a new profile
- [ ] Import a YAML config
- [ ] Edit configuration values
- [ ] Export in all modes (Template, Masked, Full)
- [ ] Use Overlay Builder
- [ ] Search for media
- [ ] Create custom overlay
- [ ] Save overlay to config
- [ ] Delete all data
- [ ] Profile switching

### Testing with Sample Data

```bash
# Create sample config
curl -X POST http://localhost:3001/api/configs \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Config","config":{}}'

# Create sample profile
curl -X POST http://localhost:3001/api/profiles \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Profile","secrets":{}}'
```

## 🐛 Debugging

### Backend Debugging

Add console.log statements:

```typescript
console.log('Debug:', variable);
```

Check server logs in terminal where `pnpm dev` is running.

### Frontend Debugging

- Open browser DevTools (F12)
- Check Console for errors
- Use React DevTools extension
- Network tab for API calls

### Common Issues

**Port already in use:**

```bash
# Kill process on port 3001 (backend)
npx kill-port 3001

# Kill process on port 5173 (frontend)
npx kill-port 5173
```

**Database locked:**

```bash
# Close all connections and restart
rm apps/server/data/kometa-studio.db
pnpm dev
```

**TypeScript errors:**

```bash
# Clean build cache
pnpm clean
pnpm install
pnpm dev
```

## 📊 Performance Tips

### Development

- Use `--filter` to run commands in specific packages only
- Keep browser DevTools closed when not debugging
- Restart dev server if memory usage grows

### Production

- Always build before deploying
- Use production Node.js environment variables
- Consider using PM2 or similar for process management

## 🔐 Security Notes

- Never commit `.env` files
- Never commit `apps/server/data/` directory
- Review `.gitignore` before committing
- Use Template export mode when sharing configs
- Validate all user inputs on the backend

## 📝 Code Style

### TypeScript

```typescript
// Use explicit types
function processConfig(config: KometaConfig): string {
  return renderYaml(config);
}

// Avoid 'any'
const data: any; // ❌ Bad
const data: KometaConfig; // ✅ Good
```

### React Components

```tsx
// Export props interface
export interface ButtonProps {
  label: string;
  onClick: () => void;
}

// Destructure props
export function Button({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}
```

### CSS Modules

```css
/* Use camelCase for class names */
.primaryButton {
}
.navItem {
}
.headerTitle {
}
```

## 🚢 Deployment

### Environment Variables

Both the server and web apps support environment configuration. Copy the example files to get started:

```bash
# Server environment
cp apps/server/.env.example apps/server/.env

# Frontend environment (optional)
cp apps/web/.env.example apps/web/.env
```

#### Server Environment Variables (`apps/server/.env`)

| Variable                   | Required | Default                   | Description                                 |
| -------------------------- | -------- | ------------------------- | ------------------------------------------- |
| `KOMETA_STUDIO_MASTER_KEY` | Yes      | -                         | AES-256 encryption key for secrets (base64) |
| `PORT`                     | No       | `3001`                    | Server port                                 |
| `HOST`                     | No       | `127.0.0.1`               | Server host                                 |
| `DATABASE_PATH`            | No       | `./data/kometa-studio.db` | SQLite database path                        |
| `CORS_ORIGIN`              | No       | `http://localhost:5173`   | Allowed CORS origin for frontend            |

Generate a master key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### Frontend Environment Variables (`apps/web/.env`)

| Variable       | Required | Default                 | Description     |
| -------------- | -------- | ----------------------- | --------------- |
| `VITE_API_URL` | No       | `http://127.0.0.1:3001` | Backend API URL |

**Note**: Frontend variables must be prefixed with `VITE_` to be accessible in the browser.

### Building

```bash
pnpm build
```

### Running

```bash
pnpm start
```

### Docker (Future)

Docker support planned for future release.

## 📚 Additional Resources

- [Fastify Documentation](https://www.fastify.io/)
- [React Documentation](https://react.dev/)
- [Zod Documentation](https://zod.dev/)
- [Kometa Wiki](https://kometa.wiki/)
- [TMDB API Documentation](https://developers.themoviedb.org/3)

## 💬 Getting Help

- Check [GitHub Issues](https://github.com/HouseofTyrell/unofficial-kometa-studio/issues)
- Ask in [GitHub Discussions](https://github.com/HouseofTyrell/unofficial-kometa-studio/discussions)
- Review [Contributing Guide](../CONTRIBUTING.md)
