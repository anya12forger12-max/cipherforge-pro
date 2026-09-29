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
- **Local Accounts** — Create an account on-device; the email and a salted PBKDF2 password hash never leave the browser
- **Command Palette** — Ctrl+P for fuzzy command search
- **First Launch Wizard** — Theme, accessibility, and privacy onboarding

## Accounts

CipherForge Pro asks you to create a **local account** the first time you open it, and it can be created at any time from the sign-in screen via **Create account**. The account exists only in this browser's local storage:

- **Sign-up** requires an email address, a password of at least 8 characters, a matching confirmation, and an explicit tick on "I explicitly accept the Privacy Policy to use CipherForge Pro." Without that tick, sign-up and sign-in are both refused.
- **Passwords are never stored.** Each account gets a random 16-byte salt, and the password is stretched with PBKDF2-HMAC-SHA256 (150,000 iterations) through WebCrypto. The result is a hex digest compared in constant time.
- **Nothing is transmitted.** The email, the salt, the digest, the active session, and your consent timestamp all stay in local storage. There is no server, no analytics, and no telemetry.
- **The session is persisted**, so a page reload keeps you signed in. **Sign out** is in the header; it clears the session only, so you can sign back in.
- **Legacy installs** (the old single-hash login) are upgraded automatically: the first successful sign-in re-derives your password with PBKDF2 and removes the old key.
- WebCrypto is only available in a secure context (`https` or `localhost`). Served over plain `http://<LAN-IP>`, the app falls back to a weaker single-pass salted SHA-256 digest and keeps working; the digest that was used is recorded per account.

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
