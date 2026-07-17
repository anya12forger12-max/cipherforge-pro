# Support

## Getting Help

- **Documentation:** Check the in-app Help Center (F1)
- **Issues:** [GitHub Issues](https://github.com/your-org/cipherforge-pro/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-org/cipherforge-pro/discussions)

## Common Issues

### Application won't start
```bash
npm install
npm run dev
```

### Build fails
```bash
npm run typecheck
npm run lint
```
Fix any errors, then retry `npm run build`.

### Tests fail
```bash
npx vitest run
```
Check the output for failing test names and fix the underlying issue.

## System Requirements

- Node.js 18+
- npm 9+
- Modern browser (Chrome 90+, Firefox 88+, Safari 15+, Edge 90+)

## FAQ

**Q: Is my data sent anywhere?**
A: No. CipherForge Pro is 100% offline. Zero network requests.

**Q: Can I use this for real encryption?**
A: No. The Caesar Cipher is historical and NOT secure. This is an educational tool only.

**Q: Where is my data stored?**
A: In your browser's local storage. It never leaves your device.

**Q: Can I add custom ciphers?**
A: Yes. The plugin system (v1.0+) supports custom cipher modules.
