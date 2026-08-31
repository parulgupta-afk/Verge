import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { calculateConfidence } from './confidence.js'

describe('calculateConfidence (unit-test helper only)', () => {
  it('returns higher score with more confirms', () => {
    const low = calculateConfidence({ confirms: 1, refutes: 0 })
    const high = calculateConfidence({ confirms: 10, refutes: 0 })
    assert.ok(high.confidence >= low.confidence)
  })

  it('penalizes refutes', () => {
    const a = calculateConfidence({ confirms: 5, refutes: 0 })
    const b = calculateConfidence({ confirms: 5, refutes: 5 })
    assert.ok(a.confidence > b.confidence)
  })

  it('applies decay over hours', () => {
    const fresh = calculateConfidence({
      confirms: 5,
      refutes: 0,
      hoursSinceUpdate: 0,
    })
    const stale = calculateConfidence({
      confirms: 5,
      refutes: 0,
      hoursSinceUpdate: 20,
    })
    assert.ok(fresh.confidence >= stale.confidence)
  })

  it('clamps between 0 and 100', () => {
    const r = calculateConfidence({ confirms: 100, refutes: 0, hasMedia: true })
    assert.ok(r.confidence >= 0 && r.confidence <= 100)
  })

  it('mediaVerified boosts more than hasMedia alone', () => {
    const plain = calculateConfidence({
      confirms: 3,
      refutes: 1,
      hasMedia: true,
      mediaVerified: false,
    })
    const verified = calculateConfidence({
      confirms: 3,
      refutes: 1,
      hasMedia: true,
      mediaVerified: true,
    })
    assert.ok(verified.confidence >= plain.confidence)
  })
})
