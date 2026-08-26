/**
 * Verge MVP Confidence Engine
 * Simple, transparent, tunable.
 */

export interface ConfidenceInput {
  confirms: number;
  refutes: number;
  hoursSinceUpdate?: number;
  reporterTrustWeight?: number; // default 1.0
  hasMedia?: boolean;
}

export interface ConfidenceResult {
  confidence: number;       // 0–100
  status: 'blocked' | 'partial' | 'clear' | 'unknown';
  decayFactor: number;
  explanation: string;
}

/**
 * MVP formula:
 * base = confirms / (confirms + refutes + 1)
 * decay = max(0, 1 - hours / 24)
 * media_bonus = 0.05 if photo/video present
 * confidence = clamp(0, 100, (base + media_bonus) * decay * 100)
 */
export function calculateConfidence(input: ConfidenceInput): ConfidenceResult {
  const confirms = Math.max(0, input.confirms);
  const refutes = Math.max(0, input.refutes);
  const hours = input.hoursSinceUpdate ?? 0;
  const trust = input.reporterTrustWeight ?? 1.0;
  const mediaBonus = input.hasMedia ? 0.05 : 0;

  const decayFactor = Math.max(0, 1 - hours / 24);
  const base = (confirms * trust) / (confirms + refutes + 1);
  let confidence = (base + mediaBonus) * decayFactor * 100;
  confidence = Math.round(Math.min(100, Math.max(0, confidence)) * 10) / 10;

  let status: ConfidenceResult['status'] = 'unknown';
  if (confirms === 0 && refutes === 0) {
    status = 'unknown';
  } else if (confidence >= 70 && confirms > refutes) {
    status = 'blocked';
  } else if (confidence >= 40) {
    status = 'partial';
  } else {
    status = 'clear';
  }

  const explanation =
    `confirms=${confirms}, refutes=${refutes}, ` +
    `decay=${decayFactor.toFixed(2)}, media=${input.hasMedia ? 'yes' : 'no'} → ${confidence}%`;

  return { confidence, status, decayFactor, explanation };
}
