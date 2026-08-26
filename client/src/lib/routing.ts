/**
 * Verge V1 routing — uses public OSRM demo server (no API key).
 * For production, swap to Mapbox Directions or self-hosted OSRM.
 */

export interface LatLng {
  lng: number;
  lat: number;
}

export interface RouteResult {
  geometry: GeoJSON.LineString;
  distanceMeters: number;
  durationSeconds: number;
  distanceText: string;
  durationText: string;
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

/**
 * Fetch a driving route between two points via OSRM.
 * Optional exclude: not fully supported by public OSRM for arbitrary segments;
 * V1 best-effort is to request the route and let the client detect blocked
 * segments that intersect the polyline, then re-request with a via/avoid heuristic later.
 */
export async function fetchRoute(
  origin: LatLng,
  destination: LatLng
): Promise<RouteResult | null> {
  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const url =
    `https://router.project-osrm.org/route/v1/driving/${coords}` +
    `?overview=full&geometries=geojson&steps=false`;

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
    return {
      geometry,
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      distanceText: formatDistance(route.distance),
      durationText: formatDuration(route.duration),
      legs: route.legs || [],
    };
  } catch (e) {
    console.error('[Verge] fetchRoute failed', e);
    return null;
  }
}

/** Rough check: does any point of the route fall near a blocked segment's bbox? */
export function routeIntersectsBlocked(
  routeGeometry: GeoJSON.LineString,
  segments: Array<{ status: string; geometry?: GeoJSON.LineString; confidence: number }>
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
        return { hit: true, segmentName: (seg as any).name || 'a reported road' };
      }
    }
  }
  return { hit: false };
}

/** Build a short plain-language reroute explanation (MVP — no LLM required). */
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

/** Speak text via Web Speech API (best-effort). */
export function speak(text: string): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.05;
    u.lang = 'en-IN';
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}
