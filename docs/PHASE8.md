# Phase 8 — Admin & visualization (complete package)

**Goal:** Ops-style snapshot of road confidence and a risk heatmap.

---

## What Phase 8 includes

### 1. Admin dashboard
- **Admin** button on the map
- Counts: total / blocked / partial / clear
- Average confidence, high-risk count, by city
- **Top risky segments** list (tap to open detail)

### 2. Risk heatmap mode
- Toggle in Admin panel
- Map line width scales with confidence (Phase 5 risk model)
- Works with existing status colors

### 3. Stats engine
- `lib/adminStats.ts` — pure functions over current segment array
- Works offline with seed data and with Supabase live data

---

## Demo checklist

1. Open **Admin** → read KPIs  
2. Toggle **Show risk heatmap** → lines thicken on high-confidence issues  
3. Tap a top risky row → segment detail sheet  

---

## Not yet

- Server-side historical heatmap from PostGIS  
- Multi-user live ops wall  
- Auth-gated admin role  

---

## Git tag

`phase-8-complete`
