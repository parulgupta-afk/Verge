# Reviewer pass — media, deploy, structure, API, tests

## Media / AI
- `server/src/mediaCheck.ts` — real path when OPENAI_API_KEY or GEMINI_API_KEY set; otherwise honest `verified: null`
- Client `services/mediaVerification.ts` + report flow logs aspirational status
- README states photo evidence is not AI-verified by default

## Deploy
- README deploy table + placeholder for live URL
- `docs/DEPLOY.md` remains the step-by-step guide
- Screenshots folder: `docs/screenshots/` (you add PNGs/GIF)

## App.tsx separation
- `hooks/useSegments.ts` — load, realtime, offline, vote/report
- `hooks/useRouting.ts` — OSRM, risk rank, speech
- `services/mediaVerification.ts` — media API client

## API documentation
- `GET /openapi.json` from `server/src/openapi.ts`

## Tests
```bash
cd server && npm test
```
Uses Node’s built-in test runner via `tsx --test` (8 tests: confidence + media stub).
