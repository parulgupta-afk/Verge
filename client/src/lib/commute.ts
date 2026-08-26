/**
 * Phase 7 — Saved commutes + shareable route payloads
 */

import type { Place } from '../data/indiaPlaces';
import { getDeviceId } from './identity';

const COMMUTES_KEY = 'verge_commutes_v1';

export interface SavedCommute {
  id: string;
  label: string;
  place: Place;
  useCount: number;
  lastUsedAt: string;
}

export function loadCommutes(): SavedCommute[] {
  try {
    const raw = localStorage.getItem(COMMUTES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedCommute[];
  } catch {
    return [];
  }
}

function saveAll(list: SavedCommute[]): void {
  localStorage.setItem(COMMUTES_KEY, JSON.stringify(list));
}

/** Record a destination visit; bumps useCount or creates entry */
export function rememberDestination(place: Place, label?: string): SavedCommute[] {
  const list = loadCommutes();
  const existing = list.find((c) => c.place.id === place.id);
  if (existing) {
    existing.useCount += 1;
    existing.lastUsedAt = new Date().toISOString();
    existing.label = label || existing.label || place.name;
  } else {
    list.push({
      id: `c-${place.id}-${Date.now()}`,
      label: label || place.name,
      place,
      useCount: 1,
      lastUsedAt: new Date().toISOString(),
    });
  }
  list.sort((a, b) => b.useCount - a.useCount || b.lastUsedAt.localeCompare(a.lastUsedAt));
  saveAll(list.slice(0, 20));
  return loadCommutes();
}

export function removeCommute(id: string): SavedCommute[] {
  const list = loadCommutes().filter((c) => c.id !== id);
  saveAll(list);
  return list;
}

export function topCommutes(n = 5): SavedCommute[] {
  return loadCommutes().slice(0, n);
}

/** Compact share payload for copy/paste or URL hash */
export interface SharePayload {
  v: 1;
  name: string;
  city: string;
  lng: number;
  lat: number;
  from?: string;
  device?: string;
}

export function buildSharePayload(place: Place, fromLabel?: string): SharePayload {
  return {
    v: 1,
    name: place.name,
    city: place.city,
    lng: place.lng,
    lat: place.lat,
    from: fromLabel,
    device: getDeviceId().slice(0, 8),
  };
}

export function encodeShare(payload: SharePayload): string {
  const json = JSON.stringify(payload);
  return btoa(unescape(encodeURIComponent(json)));
}

export function decodeShare(code: string): SharePayload | null {
  try {
    const json = decodeURIComponent(escape(atob(code.trim())));
    const data = JSON.parse(json) as SharePayload;
    if (data?.v !== 1 || !data.name || typeof data.lng !== 'number') return null;
    return data;
  } catch {
    return null;
  }
}

export function shareToClipboard(place: Place): Promise<string> {
  const payload = buildSharePayload(place, 'Verge India');
  const code = encodeShare(payload);
  const text =
    `Verge route: ${place.name} (${place.city})\n` +
    `Open Verge → Social → Join with code:\n${code}`;
  return navigator.clipboard.writeText(text).then(() => code);
}

export function placeFromShare(payload: SharePayload): Place {
  return {
    id: `share-${payload.lng}-${payload.lat}`,
    name: payload.name,
    area: payload.from || 'Shared',
    city: (payload.city === 'Bangalore' ? 'Bangalore' : 'Delhi') as Place['city'],
    lng: payload.lng,
    lat: payload.lat,
  };
}
