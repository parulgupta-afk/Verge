# Verge — System Design Document

**Version:** 1.0  
**Aligned with:** PRD v2  
**Last updated:** 2026-08-25

---

## 1. Positioning Recap

Verge is a **transparent road-status confidence layer** that feeds real-time routing decisions.  
It does **not** compete with Google Maps / Waze on general navigation or live traffic congestion.

**Core question answered:**  
> “Is this specific road segment actually passable right now, how confident are we, and what’s the best route given that?”

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────┐
│           Client (`client/` (Vite + React))     │
│  • MapLibre GL JS map               │
│  • Report / Confirm / Refute UI     │
│  • Confidence display               │
│  • Web Speech API (voice)           │
│  • Geolocation watch                │
│  • Zustand + TanStack Query         │
└──────────────┬──────────────────────┘
               │ HTTPS / Realtime
               ▼
┌─────────────────────────────────────┐
│        Backend Services (Render)    │
│  • Confidence scoring engine        │
│  • Routing orchestration (V1+)      │
│  • AI proxy (reroute explanation)   │
│  • Health + basic metrics           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│           Supabase                  │
│  • Postgres + PostGIS               │
│  • Realtime (Postgres changes)      │
│  • Auth                             │
│  • Storage (photos / short videos)  │
└─────────────────────────────────────┘
               │
               ▼
     External: Mapbox Directions / OSRM
```

### Deployment Targets
- **Frontend** → Vercel
- **Backend services** → Render
- **Database / Realtime / Auth / Storage** → Supabase

---

## 3. Core Data Model (Phase 1 / MVP)

### `users`
- `id` (uuid, PK)
- `trust_weight` (float, default 1.0)
- `display_name`
- `created_at`

### `road_segments`
- `id` (uuid / text, PK)
- `name`, `road_code`
- `geometry` (PostGIS `geography(LineString, 4326)`)
- `status` (`blocked` | `partial` | `clear` | `unknown`)
- `confidence` (0–100)
- `confirms` (int)
- `refutes` (int)
- `last_updated` (timestamptz)
- `metadata` (jsonb)

### `reports`
- `id` (uuid, PK)
- `segment_id` (FK)
- `reporter_id` (FK → users)
- `type` (`blocked` | `partial` | `clear`)
- `media_url` (nullable)
- `notes` (text, nullable)
- `created_at`

### `confirmations`
- `id` (uuid, PK)
- `segment_id` or `report_id`
- `user_id`
- `type` (`confirm` | `refute`)
- `created_at`

**Confidence** is stored on the segment and recalculated on every relevant write (simple weighted formula + time decay in MVP; richer signals later).

---

## 4. Key Flows

### 4.1 Report → Confidence → Realtime
1. User selects segment → chooses Blocked / Partial / Clear → optional photo/video → submit.
2. Row inserted into `reports`.
3. Confidence engine recalculates score for the segment (confirms, refutes, reporter trust, recency, media presence).
4. `road_segments` row updated.
5. Supabase Realtime pushes change to all clients subscribed to the relevant channel (viewport or route corridor).

### 4.2 Confirm / Refute
1. User taps Confirm or Refute on a segment.
2. `confirmations` row created.
3. Confidence recalculated and pushed live.

### 4.3 Live Reroute (MVP)
1. User has an active route.
2. A high-confidence blockage appears on a segment that intersects the route corridor.
3. Client (or backend) detects relevance → calls routing API with exclude list.
4. New route returned.
5. AI generates short explanation → shown in UI + spoken via Web Speech API.

---

## 5. Routing Progression (from PRD)

- **V1:** External API (Mapbox Directions or OSRM) + best-effort exclude of verified-blocked segments. Debounced trigger.
- **V2:** Own PostGIS road graph + custom edge weights.
- **V3:** Risk-aware cost function:  
  `cost = travel_time + traffic_penalty + (blockage_probability × penalty) + historical_risk`

Early spike required on exclude-zone behavior before architecture is locked.

---

## 6. Confidence Scoring (MVP version)

Simple starting formula (tunable):

```
base = (confirms * reporter_weight) / (confirms + refutes + 1)
decay = max(0, 1 - hours_since_update / decay_hours)
media_bonus = 0.05 if media present else 0
confidence = clamp(0, 100, (base + media_bonus) * decay * 100)
```

Threshold for “verified blocked” is configurable (e.g. ≥ 75–80%).

Later versions add reporter reputation history, density, and light AI assist.

---

## 7. Real-time Strategy

- Clients subscribe to channels scoped by:
  - Current map viewport bounding box, or
  - Active route corridor (buffered polyline)
- Avoid global broadcasts.
- Optimistic UI updates on the reporting client; authoritative score comes from backend/DB.

---

## 8. Voice Strategy

- **MVP:** Web Speech API for the single high-value moment — live reroute explanation.
- Always show the same text on screen (voice is enhancement).
- Workarounds required: chunk long text, handle iOS user-gesture requirement, prefer local voices when possible.
- Full turn-by-turn narration and voice-driven reporting move to later phases.
- Cloud TTS can be added as optional premium/fallback later.

---

## 9. Security & Safety Notes

- Lightweight auth (Supabase) preferred over pure anonymous for trust weighting.
- Video capture gated to near-zero device speed (safety).
- Media auto-expires with report decay.
- Basic content moderation on uploads (Phase 2+).
- API keys never exposed on client; AI and routing orchestration go through backend.

---

## 10. Observability (lightweight for MVP)

- Backend health endpoint
- Structured logs for scoring decisions and reroute triggers
- Simple metrics: reports/hour, average confidence, reroute count

---

## 11. Open Technical Risks (must be spiked early)

1. Road-segment snapping (user click → correct linestring)
2. Mapbox/OSRM exclude geometry support
3. Realtime fan-out performance under many concurrent viewers
4. Confidence threshold & decay tuning

---

## 12. Phase Mapping

| Phase | Focus                              | Demoable outcome                          |
|-------|------------------------------------|-------------------------------------------|
| MVP   | Map + Report + Confidence + Realtime + V1 Reroute + 1 AI explanation | Complete vertical slice |
| 2     | Trust depth, media moderation      | Stronger verification                     |
| 3     | Custom PostGIS graph (V2 routing)  | Own routing intelligence                  |
| 4     | Full voice navigation              | Hands-free experience                     |
| 5     | Predictive + risk-aware (V3)       | Smarter routing                           |
| 6–8   | Civic, social, admin, offline      | Full product                              |

This design keeps the core verification → confidence → routing loop as the technical and product center of gravity.

## Repository Layout

- `client/` — Frontend (Vite + React + TypeScript) → deploy to Vercel
- `server/` — Backend services (Hono + TypeScript) → deploy to Render
- `docs/` — System Design and UI/UX Spec
