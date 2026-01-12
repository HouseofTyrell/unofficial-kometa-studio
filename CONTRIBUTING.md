# Contributing to Kometa Studio

Thank you for your interest in contributing to Kometa Studio! This document provides guidelines and instructions for contributing.

## 🤝 How to Contribute

### Reporting Bugs

1. **Check Existing Issues**: Search [existing issues](https://github.com/yourusername/kometa-studio/issues) first
2. **Create Detailed Report**: Include:
   - Clear description of the issue
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, Node version, browser)

### Suggesting Features

1. **Check Roadmap**: Review the README roadmap first
2. **Open Discussion**: Use [GitHub Discussions](https://github.com/yourusername/kometa-studio/discussions)
3. **Provide Context**: Explain the use case and benefit

### Pull Requests

1. **Fork and Clone**:

   ```bash
   git clone https://github.com/yourusername/kometa-studio.git
   cd kometa-studio
   ```

2. **Create Branch**:

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Install Dependencies**:

   ```bash
   pnpm install
   ```

4. **Make Changes**: Follow the code style guidelines below

5. **Test Thoroughly**: Ensure your changes don't break existing functionality

6. **Commit with Clear Messages**:

   ```bash
   git commit -m "feat: add amazing feature"
   ```

7. **Push and Create PR**:
   ```bash
   git push origin feature/your-feature-name
   ```

## 💻 Development Setup

### Prerequisites

- Node.js 18+
- pnpm 8+
- Git

### Running Locally

```bash
# Install dependencies
pnpm install

# Start development servers (both frontend and backend)
pnpm dev

# Frontend only
pnpm --filter @kometa-studio/web dev

# Backend only
pnpm --filter @kometa-studio/server dev
```

### Project Structure

```
kometa-studio/
├── apps/
│   ├── server/     # Backend API
│   └── web/        # Frontend UI
└── packages/
    └── shared/     # Shared types & schemas
```

## 📝 Code Style Guidelines

### TypeScript

- **Use TypeScript** for all new code
- **Define types** explicitly, avoid `any`
- **Use interfaces** for object shapes
- **Prefer const** over let when possible

```typescript
// Good
interface User {
  id: string;
  name: string;
}

const getUser = (id: string): User => {
  // ...
};

// Avoid
const getUser = (id: any): any => {
  // ...
};
```

### React Components

- **Use functional components** with hooks
- **Props interface** should be exported
- **Destructure props** in function signature
- **Use CSS Modules** for styling

```tsx
// Good
export interface ButtonProps {
  label: string;
  onClick: () => void;
}

export function Button({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}
```

### Naming Conventions

- **Files**: PascalCase for components (`Button.tsx`), camelCase for utilities (`formatDate.ts`)
- **Components**: PascalCase (`UserProfile`)
- **Functions**: camelCase (`getUserById`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **CSS Classes**: camelCase in modules (`styles.primaryButton`)

### Comments

- **Add comments** for complex logic
- **Use JSDoc** for public functions
- **Explain why**, not what

```typescript
/**
 * Extracts secrets from YAML config and creates a profile
 * This preserves unknown keys in extras to avoid data loss
 */
export function extractSecretsFromYaml(yaml: string): Profile {
  // ...
}
```

## 🧪 Testing

Currently, the project doesn't have automated tests (contributions welcome!). Manual testing guidelines:

1. **Test all user flows** affected by your changes
2. **Check responsiveness** on different screen sizes
3. **Verify error handling** with invalid inputs
4. **Test with empty states** (no configs, no profiles)
5. **Check browser console** for errors

## 🔧 Common Tasks

### Adding a New Page

1. Create component in `apps/web/src/pages/`
2. Add route in `apps/web/src/App.tsx`
3. Add navigation link in `apps/web/src/components/layout/Sidebar.tsx`

### Adding a New API Endpoint

1. Define route in `apps/server/src/routes/`
2. Register route in `apps/server/src/index.ts`
3. Add client method in `apps/web/src/api/client.ts`

### Adding a New Schema Field

1. Update schema in `packages/shared/src/schemas/`
2. Update parser in `apps/server/src/yaml/parser.ts`
3. Update renderer in `apps/server/src/yaml/renderer.ts`

## 📋 Commit Message Guidelines

Follow conventional commits format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(overlay): add drag-and-drop positioning
fix(parser): handle null values in extras
docs(readme): update installation instructions
refactor(api): simplify error handling
```

## 🚀 Release Process

(For maintainers)

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create git tag: `git tag -a v1.0.0 -m "Release v1.0.0"`
4. Push tag: `git push origin v1.0.0`
5. Create GitHub release with notes

## ❓ Questions?

- **General Questions**: Use [GitHub Discussions](https://github.com/yourusername/kometa-studio/discussions)
- **Bug Reports**: Open an [Issue](https://github.com/yourusername/kometa-studio/issues)
- **Security Issues**: Email directly (don't open public issue)

## 📜 Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Remember this is a community project

Thank you for contributing to Kometa Studio! 🎉
