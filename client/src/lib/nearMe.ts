/**
 * Near-me / district-first focus — Verge differentiator vs national map spam.
 * Prefer issues close to the user (or city center) before showing distant noise.
 */

import type { RoadSegment } from '../types';

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function segmentCentroid(seg: RoadSegment): { lat: number; lng: number } | null {
  const coords = seg.geometry?.coordinates;
  if (!coords?.length) return null;
  let lng = 0;
  let lat = 0;
  for (const c of coords) {
    lng += c[0];
    lat += c[1];
  }
  return { lng: lng / coords.length, lat: lat / coords.length };
}

export function filterSegmentsNear(
  segments: RoadSegment[],
  origin: { lat: number; lng: number } | null,
  radiusKm: number
): RoadSegment[] {
  if (!origin || radiusKm <= 0) return segments;
  return segments.filter((s) => {
    const c = segmentCentroid(s);
    if (!c) return true;
    return haversineKm(origin, c) <= radiusKm;
  });
}

/** Blocked/partial near the user for “first notify me” strip */
export function nearMeAlerts(
  segments: RoadSegment[],
  origin: { lat: number; lng: number } | null,
  radiusKm = 12
): Array<{ id: string; name: string; status: string; confidence: number; km: number }> {
  if (!origin) return [];
  const out: Array<{ id: string; name: string; status: string; confidence: number; km: number }> = [];
  for (const s of segments) {
    if (s.status !== 'blocked' && s.status !== 'partial') continue;
    if (s.confidence < 50) continue;
    const c = segmentCentroid(s);
    if (!c) continue;
    const km = haversineKm(origin, c);
    if (km <= radiusKm) {
      out.push({
        id: s.id,
        name: s.name,
        status: s.status,
        confidence: s.confidence,
        km: Math.round(km * 10) / 10,
      });
    }
  }
  return out.sort((a, b) => a.km - b.km || b.confidence - a.confidence).slice(0, 5);
}
