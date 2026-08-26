# Phase 2 — Complete Package

**Goal:** Multi-user readiness — Realtime path, stable device identity, vote dedupe, Windows-friendly npm.

This document is the single reference for everything that belongs to Phase 2.

---

## What Phase 2 includes

### 1. Live / Local indicator
- Map shows **● Live · Supabase** when `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` are set
- Otherwise **○ Local seed** (India seed data, fully offline-capable)

### 2. Device identity
- File: `client/src/lib/identity.ts`
- Stable `device_id` stored in `localStorage` (`verge_device_id`)
- Used so one browser ≈ one vote per road segment

### 3. Votes with `device_id`
- File: `client/src/lib/segmentsApi.ts` → `voteOnSegment()`
- Upserts into `confirmations` with `{ segment_id, type, device_id }`
- Falls back to plain insert if migration not applied yet

### 4. Database migration
- File: `supabase/migrations/002_phase2_device_votes.sql`
- Adds `confirmations.device_id`
- Unique index on `(segment_id, device_id)` where device_id is not null

### 5. Realtime subscription (from Phase 1, used in Phase 2)
- `subscribeToSegments()` in `segmentsApi.ts`
- App listens and merges updates into local state
- Requires Supabase Realtime enabled on `road_segments`

### 6. npm / Windows fix
- `client/.npmrc` → `registry=https://registry.npmjs.org/`
- `package-lock.json` resolved URLs point at official npm (no proxy IP)

---

## Files that are Phase 2

```
client/src/lib/identity.ts
client/src/lib/segmentsApi.ts      # vote + subscribe
client/src/lib/supabase.ts
client/src/App.tsx                 # Live badge + load/subscribe
client/.npmrc
client/package-lock.json           # fixed registry URLs
supabase/migrations/002_phase2_device_votes.sql
docs/PHASE2.md                     # this file
```

---

## How to enable full live mode

1. Create Supabase project (prefer Mumbai / Singapore)
2. Run SQL:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_phase2_device_votes.sql`
   - `supabase/seed_india_segments.sql`
3. Database → Replication → enable Realtime for `road_segments`
4. `client/.env.local`:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

5. Restart `npm run dev`
6. Badge should show **● Live · Supabase**
7. Open two browsers → confirm on one → other should update (Realtime)

---

## Still optional after Phase 2

| Item | Notes |
|------|--------|
| Supabase Auth (anonymous / email) | Replaces device_id with real `user_id` |
| Reporter trust weights | Needs auth + history |
| RLS policies | Harden tables for production |

These are Phase 2+ / Phase 4-auth follow-ups, not required for the Phase 2 demo.

---

## Demo checklist

- [ ] App runs with local seed (no env keys)
- [ ] Confirm / Refute updates confidence
- [ ] Badge shows Local or Live correctly
- [ ] With Supabase: votes write to `confirmations`
- [ ] With Realtime: second client sees segment updates
- [ ] `npm install` works on Windows (official registry)

---

## Git tags related to Phase 2

| Tag | Meaning |
|-----|---------|
| `phase-2-realtime` | Live badge + device identity |
| `v0.2.0-phase2` | Phase 2 partial |
| `v0.2.1-npm-fix` | Lockfile + device_id votes |
| `phase-2-complete` | This consolidated package |

---

## Push to GitHub

```bat
cd C:\Users\parul\Verge
git remote set-url origin https://github.com/parulgupta-afk/Verge.git
git add -A
git commit -m "Phase 2 complete package: identity, votes, realtime docs"
git tag -a phase-2-complete -m "Phase 2 full package"
git push origin main
git push origin --tags
```
