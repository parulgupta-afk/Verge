# How to apply this package onto your Verge repo

Merge these paths into the repo root (overwrite when present):

```
README.md
docs/REVIEWER_PASS.md
docs/screenshots/README.md
client/src/App.tsx
client/src/hooks/useSegments.ts
client/src/hooks/useRouting.ts
client/src/services/mediaVerification.ts
client/.env.example
server/package.json
server/.env.example
server/src/index.ts
server/src/mediaCheck.ts
server/src/mediaCheck.test.ts
server/src/confidence.ts
server/src/confidence.test.ts
server/src/openapi.ts
```

Then:

```bash
cd server && npm install && npm test
cd ../client && npm install && npm run dev
```

Capture screenshots into `docs/screenshots/` and set your Vercel URL in README.
