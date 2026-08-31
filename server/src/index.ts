/**
 * Verge Hono server
 * Confidence source of truth = Postgres RPC recalculate_segment_confidence
 */
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import 'dotenv/config'
import { checkMediaEvidence } from './mediaCheck.js'
import { openApiDocument } from './openapi.js'

const app = new Hono()

app.use('*', logger())
app.use(
  '*',
  cors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      process.env.CLIENT_ORIGIN || '',
    ].filter(Boolean),
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
)

app.get('/health', (c) =>
  c.json({
    status: 'ok',
    service: 'verge-server',
    region: 'india',
    confidenceSourceOfTruth: 'postgres:recalculate_segment_confidence',
    timestamp: new Date().toISOString(),
  })
)

app.get('/openapi.json', (c) => c.json(openApiDocument))

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
        'Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to proxy RPC. Client may call recalculate_segment_confidence directly.',
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
    return c.json({ ok: false, error: await res.text() }, 502)
  }
  return c.json({ ok: true, segment_id: segmentId, source: 'postgres_rpc' })
})

app.post('/api/confidence/calculate', (c) =>
  c.json(
    {
      error:
        'Removed. Do not POST confirms/refutes. Use Postgres recalculate_segment_confidence(segment_id).',
    },
    410
  )
)

app.post('/api/media/check', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const mediaUrl = body.media_url || body.mediaUrl
  const claimType = body.type || 'blocked'
  if (!mediaUrl) return c.json({ error: 'media_url required' }, 400)
  const result = await checkMediaEvidence({ mediaUrl, claimType })
  return c.json(result)
})

app.post('/api/routing/reroute', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  return c.json({ message: 'Reroute orchestration stub', received: body })
})

const port = Number(process.env.PORT) || 4000
console.log(`Verge server on :${port} — OpenAPI at /openapi.json`)

serve({ fetch: app.fetch, port })
