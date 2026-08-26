# Verge India — Build Phases

Each phase is independently demoable.

---

## Phase 1 — Foundation ✅

**Goal:** Real map + confidence loop (India-first)

- [x] `client/` Vite + React + TypeScript
- [x] `server/` Hono + confidence engine
- [x] MapLibre GL map centered on India
- [x] PostGIS schema (`supabase/migrations/001_initial_schema.sql`)
- [x] Delhi + Bangalore seed segments
- [x] Confirm / Refute → visible confidence
- [x] Supabase client + data layer (optional keys)
- [x] Realtime subscribe helper

**Demo:** Open map → tap segment → confirm/refute → confidence updates.

---

## Phase 2 — Real-time & identity ✅

**Goal:** Multi-user readiness — Realtime path, device identity, vote dedupe

Full write-up: **[docs/PHASE2.md](docs/PHASE2.md)**

- [x] Supabase Realtime subscription
- [x] Live / Local data-source indicator on map
- [x] Stable `device_id` in localStorage
- [x] Migration `002_phase2_device_votes.sql`
- [x] Votes upsert with `device_id` (one vote per device per segment)
- [x] Official npm registry (`.npmrc` + fixed lockfile for Windows)
- [ ] Your Supabase project + Realtime enabled (ops step, not code)
- [ ] Reporter trust weights + Supabase Auth → Phase 2+ / later

**Demo:** Badge shows Live or Local; with Supabase keys, two clients sync via Realtime.

---

## Phase 3 — Routing + voice ✅ (MVP)

**Goal:** Route around verified risk; explain why

- [x] Public OSRM routing (no key for demo)
- [x] India places search (Delhi / Bangalore)
- [x] Route drawn on map
- [x] Blockage intersection check
- [x] Reroute banner + Web Speech explanation
- [x] Start navigation screen with ETA
- [x] City switcher (Delhi | Bangalore)
- [ ] Mapbox Directions exclude-zones (needs token)
- [ ] Debounced “only if ahead on route” trigger

**Demo:** Search “AIIMS” or “Bellandur” → route → spoken explanation if blocked segment intersects.

---

## Phase 4 — Voice depth ✅

Full write-up: **[docs/PHASE4.md](docs/PHASE4.md)**

- [x] Voice module (`lib/voice.ts`) with mute persistence
- [x] OSRM steps → spoken turn-by-turn on navigation screen
- [x] Reroute explanation spoken (respects mute)
- [x] en-IN voice preference when available
- [ ] Voice-driven reporting (“road blocked here”) — later
- [ ] Cloud TTS optional upgrade — later

---

## Phase 5 — Predictive & risk-aware routing ✅

Full write-up: **[docs/PHASE5.md](docs/PHASE5.md)**

- [x] Blockage probability from status + confidence
- [x] Route cost = travel_time + risk penalty
- [x] OSRM alternatives + rank by cost
- [x] Trade-off summary on map banner + voice
- [ ] Historical time-series model from Supabase
- [ ] LLM-generated long-form comparison

---

## Phase 6 — Civic / emergency / offline ✅

Full write-up: **[docs/PHASE6.md](docs/PHASE6.md)**

- [x] Official/civic notices panel (Delhi + Bangalore demo)
- [x] Emergency priority mode (stronger risk avoidance)
- [x] Offline segment snapshot + banner
- [ ] Live civic APIs
- [ ] Offline map tiles

---

## Phase 7 — Social (planned)

- Commute learning
- Convoy / shared ETA

---

## Phase 8 — Admin (planned)

- Heatmap
- Live ops dashboard

---

## Deployment

See `docs/DEPLOY.md` — Vercel (`client/`) + Render (`server/`) + Supabase.

---

## Git tags

| Tag | Meaning |
|-----|---------|
| `phase-1-foundation` | Map + confidence + schema |
| `phase-3-routing` | Search → route → speech |
| `phase-2-realtime` | Live badge + device identity |
| `phase-2-complete` | Full Phase 2 package |
| `v0.1.0-india-mvp` | India MVP |
| `v0.2.0-phase2` | Phase 2 partial |
| `v0.2.1-npm-fix` | npm lockfile fix |
