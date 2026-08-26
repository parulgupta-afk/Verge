# Verge — UI/UX Specification

**Version:** 1.0  
**Aligned with:** PRD v2 + existing prototype components  
**Last updated:** 2026-08-25

---

## 1. Design Principles

1. **Map is the hero** — 80%+ of the primary screen is the live map.
2. **Confidence is always visible and honest** — never hide the score or the confirm/refute counts.
3. **Glanceable status** — a driver should understand road state in < 1 second.
4. **Minimal chrome** — navigation-app feel, not dashboard feel.
5. **Mobile-first / PWA** — works well on phone while driving (large targets, high contrast) and on desktop.
6. **Progressive disclosure** — advanced settings and history are secondary.
7. **Voice is an enhancement** — every spoken message also appears as text.

---

## 2. Color & Status Language

| Status     | Primary Color     | Meaning                          | Map treatment                  |
|------------|-------------------|----------------------------------|--------------------------------|
| Blocked    | Strong Red        | High-confidence impassable       | Solid red segment + badge      |
| Partial    | Amber / Orange    | Reduced capacity / caution       | Orange segment                 |
| Clear      | Green             | Verified passable                | Green segment                  |
| Unknown    | Neutral Gray      | No recent reliable data          | Thin gray or dashed            |
| Active Route | Blue            | User’s current path              | Thick blue line                |

Confidence is shown both as:
- Percentage (e.g. `94%`)
- Supporting counts (`12 confirms · 1 refute`)
- Recency (`updated 3 min ago`)

High confidence can slightly increase segment opacity or thickness; low confidence can reduce it.

---

## 3. Screen Inventory (mapped to existing components)

| Screen / State              | Component                     | Purpose |
|----------------------------|-------------------------------|---------|
| Welcome / Onboarding       | `WelcomeScreen`               | First-run explanation of the confidence layer |
| Main Map                   | `InteractiveMap` + `NavigationHeader` + `BottomNavBar` | Live road status |
| Segment Detail             | `SegmentDetailSheet`          | Status, confidence, Confirm/Refute, Report Update |
| Report Flow                | `ReportFlowModal`             | Blocked / Partial / Clear + optional media + notes |
| Active Navigation          | `ActiveNavigationScreen`      | Turn guidance + live reroute banner + explanation |
| Search                     | `SearchOverlay`               | Destination / place search |
| Reports History            | `ReportsHistoryScreen`        | User’s past reports |
| Traffic / Display Settings | `TrafficSettingsScreen`       | Confidence threshold, visual style, notification radius |
| Offline Maps               | `OfflineMapsScreen`           | Cached region management (V2+) |
| Leaderboard / Guardians    | `LeaderboardScreen`           | Trust / contribution ranking (V2+) |
| Status Update Toast/Modal  | `StatusUpdateModal`           | Live “road updated nearby” feedback |

---

## 4. Key Interaction Flows

### 4.1 Viewing Status
- Open app → map centered on user (or last location).
- Segments colored by current status + confidence.
- Tap any segment → bottom sheet opens with full confidence breakdown.
- Realtime updates cause a subtle pulse or toast when a nearby segment changes.

### 4.2 Reporting
1. Tap floating “Report” button **or** long-press / tap segment → “Report Update”.
2. Choose: **Completely Blocked** / **Partially Blocked** / **Clear**.
3. Optional: add photo or short video (video only when device speed ≈ 0).
4. Optional short note.
5. Submit → optimistic UI update + confidence recalculation.
6. Sheet shows new score immediately.

### 4.3 Confirm / Refute
- Inside Segment Detail sheet: large **Confirm** and **Refute** buttons.
- After action, counts and confidence update live.
- Prevent duplicate votes from same user (backend enforced).

### 4.4 Active Navigation + Reroute
- User enters destination → route drawn.
- If a high-confidence blockage appears on the route:
  - Banner: “Rerouting…”
  - Map animates to new route.
  - Text + spoken explanation appears (AI-generated).
  - ETA delta shown clearly (“+3 min”).

### 4.5 Settings
- Confidence threshold slider (only show segments above X%).
- Visual style (standard / high-contrast / satellite).
- Notification radius.
- Toggle community reports, historical trends, etc.

---

## 5. Component-Level Notes

### InteractiveMap
- Full-screen MapLibre GL instance.
- Custom layer for road segments (LineString) colored by status.
- User location puck with heading.
- Route overlay when navigating.
- Tap handler → opens SegmentDetailSheet.
- Realtime subscription updates segment properties without full re-render when possible.

### SegmentDetailSheet
- Drag-to-dismiss bottom sheet.
- Header: road name + code + distance.
- Large status pill + confidence percentage.
- Confirm / Refute counts and “updated X ago”.
- Primary actions: Confirm, Refute, Report Update.
- Secondary: view media, see report history for this segment.

### ReportFlowModal
- Clear three-choice status selector (large touch targets).
- Media capture area with safety note for video.
- Optional notes field.
- Submit button disabled until status chosen.
- Loading / success states.

### ActiveNavigationScreen
- Persistent top instruction card.
- Map with route + upcoming blockage indicators.
- Reroute explanation card (text that matches speech).
- End Navigation control.
- Optional mute voice toggle.

### BottomNavBar
- Map (home)
- Reports / History
- Search
- Settings / Profile

Keep it to 4–5 items maximum.

---

## 6. Typography & Spacing

- System font stack or Inter / Geist for maximum clarity.
- Large, bold status numbers (confidence %).
- High contrast text on map overlays (white/black with strong shadow or background pill).
- Comfortable touch targets ≥ 44×44 pt.
- Consistent 8-pt spacing grid.

---

## 7. Dark Mode & Accessibility

- Full dark mode support from day one (critical for night driving).
- Status colors must remain distinguishable in both themes (use patterns or icons in addition to color where needed).
- Voice + visible text for every critical message.
- Respect `prefers-reduced-motion`.
- Sufficient color contrast (WCAG AA minimum).

---

## 8. Micro-interactions

- Segment highlight + soft pulse when newly updated via Realtime.
- Confidence number can animate (count-up) when it changes significantly.
- Subtle haptic (where available) on successful report / confirm.
- Toast or non-blocking banner: “Road status updated nearby”.
- Loading skeletons only for slower network actions; map itself should feel instant.

---

## 9. Empty & Error States

- No segments in view → gentle prompt to zoom out or enable location.
- Location permission denied → clear explanation + settings deep link.
- Offline → show last known snapshot + “You’re offline — status may be outdated”.
- Scoring / realtime failure → graceful degradation (show last known confidence, allow reporting that queues).

---

## 10. Future UI Hooks (do not build yet)

- Road Guardian badge on high-trust users.
- Official-source vs community visual distinction.
- Historical heatmap toggle.
- Convoy / shared route indicators.
- Predictive “likely blockage ahead” soft warning.

These stay out of the MVP visual surface so the core confidence loop remains clear.

---

## 11. Prototype Alignment

The current codebase already contains most of the screen shells and interaction patterns described above (`InteractiveMap`, `SegmentDetailSheet`, `ReportFlowModal`, `ActiveNavigationScreen`, etc.).  

This specification formalizes the design intent so that as we replace mock data with real Supabase + PostGIS + confidence engine, the UI remains consistent and focused on the product differentiator: **visible, trustworthy confidence**.
