/**
 * Offline/unit-test helper ONLY.
 * Production confidence MUST use Postgres recalculate_segment_confidence().
 * Do not expose this via HTTP with client-supplied confirms/refutes.
 */

export interface ConfidenceInput {
  confirms: number
  refutes: number
  hoursSinceUpdate?: number
  reporterTrustWeight?: number
  hasMedia?: boolean
  mediaVerified?: boolean
}

export function calculateConfidence(input: ConfidenceInput) {
  const confirms = Math.max(0, input.confirms)
  const refutes = Math.max(0, input.refutes)
  const hours = input.hoursSinceUpdate ?? 0
  const trust = input.reporterTrustWeight ?? 1.0
  const mediaBonus = input.mediaVerified ? 0.08 : input.hasMedia ? 0.03 : 0
  const decayFactor = Math.max(0, 1 - hours / 24)
  const base = (confirms * trust) / (confirms + refutes + 1)
  let confidence = (base + mediaBonus) * decayFactor * 100
  confidence = Math.round(Math.min(100, Math.max(0, confidence)) * 10) / 10
  return { confidence, decayFactor, explanation: 'test-helper-only' }
}
