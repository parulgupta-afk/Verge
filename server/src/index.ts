import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import 'dotenv/config'
import { calculateConfidence } from './confidence.js'

const app = new Hono()

app.use('*', logger())
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
)

// Health
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'verge-server',
    region: 'india',
    timestamp: new Date().toISOString(),
  })
})

// Confidence calculation (pure function)
app.post('/api/confidence/calculate', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const result = calculateConfidence({
    confirms: Number(body.confirms) || 0,
    refutes: Number(body.refutes) || 0,
    hoursSinceUpdate: Number(body.hoursSinceUpdate) || 0,
    reporterTrustWeight: Number(body.reporterTrustWeight) || 1,
    hasMedia: Boolean(body.hasMedia),
  })
  return c.json(result)
})

// Placeholder for full recalculate against Supabase
app.post('/api/confidence/recalculate', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  return c.json({
    message: 'Recalculate endpoint ready – connect Supabase next',
    received: body,
  })
})

// Routing orchestration stub (Phase 3)
app.post('/api/routing/reroute', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  return c.json({
    message: 'Reroute endpoint (Phase 3)',
    received: body,
  })
})

const port = Number(process.env.PORT) || 4000
console.log(`Verge server (India) starting on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port,
})
