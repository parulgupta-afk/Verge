# Verge (India)

Transparent **road-status confidence** layer → risk-aware routing.

**Focus:** Delhi-NCR + Bangalore · **Stack free of Mapbox** (MapLibre + OpenFreeMap + OSRM)

---

## Features

| Area | Status |
|------|--------|
| MapLibre map (India) + confidence opacity | ✅ |
| Confirm / refute + trust-weighted RPC | ✅ code (needs Supabase) |
| From → To directions + GPS origin | ✅ |
| Risk-aware alternatives + voice | ✅ |
| Audit timeline (“why this confidence?”) | ✅ |
| Admin KPIs + heatmap | ✅ |
| Photo evidence | ⚠️ **Stored**; AI verify **optional** (see below) |
| Live multi-user | ✅ code · **your** Supabase project |

---

## Photo / media evidence (honest status)

- Users can attach a photo when reporting.
- **Without** `OPENAI_API_KEY` or `GEMINI_API_KEY` on the server, `/api/media/check` returns `verified: null` — the photo is **user evidence only**, not AI-validated. This is intentional and documented, not a silent fake.
- **With** a key, the server attempts a vision-model judgment and can support setting `media_verified` later.
- Browser `blob:` URLs cannot be checked server-side until the file is uploaded to hosted storage.

---

## Run locally

```bash
cd client && npm install && npm run dev   # http://localhost:3000
cd server && npm install && npm run dev   # http://localhost:4000
cd server && npm test                     # unit tests (confidence + media stub)
```

OpenAPI: `GET http://localhost:4000/openapi.json`

Optional client env: `VITE_API_URL=http://localhost:4000` for media check calls.

---

## Deploy (live demo)

See **[docs/DEPLOY.md](docs/DEPLOY.md)**.

| Service | Root | Notes |
|---------|------|--------|
| **Vercel** | `client/` | Set `VITE_SUPABASE_*` |
| **Render** | `server/` | Optional; set keys for media/RPC proxy |
| **Supabase** | migrations `001`–`004` | Enable Anonymous auth + Realtime |

After deploy, put the public URL here:

```text
Live demo: (add your Vercel URL)
```

### Screenshots / demo GIF

Add PNGs or a short GIF under `docs/screenshots/` and link them here after you capture from a running build:

- `docs/screenshots/map-delhi.png`
- `docs/screenshots/route-risk.png`
- `docs/screenshots/segment-timeline.png`

*(Screenshots must be captured from your machine; they are not generated in CI.)*

---

## Architecture notes

- **Confidence source of truth:** Postgres `recalculate_segment_confidence` — not client POSTed counts.
- **Client structure:** `hooks/useSegments`, `hooks/useRouting`, `services/mediaVerification` keep `App.tsx` thinner.
- **API docs:** `server/src/openapi.ts` → `/openapi.json`

---

## Docs

| Doc | Topic |
|-----|--------|
| [PHASES.md](PHASES.md) | Build phases |
| [docs/TRUST_INTEGRITY.md](docs/TRUST_INTEGRITY.md) | Trust / votes |
| [docs/EXPLAINABILITY.md](docs/EXPLAINABILITY.md) | Timeline + map opacity |
| [docs/FREE_STACK.md](docs/FREE_STACK.md) | No Mapbox |
| [docs/DEPLOY.md](docs/DEPLOY.md) | Vercel + Render |
| [docs/REVIEWER_PASS.md](docs/REVIEWER_PASS.md) | This pass |

**Verge India** — confidence you can see.
