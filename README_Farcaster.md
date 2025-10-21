
# MoodCaster — Farcaster Mini-App Ready

Keeps your API & UI as-is and adds:
- `sdk.actions.ready()` (splash close)
- Cast flow: `requestPermissions(['cast'])` → `composeCast({ text })` with fallbacks
- Wallet connect: `getEthereumProvider()` (EIP-1193)
- `fc:miniapp` meta in `index.html`
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
