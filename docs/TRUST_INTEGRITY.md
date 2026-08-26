# Trust & confidence integrity

## Source of truth

**Postgres only:** `recalculate_segment_confidence(segment_id)`

- Hono `/api/confidence/calculate` returns **410 Gone** (was forgeable).
- Hono `/api/confidence/recalculate` accepts **only** `segment_id` and optionally proxies the RPC with service role.

## Identity

1. `supabase.auth.signInAnonymously()` → stable `auth.users` id  
2. `ensure_app_user(auth_uid)` → row in `public.users` with `trust_weight`  
3. Votes/reports set `user_id` / `reporter_id`  

`device_id` remains a fallback for offline / pre-migration clients.

## Trust weight

- Starts at `1.0`
- `refresh_reporter_trust()` adjusts using whether recent report types still match segment status
- Weighted sum in confidence: `SUM(trust_weight)` for confirms vs refutes

## Report-type-aware status

Status prefers the **latest report type from higher-trust reporters**, not a blind “confidence ≥ 70 ⇒ blocked”.

## Vote integrity

- Unique vote per `(segment_id, user_id)` (or device if no user)
- **5 km** proximity via `segment_distance_m` when GPS is provided
- Rate limits via `check_rate_limit`

## Media

| Signal | Effect |
|--------|--------|
| `media_url` present | +0.03 (file attached only) |
| `media_verified = true` | +0.08 |
| Vision API | Optional via `/api/media/check` when `OPENAI_API_KEY` set; otherwise `verified: null` |

## Apply migrations

```text
001_initial_schema.sql
002_phase2_device_votes.sql
003_trust_integrity.sql
```

Enable **Anonymous sign-ins** in Supabase Auth settings.
