# Deploy Verge (India)

## Client → Vercel

1. Push the repo to GitHub.
2. [vercel.com](https://vercel.com) → New Project → import the repo.
3. **Root Directory:** `client`
4. Framework: Vite (auto-detected)
5. Environment variables (optional):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Deploy.

Custom domain optional. PWA can be added later with `vite-plugin-pwa`.

---

## Server → Render

1. [render.com](https://render.com) → New → Web Service
2. Connect the same repo
3. **Root Directory:** `server`
4. Build: `npm install && npm run build`
5. Start: `npm start`
6. Env:
   - `PORT` (Render sets this automatically)
   - Optional: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` when you wire server-side scoring

Health check path: `/health`

---

## Supabase

1. Create project (prefer Mumbai / Singapore region)
2. SQL → run `supabase/migrations/001_initial_schema.sql`
3. SQL → run `supabase/seed_india_segments.sql`
4. Database → Replication → enable Realtime for `road_segments`
5. Project Settings → API → copy URL + anon key into Vercel env

---

## Local production smoke test

```bash
cd client && npm run build && npm run preview
cd server && npm run build && npm start
```

---

## Notes

- OSRM public server is fine for demos; for production use Mapbox Directions or self-hosted OSRM and put the token only on the server.
- CORS on the Hono server already allows `localhost:3000`; add your Vercel domain when you go live.
