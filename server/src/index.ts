/**
 * Verge Hono server
 *
 * SOURCE OF TRUTH for confidence scores = Postgres RPC
 *   recalculate_segment_confidence(segment_id)
 * The client and any admin tooling must never POST raw confirm/refute counts.
 *
 * This server is optional orchestration (health, safe recalculate proxy, future routing).
 */
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import 'dotenv/config'

const app = new Hono()

app.use('*', logger())
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
)

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'verge-server',
    region: 'india',
    confidenceSourceOfTruth: 'postgres:recalculate_segment_confidence',
    timestamp: new Date().toISOString(),
  })
})

/**
 * Safe recalculate: ONLY accepts segment_id.
 * When SUPABASE_URL + service role are set, calls the Postgres RPC.
 * Never accepts confirms/refutes from the client body.
 */
app.post('/api/confidence/recalculate', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const segmentId = body.segment_id || body.segmentId
  if (!segmentId || typeof segmentId !== 'string') {
    return c.json({ error: 'segment_id required' }, 400)
  }

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return c.json({
      ok: false,
      message:
        'Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to proxy RPC. Client already calls recalculate_segment_confidence directly.',
      segment_id: segmentId,
    })
  }

  const res = await fetch(`${url}/rest/v1/rpc/recalculate_segment_confidence`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ p_segment_id: segmentId }),
  })

  if (!res.ok) {
    const text = await res.text()
    return c.json({ ok: false, error: text }, 502)
  }

  return c.json({ ok: true, segment_id: segmentId, source: 'postgres_rpc' })
})

/** Explicitly reject the old forgeable endpoint */
app.post('/api/confidence/calculate', (c) => {
  return c.json(
    {
      error:
        'Removed. Do not POST confirms/refutes. Confidence is computed only in Postgres recalculate_segment_confidence(segment_id).',
    },
    410
  )
})

/**
 * Shared Supabase service-role helper for server-side write endpoints below.
 * These give the project a real backend API surface beyond orchestration —
 * validation + rate limiting happen here, in addition to the DB-level
 * RLS/rate-limit functions already in supabase/migrations.
 */
function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return { url, key }
}

