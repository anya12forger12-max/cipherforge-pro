# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public GitHub issue
2. Email security@[project].dev with details
3. Include steps to reproduce if possible
4. Allow 48 hours for initial response

## Security Architecture

CipherForge Pro is designed with security-first principles:

- **Offline-First** — Zero network requests
- **No Telemetry** — No analytics, tracking, or data collection
- **Local Storage Only** — All data stays on your device
- **Input Validation** — All user inputs are sanitized
- **Error Handling** — Centralized with retry logic and audit trails
- **Resource Monitoring** — CPU, memory, and storage tracking
- **Clipboard Protection** — Auto-clear sensitive data from clipboard
- **Memory Security** — Secure buffer clearing
- **Audit Engine** — Comprehensive security audit capabilities

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes |

## Scope

This policy covers the CipherForge Pro application. It does not cover:

- Third-party dependencies (report upstream)
- Social engineering attacks
- Physical security
