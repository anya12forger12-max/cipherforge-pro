# CipherForge Pro

Enterprise-grade educational cryptography toolkit. 100% offline, privacy-first.

> **Educational Notice:** The Caesar Cipher is historical and **NOT secure** for real-world use. This tool is for learning purposes only.

## Features

- **Caesar Cipher** — Encrypt, decrypt, brute force, frequency analysis
- **Enhanced Analysis** — Chi-squared scoring, pattern detection, key length estimation
- **7 Themes** — Dark, Light, High Contrast, Cyber Green, Midnight Blue, Professional Gray, Color-Blind Friendly
- **WCAG 2.2 AAA** accessibility compliance
- **Offline-First** — No network requests, no telemetry, no analytics
- **Privacy-First** — All data stays on your device
- **Command Palette** — Ctrl+P for fuzzy command search
- **First Launch Wizard** — Theme, accessibility, and privacy onboarding

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests |
| `npm run lint` | Run linter |
| `npm run typecheck` | Type-check without emitting |

## Tech Stack

- React 18 + TypeScript
- Vite
- Zustand (state management)
- Vitest (testing)
- Lucide React (icons)

## Project Structure

```
src/
├── core/
│   ├── crypto/          # Cipher engines and registry
│   ├── engines/         # Caesar, frequency analysis
│   ├── security/        # Security, privacy, audit, monitoring
│   ├── services/        # File, workspace, history, cache, plugins
│   └── types/           # TypeScript type definitions
├── ui/
│   ├── components/      # React components
│   │   ├── common/      # StatusBar, Sidebar, Header, CommandPalette, etc.
│   │   ├── dashboard/   # Dashboard
│   │   ├── workspace/   # Cipher workspace
│   │   ├── settings/    # Settings
│   │   ├── help/        # Help center
│   │   ├── visualizations/  # Charts and visualizations
│   │   ├── privacy/     # Privacy center
│   │   ├── security/    # Security audit
│   │   ├── recovery/    # Recovery center
│   │   └── diagnostics/ # Diagnostics
│   └── themes/          # Theme definitions and store
├── stores/              # Zustand stores
└── __tests__/           # Vitest tests
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+P` | Command Palette |
| `Ctrl+E` | Encrypt |
| `Ctrl+D` | Decrypt |
| `Ctrl+B` | Brute Force |
| `Ctrl+F` | Frequency Analysis |
| `Ctrl+V` | Visualizations |
| `Ctrl+,` | Settings |
| `F1` | Help |

## License

MIT
