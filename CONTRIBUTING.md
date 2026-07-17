# Contributing to CipherForge Pro

Thank you for your interest in contributing.

## Development Setup

```bash
git clone https://github.com/your-org/cipherforge-pro.git
cd cipherforge-pro
npm install
npm run dev
```

## Guidelines

- All code must be **TypeScript** — no `any` types
- Run `npm run typecheck` and `npm run lint` before committing
- Write tests for new features (`src/__tests__/`)
- Follow existing code conventions
- No external network requests — this is an offline-first application
- No analytics, telemetry, or tracking
- Educational disclaimer must be present where cipher operations are exposed

## Commit Messages

Use conventional commits:
- `feat: add new cipher module`
- `fix: resolve frequency analysis edge case`
- `docs: update README`
- `test: add Vigenere cipher tests`

## Pull Requests

1. Create a feature branch from `main`
2. Make your changes
3. Ensure `npm run build` passes
4. Ensure all tests pass
5. Submit a PR with a clear description

## Security

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities.
