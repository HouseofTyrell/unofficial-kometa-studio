# Kometa Studio - Technical Review

**Reviewer**: Staff Software Engineer
**Date**: 2026-01-12
**Commit**: `ed93980`

---

## A. Architecture Summary

### 1. Monorepo Structure

```
unofficial-kometa-studio/
├── apps/
│   ├── server/          # Backend API (Fastify + better-sqlite3)
│   │   ├── src/
│   │   │   ├── crypto/  # AES-256-GCM encryption
│   │   │   ├── db/      # SQLite repositories
│   │   │   ├── routes/  # API endpoints
│   │   │   └── yaml/    # Parser & generator
│   │   └── data/        # SQLite database (gitignored)
│   │
│   └── web/             # Frontend (React 18 + Vite)
│       ├── src/
│       │   ├── api/     # HTTP client
│       │   ├── components/
│       │   │   ├── overlay/   # Overlay builder components
│       │   │   └── editors/   # Config section editors
│       │   ├── pages/         # Route pages
│       │   └── services/      # TMDB, Plex, Kometa-defaults
│       └── public/
│
└── packages/
    └── shared/          # Shared types & validation
        └── src/
            ├── schemas/     # Zod schemas (config, profile, api)
            └── validation/  # Config validator
```

### 2. Technology Stack

| Layer                  | Technology     | Version | Notes                            |
| ---------------------- | -------------- | ------- | -------------------------------- |
| **Frontend Framework** | React          | 18.2.0  | Functional components with hooks |
| **Build Tool**         | Vite           | 5.0.8   | Fast HMR, ESM                    |
| **Backend Framework**  | Fastify        | 4.25.2  | Async-first, plugin-based        |
| **Database**           | better-sqlite3 | 9.2.2   | Synchronous SQLite bindings      |
| **YAML (Server)**      | yaml           | 2.3.4   | Used for parsing/generation      |
| **YAML (Client)**      | js-yaml        | 4.1.1   | Used in overlay service          |
| **Validation**         | Zod            | 3.22.4  | Schema-first validation          |
| **Testing**            | Vitest         | 1.0.4   | Fast unit testing                |
| **Package Manager**    | pnpm           | 8+      | Workspace support                |

### 3. Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
│                                                                         │
│  ┌──────────┐    ┌─────────────┐    ┌───────────────────────────────┐  │
│  │  Pages   │───▶│  API Client │───▶│  External Services (Direct)   │  │
│  │          │    │  (fetch)    │    │  - TMDB API                   │  │
│  └──────────┘    └──────┬──────┘    │  - Plex Server                │  │
│                         │           │  - Radarr/Sonarr              │  │
│                         │           │  - Kometa GitHub Defaults     │  │
│                         │           └───────────────────────────────┘  │
└─────────────────────────│───────────────────────────────────────────────┘
                          │ HTTP (localhost:3001)
                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                     │
│                                                                         │
│  ┌──────────────┐    ┌────────────────┐    ┌──────────────────────┐    │
│  │ Fastify      │───▶│  Repositories  │───▶│  SQLite              │    │
│  │ Routes       │    │  - ConfigRepo  │    │  - configs table     │    │
│  │              │    │  - ProfileRepo │    │  - profiles table    │    │
│  └──────────────┘    └────────────────┘    └──────────────────────┘    │
│         │                    │                                          │
│         ▼                    ▼                                          │
│  ┌──────────────┐    ┌────────────────┐                                │
│  │ YAML Parser  │    │  Encryption    │                                │
│  │ & Generator  │    │  (AES-256-GCM) │                                │
│  └──────────────┘    └────────────────┘                                │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4. Key Domain Models

#### Profile (Secrets Container)

- **Location**: `packages/shared/src/schemas/profile.schema.ts`
- **Storage**: Encrypted JSON in `profiles.secrets_encrypted` column
- **Services**: Plex, TMDB, Tautulli, MDBList, Radarr, Sonarr, Trakt
- **Extras**: Extensible for unknown services

#### KometaConfig (Configuration)

