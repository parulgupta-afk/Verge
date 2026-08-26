/**
 * Phase 5 — Risk-aware routing helpers
 *
 * route cost ≈ travel_time + blockage_probability × penalty
 */

import type { RoadSegment } from '../types';
import type { RouteResult } from './routing';
import { routeIntersectsBlocked } from './routing';

export interface SegmentRisk {
  segmentId: string;
  name: string;
  /** 0–1 estimated probability the segment is problematic now */
  blockageProbability: number;
  status: string;
  confidence: number;
}

/** Map segment status + confidence → blockage probability */
export function segmentBlockageProbability(seg: RoadSegment): number {
  const c = Math.min(100, Math.max(0, seg.confidence)) / 100;
  switch (seg.status) {
    case 'blocked':
      return 0.55 + 0.4 * c; // high when confident blocked
    case 'partial':
      return 0.25 + 0.35 * c;
    case 'clear':
      return Math.max(0, 0.15 * (1 - c)); // low if confident clear
    default:
      return 0.12; // unknown — small uncertainty
  }
}

export function listSegmentRisks(segments: RoadSegment[]): SegmentRisk[] {
  return segments.map((s) => ({
    segmentId: s.id,
    name: s.name,
    blockageProbability: segmentBlockageProbability(s),
    status: s.status,
    confidence: s.confidence,
  }));
}

export interface ScoredRoute {
  route: RouteResult;
  label: string;
  /** seconds */
  travelTimeSec: number;
  riskPenaltySec: number;
  /** total cost used for ranking */
  totalCostSec: number;
  intersectsBlockage: boolean;
  blockageName?: string;
  tradeOffSummary: string;
}

const RISK_PENALTY_SECONDS = 600; // +10 min equivalent when high risk on path

/**
 * Score a route: travel time + risk penalty if it crosses bad segments.
 */
export function scoreRoute(
  route: RouteResult,
  segments: RoadSegment[],
  label: string
): ScoredRoute {
  const { hit, segmentName } = routeIntersectsBlocked(route.geometry, segments);
  let riskPenalty = 0;
  if (hit) {
    const seg = segments.find((s) => s.name === segmentName);
    const p = seg ? segmentBlockageProbability(seg) : 0.7;
    riskPenalty = Math.round(p * RISK_PENALTY_SECONDS);
  }

  const travelTimeSec = route.durationSeconds;
  const totalCostSec = travelTimeSec + riskPenalty;

  let tradeOffSummary: string;
  if (hit) {
    tradeOffSummary = `Faster on paper (${route.durationText}) but crosses “${segmentName || 'a risky road'}” — risk penalty +${Math.round(riskPenalty / 60)} min equivalent.`;
  } else {
    tradeOffSummary = `Clear of high-confidence blockages. ${route.durationText}, ${route.distanceText}.`;
  }

  return {
    route,
    label,
    travelTimeSec,
    riskPenaltySec: riskPenalty,
    totalCostSec,
    intersectsBlockage: hit,
    blockageName: segmentName,
    tradeOffSummary,
  };
}

/** Rank scored routes; best = lowest total cost */
export function rankRoutes(scored: ScoredRoute[]): ScoredRoute[] {
  return [...scored].sort((a, b) => a.totalCostSec - b.totalCostSec);
}

export function buildComparisonSummary(ranked: ScoredRoute[]): string {
  if (!ranked.length) return 'No routes available.';
  const best = ranked[0];
  if (ranked.length === 1) {
    return best.intersectsBlockage
      ? `Only one route found. ${best.tradeOffSummary}`
      : `Recommended: ${best.label}. ${best.tradeOffSummary}`;
  }
  const second = ranked[1];
  if (!best.intersectsBlockage && second.intersectsBlockage) {
    return `Recommended: ${best.label} (${best.route.durationText}) — avoids reported blockage. Alternative is ${second.route.durationText} but riskier.`;
  }
  if (best.intersectsBlockage && !second.intersectsBlockage) {
    return `Recommended: ${second.label} — safer despite possibly longer time. Fastest path hits a reported issue.`;
  }
  return `Recommended: ${best.label} (${best.route.durationText}). ${best.tradeOffSummary}`;
}
