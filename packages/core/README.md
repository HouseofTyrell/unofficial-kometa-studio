# @kometa-studio/core

Core library for parsing, generating, and validating [Kometa](https://kometa.wiki/) (formerly Plex-Meta-Manager) YAML configurations.

## Installation

### From GitHub Packages

```bash
# Configure npm to use GitHub Packages for @kometa-studio scope
echo "@kometa-studio:registry=https://npm.pkg.github.com" >> .npmrc

# Install the package
npm install @kometa-studio/core
# or
pnpm add @kometa-studio/core
# or
yarn add @kometa-studio/core
```

### Authentication

To install from GitHub Packages, you need to authenticate. Create a GitHub Personal Access Token with `read:packages` scope, then:

```bash
# Add to your .npmrc
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

## Usage

### Parse a Kometa YAML Configuration

```typescript
import { parseKometaYaml } from '@kometa-studio/core';

const yamlContent = `
settings:
  cache: true
  cache_expiration: 60

plex:
  url: http://localhost:32400
  token: your-plex-token

libraries:
  Movies:
    collection_files:
      - default: imdb
`;

const config = parseKometaYaml(yamlContent);
console.log(config.settings?.cache); // true
console.log(config.libraries?.Movies?.collection_files); // [{ default: 'imdb' }]
```

### Extract Secrets from YAML

```typescript
import { extractSecretsFromYaml } from '@kometa-studio/core';

const secrets = extractSecretsFromYaml(yamlContent);
console.log(secrets.plex?.token); // 'your-plex-token'
console.log(secrets.plex?.url); // 'http://localhost:32400'
```

### Generate YAML from Configuration

```typescript
import { generateYaml } from '@kometa-studio/core';

const config = {
  settings: { cache: true },
  plex: { enabled: true },
  libraries: {
    Movies: {
      collection_files: [{ default: 'imdb' }],
    },
  },
};

// Generate without secrets (template mode)
const templateYaml = generateYaml({ config, mode: 'template' });

// Generate with masked secrets
const profile = {
  id: '1',
  name: 'My Profile',
  secrets: {
    plex: { url: 'http://localhost:32400', token: 'secret-token-123' },
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const maskedYaml = generateYaml({ config, profile, mode: 'masked' });
// Token appears as: secr****123

// Generate with full secrets (for backup/export)
const fullYaml = generateYaml({ config, profile, mode: 'full' });
```

### Validate Configuration

```typescript
import { validateConfig } from '@kometa-studio/core';

const config = {
  plex: { enabled: true },
  libraries: {},
};

const result = validateConfig(config);
console.log(result.valid); // true (no errors)
console.log(result.warnings); // Array of warnings about missing credentials
```

### Use Zod Schemas for Type Safety

```typescript
import { KometaConfigSchema, type KometaConfig } from '@kometa-studio/core';

// Validate unknown data
const data = JSON.parse(someJsonString);
const result = KometaConfigSchema.safeParse(data);

if (result.success) {
  const config: KometaConfig = result.data;
  // Type-safe access to config
}
```

## API Reference

### YAML Processing

- `parseKometaYaml(yamlString, preserveExtras?)` - Parse YAML string to config object
- `extractSecretsFromYaml(yamlString)` - Extract secrets from YAML
- `generateYaml(options)` - Generate YAML from config object

### Validation

- `validateConfig(config, profile?)` - Validate configuration and return warnings/errors
- `maskSecret(secret)` - Mask a secret string (e.g., `abcd****wxyz`)

### Schemas (Zod)

- `KometaConfigSchema` - Main configuration schema
- `ProfileSchema` - Profile with secrets schema
- `ProfileSecretsSchema` - Secrets-only schema
- `SettingsSchema` - Settings section schema
- `LibrarySchema` - Library configuration schema
- `ValidationResultSchema` - Validation result schema

### Types

All schemas export corresponding TypeScript types:

```typescript
import type {
  KometaConfig,
  Profile,
  ProfileSecrets,
  Settings,
  Library,
  FileEntry,
  ValidationResult,
  ValidationIssue,
} from '@kometa-studio/core';
```

## Features

- **Full TypeScript support** - All types exported
- **Zod validation** - Runtime validation with detailed errors
- **Extras preservation** - Unknown YAML keys are preserved in `extras` fields
- **Secret handling** - Separate secrets from config, mask for display
- **Three output modes** - template, masked, full

## License

MIT
