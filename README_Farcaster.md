
# MoodCaster — Farcaster Mini-App Ready (v2)

This package keeps your API & UI intact and adds:
- `sdk.actions.ready()` (splash close)
- Cast flow: `requestPermissions(['cast'])` → `composeCast({ text })` (handles `null` cancel) → haptic feedback when supported
- Wallet connect: `getEthereumProvider()` (EIP-1193)
- `isInMiniApp()` detection and an **Open in Warpcast** helper
- **Add to Farcaster** button (`sdk.actions.addMiniApp()`; works on production domain)
- Minimal `fc:miniapp` meta in `index.html`
- Placeholder `public/.well-known/farcaster.json` (do not overwrite your verified one in prod)

## Dev
```bash
npm install
npm run dev
```

## Deploy (Vercel)
- Ensure `public/.well-known/farcaster.json` uses your signed values.
- Verify at `https://<domain>/.well-known/farcaster.json`.

## Notes
- Casting and wallet provider require running inside a Farcaster Mini App container (e.g., Warpcast).
