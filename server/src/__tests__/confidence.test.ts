import { describe, it, expect } from 'vitest'
import { calculateConfidence } from '../confidence'

describe('calculateConfidence', () => {
  it('returns 0 confidence with no confirms and no refutes', () => {
    const { confidence } = calculateConfidence({ confirms: 0, refutes: 0 })
    expect(confidence).toBe(0)
  })

  it('increases confidence as confirms rise relative to refutes', () => {
    const low = calculateConfidence({ confirms: 1, refutes: 1 })
    const high = calculateConfidence({ confirms: 10, refutes: 1 })
    expect(high.confidence).toBeGreaterThan(low.confidence)
  })

  it('decreases confidence as refutes rise relative to confirms', () => {
    const some = calculateConfidence({ confirms: 5, refutes: 0 })
    const disputed = calculateConfidence({ confirms: 5, refutes: 5 })
    expect(disputed.confidence).toBeLessThan(some.confidence)
  })

  it('decays confidence over time since last update', () => {
    const fresh = calculateConfidence({ confirms: 5, refutes: 0, hoursSinceUpdate: 0 })
    const stale = calculateConfidence({ confirms: 5, refutes: 0, hoursSinceUpdate: 20 })
    expect(stale.confidence).toBeLessThan(fresh.confidence)
  })

  it('fully decays to 0 confidence after 24+ hours with no new activity', () => {
    const { confidence } = calculateConfidence({ confirms: 5, refutes: 0, hoursSinceUpdate: 48 })
    expect(confidence).toBe(0)
  })

  it('gives verified media a bigger bonus than unverified media', () => {
    const none = calculateConfidence({ confirms: 3, refutes: 0 })
    const attached = calculateConfidence({ confirms: 3, refutes: 0, hasMedia: true })
    const verified = calculateConfidence({ confirms: 3, refutes: 0, hasMedia: true, mediaVerified: true })
    expect(attached.confidence).toBeGreaterThan(none.confidence)
    expect(verified.confidence).toBeGreaterThan(attached.confidence)
  })

  it('weighs higher-trust reporters more heavily', () => {
    const lowTrust = calculateConfidence({ confirms: 3, refutes: 0, reporterTrustWeight: 0.5 })
    const highTrust = calculateConfidence({ confirms: 3, refutes: 0, reporterTrustWeight: 2.0 })
    expect(highTrust.confidence).toBeGreaterThan(lowTrust.confidence)
  })

  it('never returns a value outside 0-100', () => {
    const clampedHigh = calculateConfidence({ confirms: 1000, refutes: 0, reporterTrustWeight: 2.5, hasMedia: true, mediaVerified: true })
    const clampedLow = calculateConfidence({ confirms: 0, refutes: 1000 })
    expect(clampedHigh.confidence).toBeLessThanOrEqual(100)
    expect(clampedLow.confidence).toBeGreaterThanOrEqual(0)
  })

  it('never returns a negative value even with malformed negative inputs', () => {
    const { confidence } = calculateConfidence({ confirms: -5, refutes: -5 })
    expect(confidence).toBeGreaterThanOrEqual(0)
  })
})
