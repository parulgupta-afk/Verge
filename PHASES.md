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

## Phase 2 — Real-time & trust (partial / next)

**Goal:** Multi-user live updates + stronger trust

- [x] Supabase Realtime subscription code
- [ ] Live multi-client demo with your Supabase project
- [ ] Reporter trust weights persisted
- [ ] Auth (anonymous + email)

**Demo:** Two browsers; report on one, see update on the other.

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

## Phase 4 — Voice depth (planned)

- Full turn-by-turn narration from maneuver steps
- Voice-driven reporting (“road blocked here”)
- Mute / language preferences

---

## Phase 5 — Predictive & risk-aware routing (planned)

- Historical blockage patterns
- Custom cost: time + blockage_probability × penalty
- Multi-route AI trade-off summary

---

## Phase 6 — Civic / emergency / offline (planned)

- Official feed overlay
- Emergency priority near hospitals
- Cached last-known status snapshot

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
| `v0.1.0-india-mvp` | Current demoable MVP |
