# CLAUDE.md - AI Assistant Guide for Kometa Studio

This document provides essential context for AI assistants working with the Kometa Studio codebase.

## Project Overview

Kometa Studio is an unofficial, community-created IDE for building and managing [Kometa](https://kometa.wiki/) (formerly Plex-Meta-Manager) configurations. It provides visual editing of YAML configs, overlay building with real-time preview, profile management, and secure secret handling.

**Key Features:**

- Visual YAML configuration editor
- Overlay builder with TMDB poster integration
- Profile management with encrypted secret storage
- Local-first architecture using SQLite
- Import/export with multiple secret exposure modes (template/masked/full)

## Architecture

### Monorepo Structure

```
unofficial-kometa-studio/
├── apps/
│   ├── server/          # Backend API (Fastify + SQLite)
│   └── web/             # Frontend (React + Vite)
├── packages/
│   └── shared/          # Shared types, schemas, validation
├── scripts/             # Utility scripts
└── docs/                # Documentation
```

### Package Dependencies

- `@kometa-studio/web` depends on `@kometa-studio/shared`
- `@kometa-studio/server` depends on `@kometa-studio/shared`
- Shared package must be built first

### Technology Stack

| Layer           | Technology                                            |
| --------------- | ----------------------------------------------------- |
| Frontend        | React 18, TypeScript, Vite, React Router, CSS Modules |
| Backend         | Fastify, better-sqlite3, TypeScript, tsx              |
| Validation      | Zod (shared schemas)                                  |
| YAML            | yaml (parsing/generation)                             |
| Package Manager | pnpm with workspaces                                  |
| Testing         | Vitest                                                |
| Linting         | ESLint 9 (flat config) + Prettier                     |

## Development Workflow

### Quick Start

```bash
# Install dependencies
pnpm install

# Start development servers (both frontend and backend)
pnpm dev

# Frontend only: http://localhost:5173
pnpm --filter @kometa-studio/web dev

# Backend only: http://localhost:3001
pnpm --filter @kometa-studio/server dev
```

### Required Environment Variables

The server requires a master encryption key:

```bash
# Generate a key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Set in apps/server/.env
KOMETA_STUDIO_MASTER_KEY=<your-generated-key>
```

### Common Commands

```bash
# Run all tests
pnpm test

# Run server tests
pnpm --filter @kometa-studio/server test

# Run shared package tests
pnpm --filter @kometa-studio/shared test

# Lint all code
pnpm lint

# Fix lint issues
pnpm lint:fix

# Format code
pnpm format

# Check formatting
pnpm format:check

# Build all packages
pnpm build

# Build individual packages
pnpm --filter @kometa-studio/shared build
pnpm --filter @kometa-studio/server build
pnpm --filter @kometa-studio/web build
```

## Code Conventions

### TypeScript

- Use explicit types; avoid `any` (warning level in ESLint)
- Prefix unused variables with `_` (e.g., `_unused`)
- Use interfaces for object shapes
- Export types from shared package

```typescript
// Preferred pattern
export interface UserProps {
  id: string;
  name: string;
}

export function getUser(id: string): UserProps {
  // ...
}
```

### React Components

- Use functional components with hooks
- Export props interface alongside component
- Destructure props in function signature
- Use CSS Modules for styling (`.module.css` files)
- Use `camelCase` for CSS class names in modules

```tsx
// Component file pattern
import styles from './Button.module.css';

export interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function Button({ label, onClick, disabled }: ButtonProps) {
  return (
    <button className={styles.button} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}
```

### File Naming

- **Components**: PascalCase (`Button.tsx`, `ConfirmDialog.tsx`)
- **CSS Modules**: Match component name (`Button.module.css`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Test files**: Same name with `.test.ts` suffix (`parser.test.ts`)
- **Routes**: Suffix with `.routes.ts` (`config.routes.ts`)
- **Repositories**: Suffix with `.repository.ts` (`config.repository.ts`)

### API Routes Pattern (Server)

Routes are registered as Fastify plugins:

```typescript
// apps/server/src/routes/example.routes.ts
import type { FastifyInstance } from 'fastify';

export async function exampleRoutes(fastify: FastifyInstance, opts: { repo: Repository }) {
  const { repo } = opts;

  fastify.get('/api/examples', async () => {
    return { items: repo.findAll() };
  });

  fastify.post<{ Body: CreateInput }>('/api/examples', async (request, reply) => {
    const body = await validateBody(request, reply, CreateSchema);
    if (!body) return;
    // ...
  });
}
```

### Validation

- Use Zod schemas in `packages/shared/src/schemas/`
- Validate request bodies with `validateBody()` middleware
- Validate route params with `validateIdParam()`

### Logging (Server)

Use the structured logger that auto-redacts secrets:

```typescript
import { logger } from './utils/logger.js';

logger.info('Operation completed', { userId: '123', count: 10 });
logger.error('Operation failed', error);
logger.debug('Debug info', { details: '...' });
```

The logger automatically redacts:

- Keys containing: password, secret, token, apikey, authorization, etc.
- Values matching: Base64 (32+ chars), hex (32+ chars), JWTs

### Commit Message Format

Use conventional commits:

```
<type>(<scope>): <description>

[optional body]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:

```
feat(overlay): add drag-and-drop positioning
fix(parser): handle null values in extras
docs(readme): update installation instructions
refactor(api): simplify error handling
test(yaml): add round-trip tests
```

## Testing

### Framework

- Uses Vitest for all tests
- Test files located alongside source files (`*.test.ts`)

### Running Tests

```bash
# All tests
pnpm test

# Watch mode (server)
pnpm --filter @kometa-studio/server test:watch

# Single file
pnpm --filter @kometa-studio/server test -- parser.test.ts
```

### Test Structure

```typescript
import { describe, it, expect } from 'vitest';

describe('YAML Generator', () => {
  it('should generate YAML with correct order', () => {
    const config = {
      /* ... */
    };
    const yaml = generateYaml({ config, mode: 'template' });

    expect(yaml).toContain('settings:');
    expect(yaml).not.toContain('secret-value');
  });
});
```

### Known Test Issues

- Server YAML parser tests have pre-existing failures (CI runs with `continue-on-error: true`)
- Web TypeScript build has errors (build step commented out in CI)

## Project-Specific Patterns

### YAML Handling

- Parser: `apps/server/src/yaml/parser.ts` - Converts YAML to KometaConfig
- Generator: `apps/server/src/yaml/generator.ts` - Converts KometaConfig to YAML
- Unknown keys are preserved in `extras` fields to avoid data loss

### Secret Management

- Secrets stored encrypted in SQLite using AES-256-GCM
- Never log or expose secrets; use the structured logger
- Export modes: `template` (no secrets), `masked` (partial), `full` (all secrets)

### Frontend API Client

All API calls go through `apps/web/src/api/client.ts`:

```typescript
import { configApi, profileApi, proxyApi } from '../api/client';

// Get all configs
const { configs } = await configApi.list();

// Create new config
const newConfig = await configApi.create({ name: 'My Config', config: {} });

// Proxy TMDB requests through backend
const results = await proxyApi.tmdb.search(profileId, 'Movie Name', 'movie');
```

### External Service Integration

External APIs (TMDB, Plex, etc.) are called through the server proxy (`/api/proxy/*`) to:

- Keep API keys on the server
- Avoid CORS issues
- Enable consistent error handling

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`):

1. **Lint Job**: ESLint + Prettier check
2. **Build Job**: Builds shared, then server (web build disabled)
3. **Test Job**: Runs shared and server tests

Triggered on:

- Push to `main`/`master`
- Pull requests to `main`/`master`

## Common Development Tasks

### Adding a New Page

1. Create component in `apps/web/src/pages/NewPage.tsx`
2. Add route in `apps/web/src/App.tsx`
3. Add navigation in `apps/web/src/components/layout/Sidebar.tsx`

### Adding a New API Endpoint

1. Create/update route file in `apps/server/src/routes/`
2. Register route in `apps/server/src/index.ts`
3. Add client method in `apps/web/src/api/client.ts`

### Adding a Shared Schema

1. Define Zod schema in `packages/shared/src/schemas/`
2. Export from `packages/shared/src/index.ts`
3. Rebuild shared package: `pnpm --filter @kometa-studio/shared build`

### Adding a New Overlay Feature

1. Update overlay components in `apps/web/src/components/overlay/`
2. Update preset selector if adding templates
3. Ensure Kometa-compatible YAML output in code view

## Important Considerations

### Security

- Never commit `.env` files or database files
- Use the logger's secret redaction
- Validate all user input with Zod schemas
- Secrets are encrypted at rest but accessible in UI (user choice)

### Performance

- The frontend uses Vite for fast HMR
- SQLite provides fast local storage
- External API calls are cached where appropriate

### Formatting

Prettier config (`.prettierrc`):

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

Run `pnpm format` before committing to ensure consistent formatting.

## File Quick Reference

| Purpose          | Location                                  |
| ---------------- | ----------------------------------------- |
| Server entry     | `apps/server/src/index.ts`                |
| Database setup   | `apps/server/src/db/database.ts`          |
| API routes       | `apps/server/src/routes/*.routes.ts`      |
| YAML parsing     | `apps/server/src/yaml/parser.ts`          |
| YAML generation  | `apps/server/src/yaml/generator.ts`       |
| Encryption       | `apps/server/src/crypto/encryption.ts`    |
| Frontend entry   | `apps/web/src/main.tsx`                   |
| App routing      | `apps/web/src/App.tsx`                    |
| API client       | `apps/web/src/api/client.ts`              |
| Shared schemas   | `packages/shared/src/schemas/*.schema.ts` |
| Validation utils | `packages/shared/src/validation/`         |
| ESLint config    | `eslint.config.js`                        |
| CI workflow      | `.github/workflows/ci.yml`                |
