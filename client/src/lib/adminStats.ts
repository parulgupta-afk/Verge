/**
 * Phase 8 — Admin metrics from current segment set
 */

import type { RoadSegment } from '../types';
import { segmentBlockageProbability } from './risk';

export interface AdminStats {
  total: number;
  blocked: number;
  partial: number;
  clear: number;
  unknown: number;
  avgConfidence: number;
  highRisk: number; // probability >= 0.5
  byCity: Record<string, number>;
  topRisky: Array<{ name: string; city: string; status: string; confidence: number; risk: number }>;
}

export function computeAdminStats(segments: RoadSegment[]): AdminStats {
  const byCity: Record<string, number> = {};
  let confSum = 0;
  let highRisk = 0;
  const risky: AdminStats['topRisky'] = [];

  let blocked = 0,
    partial = 0,
    clear = 0,
    unknown = 0;

  for (const s of segments) {
    const city = s.city || 'Unknown';
    byCity[city] = (byCity[city] || 0) + 1;
    confSum += s.confidence || 0;
    if (s.status === 'blocked') blocked++;
    else if (s.status === 'partial') partial++;
    else if (s.status === 'clear') clear++;
    else unknown++;

    const risk = segmentBlockageProbability(s);
    if (risk >= 0.5) highRisk++;
    risky.push({
      name: s.name,
      city,
      status: s.status,
      confidence: s.confidence,
      risk: Math.round(risk * 100),
    });
  }

  risky.sort((a, b) => b.risk - a.risk);

  return {
    total: segments.length,
    blocked,
    partial,
    clear,
    unknown,
    avgConfidence: segments.length ? Math.round((confSum / segments.length) * 10) / 10 : 0,
    highRisk,
    byCity,
    topRisky: risky.slice(0, 8),
  };
}
