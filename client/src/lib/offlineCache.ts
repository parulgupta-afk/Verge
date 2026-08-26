/**
 * Phase 6 — Offline snapshot of road status
 */

import type { RoadSegment } from '../types';

const KEY = 'verge_offline_segments_v1';
const META_KEY = 'verge_offline_meta_v1';

export function saveSegmentSnapshot(segments: RoadSegment[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(segments));
    localStorage.setItem(
      META_KEY,
      JSON.stringify({ savedAt: new Date().toISOString(), count: segments.length })
    );
  } catch {
    /* quota / private mode */
  }
}

export function loadSegmentSnapshot(): RoadSegment[] | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RoadSegment[];
  } catch {
    return null;
  }
}

export function snapshotMeta(): { savedAt: string; count: number } | null {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isProbablyOffline(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.onLine === false;
}
