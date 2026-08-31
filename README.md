# Verge (India)

**A real-time road-condition intelligence and rerouting platform, built as an India-focused MVP.**

Not a general navigation app — a transparent, verified road-status confidence layer (Delhi-NCR + Bangalore) that feeds real-time rerouting. Where most map apps treat report verification as an internal black box, Verge makes the confidence score, the confirm/refute history, and the source of truth visible and auditable.

---

## Why this architecture is the interesting part

- **Postgres is the single source of truth for confidence.** `recalculate_segment_confidence()` (see `supabase/migrations/`) computes every segment's status from trust-weighted confirms/refutes, time decay, and media evidence — server-side, always. The old `/api/confidence/calculate` endpoint that accepted raw counts from the client has been **removed** (`410 Gone`) specifically because it let anyone forge a confidence score by POSTing fake numbers. Client state cannot influence confidence except by writing real votes, which the database re-scores itself.
- **Reporter trust is learned, not assumed.** `refresh_reporter_trust()` compares each user's past reports against how the segment's status actually played out, and adjusts a per-user `trust_weight` used in every future confidence calculation — a report from someone with a track record of accurate calls counts for more.
- **Anonymous auth, not free-for-all anonymity.** Supabase anonymous sign-in gives every device a stable `user_id`, enabling per-user trust weighting, a 5 km voter-proximity check, and rate limiting — without requiring signup.

---

## Features

| Area | Status |
|------|--------|
| MapLibre map (India) | ✅ |
| City switcher (Delhi / Bangalore) | ✅ |
| Segment status + trust-weighted confidence | ✅ |
| Confirm / Refute with proximity + rate limiting | ✅ |
| Search → OSRM route + alternatives | ✅ |
| Server-side reroute-around-blockage endpoint | ✅ |
| Blockage-aware explanation + Web Speech | ✅ |
| Start navigation screen | ✅ |
| Supabase/PostGIS backend | ✅ |
| Automated tests (Vitest) | ✅ |
| CI (GitHub Actions) | ✅ |
| Deploy guides (Vercel + Render) | ✅ `docs/DEPLOY.md` |
| Media content verification (vision check) | 🚧 stubbed — see `/api/media/check` |

---

## Backend API surface

The Hono server (`server/src/index.ts`) is more than orchestration — it owns validation, rate-limit checks, and the routing decision, while Postgres remains the source of truth for confidence itself.

| Endpoint | Purpose |
|---|---|
| `GET /health` | Liveness + which system is authoritative for confidence |
| `POST /api/reports` | Create a report, then trigger server-side confidence recalculation |
| `POST /api/segments/:id/confirm` | Confirm a segment (validates proximity + rate limit) |
| `POST /api/segments/:id/refute` | Refute a segment (validates proximity + rate limit) |
| `GET /api/segments/nearby` | PostGIS proximity query for segments near a point |
| `POST /api/routes/reroute` | Calls OSRM for alternatives, picks the first not intersecting a reported blockage |
| `POST /api/confidence/recalculate` | Safe proxy to the Postgres RPC — accepts only a `segment_id`, never raw counts |
| `POST /api/confidence/calculate` | **Removed (410)** — the old forgeable endpoint; kept only to fail loudly if called |
| `POST /api/media/check` | Stub for a future vision-model plausibility check on report photos |

The client can also talk to Supabase directly for reads/realtime (see `client/src/lib/segmentsApi.ts`) — the REST endpoints above exist so any client (including a future mobile app) has a documented, validated write path that doesn't depend on shipping a Supabase anon key with full table access.

---

## Testing

```bash
cd server && npm install && npm test
```

Covers: the pure confidence-calculation formula (decay, trust weighting, media bonus, clamping), request validation on every endpoint, and the reroute endpoint's blockage-avoidance logic (with OSRM mocked so tests don't need network access).

---

## Run locally

```bash
cd client && npm install && npm run dev   # http://localhost:3000
cd server && npm install && npm run dev   # http://localhost:4000
```

1. **Delhi | Bangalore** toggle (top-left)
2. **Search** a place (AIIMS, Bellandur, Airport…) → route
3. **Start navigation** when the blue route is shown
4. **Report** / confirm on a segment to change confidence

---

## Deploy

See **[docs/DEPLOY.md](docs/DEPLOY.md)** for Vercel (client) + Render (server) + Supabase.

CI runs on every push/PR to `main` — see `.github/workflows/ci.yml` (server tests + build, client build).

---

## Stack

- **client/** — Vite + React + TS + MapLibre → Vercel
- **server/** — Hono + validated write endpoints + reroute logic → Render
- **supabase/** — PostGIS schema, confidence engine, trust-integrity migrations, India seed SQL

**Verge India** — confidence you can see.

---

## Phases

See **[PHASES.md](PHASES.md)** for the full roadmap.

**Phase 2 package:** [docs/PHASE2.md](docs/PHASE2.md)

**Current tags:** `phase-1-foundation`, `phase-3-routing`, `v0.1.0-india-mvp`

## Git push (your machine)

```bash
# After unzipping
cd verge
git remote add origin https://github.com/YOUR_USERNAME/verge.git
git push -u origin main
git push origin --tags
```

Create an empty GitHub repo named `verge` first (no README), then run the commands above.
