# CipherForge Pro

A browser-based educational cipher workspace for exploring Caesar and Vigenère ciphers, brute-force key search, and frequency analysis — with local accounts and no backend.

> **Educational notice:** Caesar and Vigenère are historical ciphers and are **not secure** for real-world confidentiality. The app displays this disclaimer on the dashboard. Use modern authenticated encryption (for example AES-256-GCM or ChaCha20-Poly1305) for real data.

## Features

- **Caesar workspace** — encrypt, decrypt, and brute-force all 26 shifts with shift controls and scored candidate results.
- **Frequency analysis** — English letter-frequency comparison, chi-squared score, correlation, and top-shift suggestions in `src/core/engines/frequency.ts`.
- **Vigenère module** — a registered keyword cipher implementation with analysis helpers in `src/core/crypto/vigenere.ts`; the current Workspace screen drives Caesar operations.
- **Visualizations** — charts and visual views under `src/visualization/`.
- **Local accounts** — sign-up requires an email, a password of at least 8 characters, a matching confirmation, and an explicit privacy-policy consent checkbox. Passwords are never stored: a 16-byte random salt and PBKDF2-HMAC-SHA256 (150,000 iterations, WebCrypto) produce a digest compared in constant time. Records live only in this browser's `localStorage`; the session survives reloads, and Sign out clears it. Older single-hash accounts are migrated on first successful sign-in. Where WebCrypto is unavailable (plain HTTP, e.g. a LAN IP), the code records and uses a weaker single-pass salted SHA-256 fallback — use HTTPS or localhost for real accounts.
- **Offline by design** — account records, workspaces, configuration, and history are local; no runtime network calls or analytics are present in `src/`. The repository does contain Firebase/Vercel deployment configuration and a `src/firebase-config.ts` placeholder module that the app does not import.
- **Seven themes** — Dark, Light, High Contrast, Cyber Green, Midnight Blue, Professional Gray, and Color Blind Friendly.
- **Keyboard-first UI** — command palette, onboarding wizard, status bar, privacy center, security audit, recovery center, and diagnostics center.

## Get started

Requires Node.js 20 (the version used in CI).

```bash
npm install     # or: npm ci to install exactly from package-lock.json
npm run dev
```

Open the local URL printed by Vite. You will be asked to create a local account and can then skip or complete the first-launch wizard.

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check project references and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run test` | Run Vitest in watch mode |
| `npm run test:run` | Run Vitest once (used in CI) |
| `npm run test:coverage` | Run Vitest once with coverage |
| `npm run lint` | Run ESLint over the repository |
| `npm run typecheck` | Run `tsc --noEmit` |

`./install.sh` detects `package.json` and runs `npm install` for you.

## Project structure

```text
src/
├── app/           # App shell, header, sidebar, command palette, wizard, login
├── core/
│   ├── crypto/    # cipher registry, Vigenère module
│   ├── engines/   # Caesar, enhanced Caesar, frequency analysis
│   ├── security/  # local auth, clipboard, integrity, audit, privacy helpers
│   ├── services/  # workspace, history, cache, search, files, plugins
│   └── types/     # shared TypeScript types
├── configuration/ # settings screen and shortcut defaults
├── dashboard/     # dashboard and educational disclaimer
├── workspace/     # encrypt/decrypt/brute-force/frequency UI
├── visualization/ # charts
├── privacy/       # privacy center page
├── security/      # security audit and recovery pages
├── diagnostics/   # diagnostics center
├── documentation/ # in-app help center
├── stores/, themes/
└── __tests__/     # Vitest tests
```

Shortcuts declared in the UI: `Ctrl+P` command palette, `Ctrl+E` encrypt, `Ctrl+D` decrypt, `Ctrl+B` brute force, `Ctrl+F` frequency analysis, `Ctrl+V` visualizations, `Ctrl+,` settings, and `F1` help.

## Privacy and safety

- The account gate is local-only: it is **not** encryption for saved workspaces, which are stored as JSON in `localStorage`. Do not put real secrets or sensitive plaintext into the workspace.
- `.env.example` contains Firebase placeholders only. Never commit real API keys or tokens.
- Clearing site data removes accounts, sessions, workspaces, and history. Export anything you want to keep first.
- This project is for learning and authorized CTF-style exercises, not for protecting confidential information.

## License and credits

MIT License. Copyright (c) 2024 CipherForge Pro Contributors. See [LICENSE](LICENSE) for the full text. No upstream fork or third-party attribution is recorded in this repository.

- Security policy: [SECURITY.md](SECURITY.md)
- Privacy policy: [PRIVACY_POLICY.md](PRIVACY_POLICY.md)
- Support: [SUPPORT.md](SUPPORT.md)
- Issues: <https://github.com/anya12forger12-max/cipherforge-pro/issues>

## Quick start — 1 or 2 commands

```bash
./setup.sh          # install dependencies
./setup.sh run      # start the project (when a run target exists)
```

`setup.sh` detects this repository's build system and installs the right toolchain
dependencies. Use `./setup.sh test` to run the available checks. If a project has no
standard run target, the script prints the correct command from the sections above.