- **Location**: `packages/shared/src/schemas/config.schema.ts`
- **Storage**: JSON in `configs.config` column (NOT encrypted)
- **Sections**: settings, plex, tmdb, tautulli, mdblist, radarr, sonarr, trakt, libraries
- **Extras**: Unknown keys preserved via `.passthrough()` and explicit `extras` fields

#### Overlay Elements (Preview)

- **Location**: `apps/web/src/components/overlay/PosterPreview.tsx`
- **Types**: badge, text, image, ribbon
- **Rendering**: Canvas-based with Kometa-accurate positioning

### 5. Secrets Handling Architecture

```
                    MASTER KEY (env var)
                           │
                           ▼
┌─────────────────────────────────────────────┐
│              PBKDF2 Key Derivation          │
│  - 100,000 iterations                       │
│  - SHA-256                                  │
│  - Random 32-byte salt per encryption       │
└─────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────┐
│              AES-256-GCM Encryption         │
│  - 12-byte random IV                        │
│  - 16-byte auth tag                         │
│  - JSON envelope with version               │
└─────────────────────────────────────────────┘
                           │
                           ▼
                    SQLite Storage
              (profiles.secrets_encrypted)
```

### 6. Overlay Builder State

- **Current State**: Preview-only; generates overlay elements dynamically
- **Data Sources**: TMDB (posters, ratings), Plex (resolution, codecs), Kometa GitHub defaults
- **Rendering**: 500x750 canvas (scaled from Kometa's 1000x1500)
- **Limitations**: No drag-and-drop editing; no save to config file (UI exists but incomplete)

---

## B. Issues & Risks (Prioritized)

### Priority Legend

- **P0**: Security/Privacy - Must fix before production use
- **P1**: Correctness - Bugs that affect data integrity or UX
- **P2**: DX/Maintainability - Important for long-term health

| Priority | Area        | Description                                                                                                                                                                                    | Risk   | Fix Summary                                                                  | Files                                                                                                                           |
| -------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **P0**   | Security    | **Frontend leaks secrets in browser network tab**: Direct external API calls (TMDB, Plex, Radarr, Sonarr, Tautulli) made from browser expose tokens to any page inspector or browser extension | HIGH   | Proxy all external calls through backend                                     | `apps/web/src/pages/ProfilesPage.tsx:179-235`, `apps/web/src/services/plex.service.ts`, `apps/web/src/services/tmdb.service.ts` |
| **P0**   | Security    | **Console logging may expose secrets**: Error logging includes stack traces that could contain secret values                                                                                   | MEDIUM | Sanitize all log output; never log request bodies on profile routes          | `apps/server/src/routes/config.routes.ts:131-132`                                                                               |
| **P0**   | Security    | **No input validation on API routes**: Request bodies typed as `any`; no schema validation before processing                                                                                   | HIGH   | Add Zod validation to all route handlers                                     | `apps/server/src/routes/profile.routes.ts:72`, `apps/server/src/routes/config.routes.ts:32`                                     |
| **P0**   | Security    | **Bulk delete endpoints exposed without confirmation**: DELETE `/api/configs` and `/api/profiles` wipe all data                                                                                | MEDIUM | Add confirmation token or remove bulk delete from API                        | `apps/server/src/routes/config.routes.ts:229-260`                                                                               |
| **P1**   | Correctness | **YAML round-trip may lose comments**: The `yaml` library doesn't preserve YAML comments on parse/stringify                                                                                    | MEDIUM | Document limitation; consider using yaml-ast-parser for comment preservation | `apps/server/src/yaml/parser.ts`, `apps/server/src/yaml/generator.ts`                                                           |
| **P1**   | Correctness | **Schema not pinned to Kometa version**: Hard-coded known keys may drift as Kometa evolves                                                                                                     | LOW    | Add version metadata; document update process; consider fetching schema      | `apps/server/src/yaml/parser.ts:42-93`, `packages/shared/src/schemas/config.schema.ts`                                          |
| **P1**   | Correctness | **Trakt client_id stored in config, not profile**: Unlike other services, client_id is non-secret but authorization tokens are secrets                                                         | LOW    | Clarify in docs; consider moving to consistent pattern                       | `packages/shared/src/schemas/config.schema.ts:163-167`                                                                          |
| **P1**   | Correctness | **Import creates duplicate profiles**: Each YAML import creates a new profile even if same secrets exist                                                                                       | LOW    | Add deduplication or update-existing option                                  | `apps/server/src/routes/config.routes.ts:113-126`                                                                               |
| **P1**   | UX          | **No confirmation on delete actions**: Single-click delete for profiles and configs                                                                                                            | MEDIUM | Add confirmation dialogs in frontend                                         | `apps/web/src/pages/ProfilesPage.tsx:95-107`                                                                                    |
| **P2**   | DX          | **No ESLint/Prettier configuration**: Code style not enforced                                                                                                                                  | LOW    | Add eslint + prettier with pre-commit hooks                                  | Root level                                                                                                                      |
| **P2**   | DX          | **No CI/CD pipeline**: No automated testing, linting, or builds                                                                                                                                | MEDIUM | Add GitHub Actions workflow                                                  | `.github/workflows/`                                                                                                            |
| **P2**   | DX          | **Console.log statements in production**: Debug logging clutters console                                                                                                                       | LOW    | Replace with conditional debug logging                                       | `apps/web/src/services/*.ts`                                                                                                    |
| **P2**   | DX          | **No TypeScript strict mode on frontend**: Web tsconfig less strict than shared                                                                                                                | LOW    | Enable strict mode; fix type errors                                          | `apps/web/tsconfig.json`                                                                                                        |
| **P2**   | DX          | **Missing test coverage**: No coverage reports; minimal test coverage                                                                                                                          | MEDIUM | Add coverage thresholds; expand tests                                        | `vitest.config.ts` files                                                                                                        |
| **P2**   | DX          | **No Dependabot/Renovate**: Dependencies not auto-updated                                                                                                                                      | LOW    | Add dependency update automation                                             | `.github/dependabot.yml`                                                                                                        |
| **P2**   | Types       | **Extensive use of `any` type**: Reduces type safety throughout codebase                                                                                                                       | MEDIUM | Replace with proper types/generics                                           | Throughout                                                                                                                      |

---

## C. Recommended Changes (Prioritized Plan)

### Quick Wins (≤1 day each)

#### 1. Add Request Validation to API Routes

**Rationale**: Prevent injection attacks and malformed data from reaching the database.

**Affected Areas**:

- `apps/server/src/routes/profile.routes.ts`
- `apps/server/src/routes/config.routes.ts`

**Acceptance Criteria**:

- All POST/PUT handlers validate body against Zod schema
- Invalid requests return 400 with helpful error messages
- Existing tests still pass

**Risk**: Low - additive change

---

#### 2. Add ESLint + Prettier Configuration

**Rationale**: Enforce consistent code style across contributors.

**Affected Areas**:

- Root `package.json`
- New `.eslintrc.cjs`, `.prettierrc`
- All source files (auto-fix)

**Acceptance Criteria**:

- `pnpm lint` runs ESLint on all packages
- `pnpm format` runs Prettier
- Pre-commit hook prevents commits with lint errors

**Risk**: Low - tooling only

---

#### 3. Remove Production Console.log Statements

**Rationale**: Clean up browser console; prevent accidental secret logging.

**Affected Areas**:

- `apps/web/src/services/plex.service.ts`
- `apps/web/src/services/tmdb.service.ts`
- `apps/web/src/services/kometa-defaults.service.ts`
- `apps/server/src/routes/config.routes.ts`

**Acceptance Criteria**:

- No `console.log` in production builds
- Optional: Add debug flag for development logging

**Risk**: Low

---

#### 4. Add GitHub Actions CI Workflow

**Rationale**: Catch regressions before merge; ensure builds work.

**Affected Areas**:

- `.github/workflows/ci.yml`

**Acceptance Criteria**:

- Runs on push/PR to main
- Runs `pnpm install`, `pnpm build`, `pnpm test`, `pnpm lint`
- Caches node_modules for speed

**Risk**: Low

---

### Medium Effort (2-5 days each)

#### 5. Proxy External API Calls Through Backend

**Rationale**: **Critical security fix** - prevents secrets from appearing in browser network tab.

**Affected Areas**:

- New `apps/server/src/routes/proxy.routes.ts`
- `apps/web/src/services/tmdb.service.ts` → use backend proxy
- `apps/web/src/services/plex.service.ts` → use backend proxy
- `apps/web/src/pages/ProfilesPage.tsx` → use backend for connection tests

**Acceptance Criteria**:

- All external API calls route through `/api/proxy/*`
- Frontend never handles raw API keys for TMDB, Plex, etc.
- Connection test buttons work via backend
- Overlay Builder poster search works via backend

**Risk**: Medium - significant refactor; needs thorough testing

---

#### 6. Add Comprehensive API Tests

**Rationale**: Ensure routes behave correctly; catch regressions.

**Affected Areas**:

- New `apps/server/src/routes/*.test.ts` files
- `apps/server/vitest.config.ts`

**Acceptance Criteria**:

- Unit tests for all API routes
- Tests for validation, error cases, edge cases
- Coverage report generated
- Minimum 80% coverage for routes

**Risk**: Low

---

#### 7. Replace `any` Types with Proper TypeScript Types

**Rationale**: Improve type safety; catch bugs at compile time.

**Affected Areas**:

- `apps/web/src/api/client.ts`
- `apps/web/src/pages/*.tsx`
- `apps/server/src/routes/*.ts`

**Acceptance Criteria**:

- No `any` in new code
- Existing `any` replaced with proper types
- TypeScript strict mode enabled
- `pnpm typecheck` script added and passes

**Risk**: Medium - may surface latent bugs

---

#### 8. Add Confirmation Dialogs for Destructive Actions

**Rationale**: Prevent accidental data loss.

**Affected Areas**:

- `apps/web/src/pages/ProfilesPage.tsx`
- `apps/web/src/pages/ImportExportPage.tsx`
- New shared confirmation dialog component

**Acceptance Criteria**:

- Delete profile requires confirmation
- Delete config requires confirmation
- Reset all data requires confirmation + text input ("delete all")

**Risk**: Low

---

### Larger Refactors (1-3 weeks each)

#### 9. Implement Proper Logging Infrastructure

**Rationale**: Structured logging without secret leakage; useful for debugging.

**Affected Areas**:

- New `apps/server/src/utils/logger.ts`
- All route handlers
- Error handler in `apps/server/src/index.ts`

**Acceptance Criteria**:

- Pino logger with structured JSON output
- Log levels configurable via env
- Request/response logging with secret redaction
- Error logging sanitizes all fields
- Log rotation for production

**Risk**: Low-Medium

---

#### 10. Schema Versioning and Migration System

**Rationale**: Enable safe upgrades to Kometa config schema; handle breaking changes.

**Affected Areas**:

- New `packages/shared/src/schemas/versions/`
- New migration system in `apps/server/src/db/`
- Database schema changes

**Acceptance Criteria**:

- Schema version stored with each config
- Migration functions for version upgrades
- Backward compatibility for older configs
- CLI tool for manual migrations

**Risk**: Medium-High - needs careful design

---

#### 11. Complete Overlay Builder Save Functionality

**Rationale**: Allow users to save custom overlays to their config files.

**Affected Areas**:

- `apps/web/src/components/overlay/SaveOverlayDialog.tsx`
- `apps/server/src/routes/config.routes.ts`
- New overlay file management endpoints

**Acceptance Criteria**:

- Save overlay to new or existing overlay file
- Update library's `overlay_files` array
- Preview before save
- Proper YAML generation for overlay definitions

**Risk**: Medium - complex feature; needs design doc

---

## D. PR-Sized Task List

### PR 1: Add Request Validation and Input Sanitization

**Goal**: Prevent malformed/malicious input from reaching the database

**Files to Touch**:

- `apps/server/src/routes/profile.routes.ts`
- `apps/server/src/routes/config.routes.ts`
- `packages/shared/src/schemas/api.schema.ts` (new validation schemas)

**Checklist**:

- [ ] Create `CreateProfileSchema`, `UpdateProfileSchema` in shared
- [ ] Create `CreateConfigSchema`, `UpdateConfigSchema`, `ImportYamlSchema` in shared
- [ ] Add Fastify schema validation to all POST/PUT handlers
- [ ] Return 400 with Zod error messages on validation failure
- [ ] Add unit tests for validation edge cases
- [ ] Test existing functionality still works

**Tests to Add/Update**:

- `apps/server/src/routes/profile.routes.test.ts` (new)
- `apps/server/src/routes/config.routes.test.ts` (new)

---

### PR 2: Setup ESLint, Prettier, and Pre-commit Hooks

**Goal**: Enforce code quality and consistent style

**Files to Touch**:

- `package.json` (scripts, devDependencies)
- `.eslintrc.cjs` (new)
- `.prettierrc` (new)
- `.husky/pre-commit` (new)
- All `*.ts` and `*.tsx` files (auto-format)

**Checklist**:

- [ ] Install eslint, prettier, husky, lint-staged
- [ ] Configure ESLint for TypeScript + React
- [ ] Configure Prettier
- [ ] Add husky pre-commit hook
- [ ] Run `pnpm format` on all files
- [ ] Fix any lint errors
- [ ] Add `lint` and `format` scripts to root package.json

**Tests to Add/Update**:

- None (tooling only)

---

### PR 3: Add GitHub Actions CI Workflow

**Goal**: Automated testing and quality checks on every PR

**Files to Touch**:

- `.github/workflows/ci.yml` (new)
- `.github/dependabot.yml` (new)

**Checklist**:

- [ ] Create CI workflow that runs on push/PR
- [ ] Install dependencies with pnpm
- [ ] Run build for all packages
- [ ] Run tests for all packages
- [ ] Run lint check
- [ ] Run type check
- [ ] Cache node_modules and pnpm store
- [ ] Add Dependabot for npm updates

**Tests to Add/Update**:

- None (CI setup)

---

### PR 4: Proxy External API Calls Through Backend (Security Critical)

**Goal**: Remove secret exposure in browser network tab

**Files to Touch**:

- `apps/server/src/routes/proxy.routes.ts` (new)
- `apps/server/src/index.ts` (register routes)
- `apps/web/src/services/tmdb.service.ts`
- `apps/web/src/services/plex.service.ts`
- `apps/web/src/pages/ProfilesPage.tsx`
- `apps/web/src/api/client.ts`

**Checklist**:

- [ ] Create `/api/proxy/tmdb/*` endpoint that forwards to TMDB API
- [ ] Create `/api/proxy/plex/*` endpoint that forwards to user's Plex server
- [ ] Create `/api/proxy/test-connection` endpoint for all service tests
- [ ] Update TmdbService to call backend proxy
- [ ] Update PlexService to call backend proxy
- [ ] Update ProfilesPage to use backend for connection tests
- [ ] Add rate limiting to proxy endpoints
- [ ] Add timeout handling
- [ ] Ensure error messages don't leak secrets

**Tests to Add/Update**:

- `apps/server/src/routes/proxy.routes.test.ts` (new)
- Integration tests for TMDB/Plex proxy

---

### PR 5: Remove Debug Logging and Add Structured Logger

**Goal**: Clean production logs; prevent accidental secret logging

**Files to Touch**:

- `apps/server/src/utils/logger.ts` (new)
- `apps/server/src/index.ts`
- `apps/server/src/routes/*.ts`
- `apps/web/src/services/*.ts`

**Checklist**:

- [ ] Create logger utility with secret redaction
- [ ] Replace Fastify's default logger with configured Pino
- [ ] Remove all `console.log` from web services
- [ ] Add debug mode toggle via env var
- [ ] Ensure stack traces don't contain secrets
- [ ] Add log level configuration

**Tests to Add/Update**:

- `apps/server/src/utils/logger.test.ts` (new)

---

### PR 6: TypeScript Strict Mode and Type Safety Improvements

**Goal**: Catch type errors at compile time; eliminate `any`

**Files to Touch**:

- `apps/web/tsconfig.json`
- `apps/server/tsconfig.json`
- `apps/web/src/api/client.ts`
- `apps/web/src/pages/*.tsx`
- `packages/shared/src/schemas/*.ts`

**Checklist**:

- [ ] Enable `strict: true` in all tsconfigs
- [ ] Fix resulting type errors
- [ ] Replace `any` with proper types in API client
- [ ] Add generic types to API functions
- [ ] Export proper types from shared package
- [ ] Add `pnpm typecheck` script
- [ ] Ensure typecheck passes

**Tests to Add/Update**:

- Type tests using `expectType` patterns

---

### PR 7: Add Confirmation Dialogs for Destructive Actions

**Goal**: Prevent accidental data deletion

**Files to Touch**:

- `apps/web/src/components/shared/ConfirmDialog.tsx` (new)
- `apps/web/src/components/shared/ConfirmDialog.module.css` (new)
- `apps/web/src/pages/ProfilesPage.tsx`
- `apps/web/src/pages/ImportExportPage.tsx`

**Checklist**:

- [ ] Create reusable ConfirmDialog component
- [ ] Add confirmation for profile deletion
- [ ] Add confirmation for config deletion
- [ ] Add typed confirmation for "Reset All Data" (user types "delete all")
- [ ] Add keyboard handling (Escape to cancel, Enter to confirm)
- [ ] Add focus trap for accessibility

**Tests to Add/Update**:

- `apps/web/src/components/shared/ConfirmDialog.test.tsx` (new)

---

### PR 8: YAML Round-Trip Test Suite

**Goal**: Ensure YAML import/export preserves all data correctly

**Files to Touch**:

- `apps/server/src/yaml/roundtrip.test.ts` (new)
- `apps/server/src/yaml/fixtures/*.yml` (new test fixtures)
- `apps/server/src/yaml/parser.ts` (potential fixes)
- `apps/server/src/yaml/generator.ts` (potential fixes)

**Checklist**:

- [ ] Create test fixtures with various Kometa configs
- [ ] Add round-trip test: parse → generate → parse → compare
- [ ] Test extras preservation at all levels
- [ ] Test handling of unknown keys
- [ ] Test edge cases (empty values, special characters, Unicode)
- [ ] Document known limitations (comments not preserved)
- [ ] Add property-based tests with fast-check (optional)

**Tests to Add/Update**:

- `apps/server/src/yaml/roundtrip.test.ts` (new)
- `apps/server/src/yaml/parser.test.ts` (expand)
- `apps/server/src/yaml/generator.test.ts` (expand)

---

## E. Additional Recommendations

### Documentation

1. Add `SECURITY.md` with threat model and security considerations
2. Document the master key backup/recovery process
3. Add architecture diagram to README
4. Document the Kometa schema update process

### Future Considerations

1. **Electron wrapper**: For true local-first without browser security concerns
2. **OS credential store integration**: Use Keychain/DPAPI/libsecret for master key
3. **Export encryption**: Optionally encrypt exported configs with password
4. **Audit log**: Track who changed what and when
5. **Backup/restore**: Automated backup with encryption

---

## F. Risk Assessment Summary

| Category         | Current Risk | After PRs 1-4 | After All PRs |
| ---------------- | ------------ | ------------- | ------------- |
| Secret Exposure  | HIGH         | LOW           | VERY LOW      |
| Data Integrity   | MEDIUM       | MEDIUM        | LOW           |
| Input Validation | HIGH         | LOW           | LOW           |
| Code Quality     | MEDIUM       | LOW           | VERY LOW      |
| Test Coverage    | HIGH         | MEDIUM        | LOW           |
| Maintainability  | MEDIUM       | LOW           | LOW           |

---

_End of Technical Review_
