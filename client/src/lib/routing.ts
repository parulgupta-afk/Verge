/**
 * Verge routing — public OSRM (no API key for demo).
 * Phase 4: steps for turn-by-turn voice.
 */

export interface LatLng {
  lng: number;
  lat: number;
}

export interface RouteStep {
  instruction: string;
  name: string;
  distanceMeters: number;
  durationSeconds: number;
  distanceText: string;
}

export interface RouteResult {
  geometry: GeoJSON.LineString;
  distanceMeters: number;
  durationSeconds: number;
  distanceText: string;
  durationText: string;
  steps: RouteStep[];
  legs: Array<{ summary?: string }>;
}

function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

function formatDuration(s: number): string {
  const mins = Math.round(s / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

function stepInstruction(step: any): string {
  const man = step.maneuver || {};
  const type = (man.type || '').replace(/_/g, ' ');
  const modifier = (man.modifier || '').replace(/_/g, ' ');
  const name = step.name || step.ref || '';
  if (type === 'arrive') return name ? `Arrive at ${name}` : 'You have arrived';
  if (type === 'depart') return name ? `Head out on ${name}` : 'Start navigation';
  const action = [type, modifier].filter(Boolean).join(' ');
  if (name) return `${action} onto ${name}`;
  return action || 'Continue';
}

export async function fetchRoute(
  origin: LatLng,
  destination: LatLng
): Promise<RouteResult | null> {
  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const url =
    `https://router.project-osrm.org/route/v1/driving/${coords}` +
    `?overview=full&geometries=geojson&steps=true`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error('[Verge] OSRM HTTP', res.status);
      return null;
    }
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]) {
      console.error('[Verge] OSRM error', data.code);
      return null;
    }
    const route = data.routes[0];
    const geometry = route.geometry as GeoJSON.LineString;
    const steps: RouteStep[] = [];
    for (const leg of route.legs || []) {
      for (const step of leg.steps || []) {
        steps.push({
          instruction: stepInstruction(step),
          name: step.name || '',
          distanceMeters: step.distance || 0,
          durationSeconds: step.duration || 0,
          distanceText: formatDistance(step.distance || 0),
        });
      }
    }
    return {
      geometry,
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      distanceText: formatDistance(route.distance),
      durationText: formatDuration(route.duration),
      steps,
      legs: route.legs || [],
    };
  } catch (e) {
    console.error('[Verge] fetchRoute failed', e);
    return null;
  }
}

/** Fetch main route + up to 2 alternatives (OSRM). */
export async function fetchRouteAlternatives(
  origin: LatLng,
  destination: LatLng
): Promise<RouteResult[]> {
  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const url =
    `https://router.project-osrm.org/route/v1/driving/${coords}` +
    `?overview=full&geometries=geojson&steps=true&alternatives=true`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.length) return [];

    const results: RouteResult[] = [];
    for (const route of data.routes.slice(0, 3)) {
      const geometry = route.geometry as GeoJSON.LineString;
      const steps: RouteStep[] = [];
      for (const leg of route.legs || []) {
        for (const step of leg.steps || []) {
          steps.push({
            instruction: stepInstruction(step),
            name: step.name || '',
            distanceMeters: step.distance || 0,
            durationSeconds: step.duration || 0,
            distanceText: formatDistance(step.distance || 0),
          });
        }
      }
      results.push({
        geometry,
        distanceMeters: route.distance,
        durationSeconds: route.duration,
        distanceText: formatDistance(route.distance),
        durationText: formatDuration(route.duration),
        steps,
        legs: route.legs || [],
      });
    }
    return results;
  } catch (e) {
    console.error('[Verge] fetchRouteAlternatives failed', e);
    return [];
  }
}

export function routeIntersectsBlocked(
  routeGeometry: GeoJSON.LineString,
  segments: Array<{ status: string; geometry?: GeoJSON.LineString; confidence: number; name?: string }>
): { hit: boolean; segmentName?: string } {
  const blocked = segments.filter(
    (s) => (s.status === 'blocked' || s.status === 'partial') && s.confidence >= 60 && s.geometry
  );
  if (!blocked.length || !routeGeometry?.coordinates?.length) {
    return { hit: false };
  }

  for (const seg of blocked) {
    const coords = seg.geometry!.coordinates;
    const lons = coords.map((c) => c[0]);
    const lats = coords.map((c) => c[1]);
    const minLon = Math.min(...lons) - 0.01;
    const maxLon = Math.max(...lons) + 0.01;
    const minLat = Math.min(...lats) - 0.01;
    const maxLat = Math.max(...lats) + 0.01;

    for (const [lng, lat] of routeGeometry.coordinates) {
      if (lng >= minLon && lng <= maxLon && lat >= minLat && lat <= maxLat) {
        return { hit: true, segmentName: seg.name || 'a reported road' };
      }
    }
  }
  return { hit: false };
}

export function buildRerouteExplanation(opts: {
  segmentName?: string;
  oldDurationText?: string;
  newDurationText?: string;
}): string {
  const road = opts.segmentName || 'a road ahead';
  const delta =
    opts.oldDurationText && opts.newDurationText
      ? ` New ETA about ${opts.newDurationText}.`
      : '';
  return `Rerouting. ${road} was reported blocked by multiple users.${delta}`;
}

// Back-compat: App still imports speak from routing
export { speak, stopSpeaking, isVoiceMuted, setVoiceMuted, initVoices } from './voice';

/** All verified/high-confidence issues that appear near the active route geometry. */
export function listBlockagesOnRoute(
  routeGeometry: GeoJSON.LineString | null | undefined,
  segments: Array<{
    id: string;
    status: string;
    geometry?: GeoJSON.LineString;
    confidence: number;
    name?: string;
    updatedAt?: string;
  }>
): Array<{ id: string; name: string; status: string; confidence: number; updatedAt?: string }> {
  if (!routeGeometry?.coordinates?.length) return [];
  const out: Array<{ id: string; name: string; status: string; confidence: number; updatedAt?: string }> = [];
  for (const seg of segments) {
    if ((seg.status !== 'blocked' && seg.status !== 'partial') || seg.confidence < 55) continue;
    if (!seg.geometry?.coordinates?.length) continue;
    const coords = seg.geometry.coordinates;
    const lons = coords.map((c) => c[0]);
    const lats = coords.map((c) => c[1]);
    const minLon = Math.min(...lons) - 0.012;
    const maxLon = Math.max(...lons) + 0.012;
    const minLat = Math.min(...lats) - 0.012;
    const maxLat = Math.max(...lats) + 0.012;
    let hit = false;
    for (const [lng, lat] of routeGeometry.coordinates) {
      if (lng >= minLon && lng <= maxLon && lat >= minLat && lat <= maxLat) {
        hit = true;
        break;
      }
    }
    if (hit) {
      out.push({
        id: seg.id,
        name: seg.name || 'Reported segment',
        status: seg.status,
        confidence: seg.confidence,
        updatedAt: seg.updatedAt,
      });
    }
  }
  return out.sort((a, b) => b.confidence - a.confidence);
}
