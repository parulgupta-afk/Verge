# Verge (India)

Transparent road-status confidence layer → real-time rerouting.

**Focus:** Delhi-NCR + Bangalore.

---

## Features

| Area | Status |
|------|--------|
| MapLibre map (India) | ✅ |
| City switcher (Delhi / Bangalore) | ✅ |
| Segment status + confidence | ✅ |
| Confirm / Refute | ✅ |
| Search → OSRM route | ✅ |
| Blockage-aware explanation + Web Speech | ✅ |
| Start navigation screen | ✅ |
| Supabase-ready data layer | ✅ |
| Deploy guides (Vercel + Render) | ✅ `docs/DEPLOY.md` |

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

---

## Stack

- **client/** — Vite + React + TS + MapLibre → Vercel  
- **server/** — Hono + confidence engine → Render  
- **supabase/** — PostGIS schema + India seed SQL  

**Verge India** — confidence you can see.

---

## Phases

See **[PHASES.md](PHASES.md)** for the full roadmap and checklist.

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
