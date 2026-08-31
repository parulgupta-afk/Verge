import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { app } from '../index'

async function call(path: string, init?: RequestInit) {
  const res = await app.request(path, init)
  const body = await res.json().catch(() => null)
  return { status: res.status, body }
}

describe('GET /health', () => {
  it('reports Postgres RPC as the confidence source of truth', async () => {
    const { status, body } = await call('/health')
    expect(status).toBe(200)
    expect(body.confidenceSourceOfTruth).toBe('postgres:recalculate_segment_confidence')
  })
})

describe('POST /api/confidence/calculate (forgeable endpoint removed)', () => {
  it('returns 410 Gone and never computes a score from client-supplied counts', async () => {
    const { status, body } = await call('/api/confidence/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirms: 999, refutes: 0 }),
    })
    expect(status).toBe(410)
    expect(body.error).toMatch(/removed/i)
  })
})

describe('POST /api/confidence/recalculate', () => {
  it('rejects requests missing segment_id', async () => {
    const { status, body } = await call('/api/confidence/recalculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(status).toBe(400)
    expect(body.error).toMatch(/segment_id/)
  })
})

describe('POST /api/reports', () => {
  it('rejects a request with no segmentId or type', async () => {
    const { status, body } = await call('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(status).toBe(400)
    expect(body.error).toMatch(/segmentId/)
  })

  it('rejects an invalid report type', async () => {
    const { status, body } = await call('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ segmentId: 'abc-123', type: 'on-fire' }),
    })
    expect(status).toBe(400)
    expect(body.error).toMatch(/type must be one of/)
  })
})

describe('POST /api/segments/:segmentId/confirm', () => {
  it('rejects a vote with neither userId nor deviceId', async () => {
    const { status, body } = await call('/api/segments/seg-1/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(status).toBe(400)
    expect(body.error).toMatch(/userId or deviceId/)
  })
})

describe('GET /api/segments/nearby', () => {
  it('rejects missing/non-numeric lat or lng', async () => {
    const { status, body } = await call('/api/segments/nearby?lat=abc&lng=77.1')
    expect(status).toBe(400)
    expect(body.error).toMatch(/lat and lng/)
  })
})

describe('POST /api/routes/reroute', () => {
  const origin = { lat: 28.60, lng: 77.20 }
  const destination = { lat: 28.65, lng: 77.25 }

  const cleanRoute = {
    code: 'Ok',
    routes: [
      {
        geometry: { type: 'LineString', coordinates: [[77.20, 28.60], [77.25, 28.65]] },
        distance: 5000,
        duration: 600,
      },
    ],
  }

  const twoRoutesOneBlocked = {
    code: 'Ok',
    routes: [
      // route 0 passes straight through the blocked box below
      {
        geometry: { type: 'LineString', coordinates: [[77.20, 28.60], [77.21, 28.61], [77.25, 28.65]] },
        distance: 5000,
        duration: 600,
      },
      // route 1 detours around it
      {
        geometry: { type: 'LineString', coordinates: [[77.20, 28.60], [77.30, 28.62], [77.25, 28.65]] },
        distance: 6200,
        duration: 700,
      },
    ],
  }

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('rejects a request missing origin/destination', async () => {
    const { status, body } = await call('/api/routes/reroute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(status).toBe(400)
    expect(body.error).toMatch(/origin and destination/)
  })

  it('returns the only route when nothing is blocked', async () => {
    ;(fetch as any).mockResolvedValueOnce({ ok: true, json: async () => cleanRoute })

    const { status, body } = await call('/api/routes/reroute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, blockedSegments: [] }),
    })

    expect(status).toBe(200)
    expect(body.rerouted).toBe(false)
    expect(body.chosen.blockedBy).toBeNull()
  })

  it('picks the alternative route when the primary route hits a blocked segment', async () => {
    ;(fetch as any).mockResolvedValueOnce({ ok: true, json: async () => twoRoutesOneBlocked })

    const blockedSegments = [
      {
        name: 'Ring Road',
        geometry: { coordinates: [[77.205, 28.605], [77.215, 28.615]] },
      },
    ]

    const { status, body } = await call('/api/routes/reroute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, blockedSegments }),
    })

    expect(status).toBe(200)
    expect(body.rerouted).toBe(true)
    expect(body.chosen.blockedBy).toBeNull()
    expect(body.explanation).toMatch(/rerouted/i)
  })

  it('propagates a clear failure when the routing provider is unreachable', async () => {
    ;(fetch as any).mockRejectedValueOnce(new Error('network down'))

    const { status, body } = await call('/api/routes/reroute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination }),
    })

    expect(status).toBe(502)
    expect(body.error).toMatch(/routing provider/)
  })
})