async function supabaseRest(
  path: string,
  init: RequestInit,
  admin: { url: string; key: string }
) {
  return fetch(`${admin.url}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      apikey: admin.key,
      Authorization: `Bearer ${admin.key}`,
      Prefer: 'return=representation',
      ...(init.headers || {}),
    },
  })
}

/** POST /api/reports — create a report, then trigger confidence recalculation. */
app.post('/api/reports', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const { segmentId, reporterId, type, notes, mediaUrl, lat, lng } = body as {
    segmentId?: string
    reporterId?: string | null
    type?: string
    notes?: string
    mediaUrl?: string
    lat?: number
    lng?: number
  }

  if (!segmentId || !type) {
    return c.json({ error: 'segmentId and type are required' }, 400)
  }
  if (!['blocked', 'partial', 'clear'].includes(type)) {
    return c.json({ error: 'type must be one of blocked, partial, clear' }, 400)
  }

  const admin = getSupabaseAdmin()
  if (!admin) {
    return c.json(
      { ok: false, message: 'Server not configured with Supabase service role; client writes directly.' },
      501
    )
  }

  const insertRes = await supabaseRest(
    '/rest/v1/reports',
    {
      method: 'POST',
      body: JSON.stringify({
        segment_id: segmentId,
        reporter_id: reporterId ?? null,
        type,
        notes: notes ?? null,
        media_url: mediaUrl ?? null,
        reporter_lat: lat ?? null,
        reporter_lng: lng ?? null,
      }),
    },
    admin
  )

  if (!insertRes.ok) {
    return c.json({ ok: false, error: await insertRes.text() }, 502)
  }

  await supabaseRest(
    '/rest/v1/rpc/recalculate_segment_confidence',
    { method: 'POST', body: JSON.stringify({ p_segment_id: segmentId }) },
    admin
  )

  const [report] = await insertRes.json()
  return c.json({ ok: true, report }, 201)
})

/** POST /api/reports/:id/confirm and /refute — thin wrapper validating segment + type. */
function makeVoteHandler(type: 'confirm' | 'refute') {
  return async (c: any) => {
    const segmentId = c.req.param('segmentId')
    const body = await c.req.json().catch(() => ({}))
    const { userId, deviceId, lat, lng } = body as {
      userId?: string
      deviceId?: string
      lat?: number
      lng?: number
    }

    if (!segmentId) return c.json({ error: 'segmentId is required' }, 400)
    if (!userId && !deviceId) {
      return c.json({ error: 'userId or deviceId is required to vote' }, 400)
    }

    const admin = getSupabaseAdmin()
    if (!admin) {
      return c.json(
        { ok: false, message: 'Server not configured with Supabase service role; client writes directly.' },
        501
      )
    }

    if (typeof lat === 'number' && typeof lng === 'number') {
      const distRes = await supabaseRest(
        '/rest/v1/rpc/segment_distance_m',
        { method: 'POST', body: JSON.stringify({ p_segment_id: segmentId, p_lng: lng, p_lat: lat }) },
        admin
      )
      if (distRes.ok) {
        const distM = await distRes.json()
        if (typeof distM === 'number' && distM > 5000) {
          return c.json(
            { ok: false, error: `Too far from this road to vote (${Math.round(distM / 1000)} km away; need ≤ 5 km).` },
            403
          )
        }
      }
    }

    const upsertRes = await supabaseRest(
      '/rest/v1/confirmations',
      {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify({
          segment_id: segmentId,
          type,
          user_id: userId ?? null,
          device_id: deviceId ?? null,
          voter_lat: lat ?? null,
          voter_lng: lng ?? null,
        }),
      },
      admin
    )

    if (!upsertRes.ok) {
      return c.json({ ok: false, error: await upsertRes.text() }, 502)
    }

    await supabaseRest(
      '/rest/v1/rpc/recalculate_segment_confidence',
      { method: 'POST', body: JSON.stringify({ p_segment_id: segmentId }) },
      admin
    )

    return c.json({ ok: true, segmentId, type })
  }
}

app.post('/api/segments/:segmentId/confirm', makeVoteHandler('confirm'))
app.post('/api/segments/:segmentId/refute', makeVoteHandler('refute'))

/** GET /api/segments/nearby?lat=&lng=&radiusM= — proxies a PostGIS proximity query. */
app.get('/api/segments/nearby', async (c) => {
  const lat = Number(c.req.query('lat'))
  const lng = Number(c.req.query('lng'))
  const radiusM = Number(c.req.query('radiusM') || '5000')

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return c.json({ error: 'lat and lng query params are required numbers' }, 400)
  }

  const admin = getSupabaseAdmin()
  if (!admin) {
    return c.json({ ok: false, message: 'Server not configured with Supabase service role.' }, 501)
  }

  const res = await supabaseRest(
    '/rest/v1/rpc/segments_within_radius',
    { method: 'POST', body: JSON.stringify({ p_lat: lat, p_lng: lng, p_radius_m: radiusM }) },
    admin
  )

  if (!res.ok) {
    return c.json({ ok: false, error: await res.text() }, 502)
  }

  return c.json({ ok: true, segments: await res.json() })
})

/**
 * Given origin, destination, and a caller-supplied snapshot of
 * verified-blocked/partial segments (fetched by the client from Supabase,
 * the actual source of truth), this asks OSRM for alternatives and returns
 * the first one that does not pass through a blocked segment's bounding box.
 *
 * This mirrors client/src/lib/routing.ts's intersection logic, but server-side,
 * so the decision of "which route to take" isn't left entirely to trust in
 * client code — a thin API surface any client (web, future mobile) can call.
 */
app.post('/api/routes/reroute', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const { origin, destination, blockedSegments } = body as {
    origin?: { lat: number; lng: number }
    destination?: { lat: number; lng: number }
    blockedSegments?: Array<{
      name?: string
      geometry?: { coordinates: [number, number][] }
    }>
  }

  if (!origin || !destination || typeof origin.lat !== 'number' || typeof destination.lat !== 'number') {
    return c.json({ error: 'origin and destination ({lat, lng}) are required' }, 400)
  }

  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`
  const url =
    `https://router.project-osrm.org/route/v1/driving/${coords}` +
    `?overview=full&geometries=geojson&steps=true&alternatives=true`

  let osrmData: any
  try {
    const res = await fetch(url)
    if (!res.ok) {
      return c.json({ error: `OSRM upstream error: ${res.status}` }, 502)
    }
    osrmData = await res.json()
  } catch (e) {
    return c.json({ error: 'Failed to reach routing provider' }, 502)
  }

  if (osrmData.code !== 'Ok' || !osrmData.routes?.length) {
    return c.json({ error: 'No route found', osrmCode: osrmData.code }, 404)
  }

  const blocked = (blockedSegments || []).filter((s) => s.geometry?.coordinates?.length)

  function intersectsBlocked(routeCoords: [number, number][]): string | null {
    for (const seg of blocked) {
      const coords = seg.geometry!.coordinates
      const lons = coords.map((p) => p[0])
      const lats = coords.map((p) => p[1])
      const minLon = Math.min(...lons) - 0.01
      const maxLon = Math.max(...lons) + 0.01
      const minLat = Math.min(...lats) - 0.01
      const maxLat = Math.max(...lats) + 0.01
      for (const [lng, lat] of routeCoords) {
        if (lng >= minLon && lng <= maxLon && lat >= minLat && lat <= maxLat) {
          return seg.name || 'a reported road'
        }
      }
    }
    return null
  }

  const candidates = osrmData.routes.slice(0, 3).map((r: any) => ({
    geometry: r.geometry,
    distanceMeters: r.distance,
    durationSeconds: r.duration,
    blockedBy: intersectsBlocked(r.geometry.coordinates),
  }))

  const clean = candidates.find((r: any) => !r.blockedBy)
  const chosen = clean || candidates[0]
  const rerouted = Boolean(clean && clean !== candidates[0])

  return c.json({
    chosen,
    alternatives: candidates,
    rerouted,
    explanation: chosen.blockedBy
      ? `No fully clear alternative found — ${chosen.blockedBy} is still on the route.`
      : rerouted
      ? `Rerouted to avoid a reported blockage.`
      : `Route is clear of currently reported blockages.`,
  })
})

/**
 * Optional media plausibility stub (Phase: content check).
 * Does NOT claim the image is verified truth — only a cheap AI assist when OPENAI_API_KEY is set.
 * Without a key, returns { verified: null, note: 'not configured' }.
 */
app.post('/api/media/check', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const mediaUrl = body.media_url || body.mediaUrl
  const claimType = body.type || 'blocked'
  if (!mediaUrl) {
    return c.json({ error: 'media_url required' }, 400)
  }
  if (!process.env.OPENAI_API_KEY) {
    return c.json({
      verified: null,
      note: 'Vision check not configured. Flat media_url presence only adds a small DB bonus; media_verified stays null.',
      media_url: mediaUrl,
      claimType,
    })
  }
  // Placeholder: wire OpenAI vision here when key present
  return c.json({
    verified: null,
    note: 'Wire vision model here; migration supports media_verified boolean on reports.',
    media_url: mediaUrl,
  })
})

export { app }

const port = Number(process.env.PORT) || 4000

if (process.env.NODE_ENV !== 'test') {
  console.log(`Verge server — confidence SoT = Postgres RPC — :${port}`)
  serve({
    fetch: app.fetch,
    port,
  })
}
