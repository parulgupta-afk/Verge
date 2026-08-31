# Finish the product gaps (honest checklist)

These five items are what was “not product done.”  
**You only need 1 + 3 for a strong portfolio demo.** 2, 4, 5 can stay documented as limits.

---

## 1. Supabase `road_segments` 404 — **should do**

**Cause:** Project URL is set, but tables were never created (migrations not run).

### Fix (15–20 min)

1. Open [Supabase](https://supabase.com) → your project (`zdqfmazsodryvjdmzlfi` or new).
2. **SQL Editor** → New query.
3. Run in order (or paste `supabase/combined_setup.sql` if present):

```text
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_phase2_device_votes.sql
supabase/migrations/003_trust_integrity.sql
supabase/migrations/004_trust_scored_once.sql
supabase/migrations/005_segments_within_radius.sql
supabase/seed_india_segments.sql
```

4. **Database → Publications / Realtime** → enable `road_segments` (and confirmations if listed).
5. **Authentication → Providers** → enable **Anonymous** sign-in.
6. **Settings → API** → copy:
   - Project URL → `VITE_SUPABASE_URL`
   - `anon` `public` key → `VITE_SUPABASE_ANON_KEY`
7. Put them in `client/.env.local` (local) and Vercel env (deploy).
8. Restart `npm run dev` → badge should move toward **Live · Cloud** (or at least stop 404).

**Until this is done:** app correctly falls back to **Local Demo Mode** + India seed. That is OK for offline demos.

---

## 2. Photo AI verify — **optional (document, don’t fake)**

- Photos can upload / attach as **evidence**.
- **AI verify** only if server has `OPENAI_API_KEY` or `GEMINI_API_KEY`.
- Without keys: `verified: null` — **correct**.

**Do not** claim “AI verifies every photo” in README or interviews unless keys + storage are live.

---

## 3. Public deploy + screenshots — **should do**

### Vercel (client)

1. Import GitHub repo → Root Directory = `client`
2. Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (after step 1)
3. Deploy → paste URL into README: `Live demo: https://…`

### Screenshots (3 is enough)

With `npm run dev` or the live URL:

1. Map + Delhi + confidence segments  
2. Directions + route confidence panel  
3. Segment detail (confirm/refute / timeline)

Save under `docs/screenshots/` and link in README.

---

## 4. Civic / Social / Admin — **demo is enough for portfolio**

| Panel | Reality |
|-------|---------|
| Civic | Curated **demo** notices — label as demo |
| Social | Local saved commutes + share code |
| Admin | Stats from current segments |

**Real** city APIs are a later phase, not required to “finish” V1.

---

## 5. Nominatim place search — **fine for V1**

- Free, no key, India-biased, debounced.
- Production later: self-host Photon/Nominatim or a paid geocoder.

No action required for demo.

---

## Definition of “product done” for *this* project

| Bar | Done when |
|-----|-----------|
| **Portfolio V1** | Map + Directions + confidence + report work; README honest; optional deploy |
| **Live community V1** | Migrations + seed + anonymous auth + Realtime + deploy |
| **City product** | Real civic feeds + moderated reports + scale |

**Recommendation:** Complete **#1** and **#3**. Treat **#2 #4 #5** as known, documented limits — not blockers.
