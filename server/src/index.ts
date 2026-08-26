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

app.post('/api/routing/reroute', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  return c.json({ message: 'Reroute orchestration stub', received: body })
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

const port = Number(process.env.PORT) || 4000
console.log(`Verge server — confidence SoT = Postgres RPC — :${port}`)

serve({
  fetch: app.fetch,
  port,
})
