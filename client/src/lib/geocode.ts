/**
 * Free place search via OpenStreetMap Nominatim (no API key).
 */
import type { Place } from '../data/indiaPlaces';

export interface GeocodeHit {
  id: string;
  name: string;
  area: string;
  city: string;
  lng: number;
  lat: number;
  displayName: string;
}

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const INDIA_VIEWBOX = '68.1,6.5,97.4,35.7';

function cityFromAddress(addr: Record<string, string> | undefined, display: string): string {
  if (!addr) {
    if (/bengaluru|bangalore/i.test(display)) return 'Bangalore';
    if (/delhi|new delhi|noida|gurgaon|gurugram/i.test(display)) return 'Delhi';
    return 'India';
  }
  const city =
    addr.city || addr.town || addr.village || addr.county || addr.state_district || addr.state || '';
  if (/bengaluru|bangalore/i.test(city) || /bengaluru|bangalore/i.test(display)) return 'Bangalore';
  if (
    /delhi|new delhi|noida|gurgaon|gurugram|ghaziabad|faridabad/i.test(city) ||
    /delhi|noida|gurgaon|gurugram/i.test(display)
  )
    return 'Delhi';
  return city || 'India';
}

function toHit(row: any, i: number): GeocodeHit {
  const addr = row.address || {};
  const name =
    addr.amenity ||
    addr.building ||
    addr.road ||
    addr.suburb ||
    addr.neighbourhood ||
    row.name ||
    (row.display_name || '').split(',')[0] ||
    'Place';
  const area = [addr.suburb, addr.neighbourhood, addr.city, addr.town, addr.state]
    .filter(Boolean)
    .slice(0, 3)
    .join(', ');
  const displayName = row.display_name || name;
  return {
    id: `geo-${row.place_id || `${row.lon}-${row.lat}-${i}`}`,
    name: String(name).trim(),
    area: area || cityFromAddress(addr, displayName),
    city: cityFromAddress(addr, displayName),
    lng: parseFloat(row.lon),
    lat: parseFloat(row.lat),
    displayName,
  };
}

export function hitToPlace(hit: GeocodeHit): Place {
  return {
    id: hit.id,
    name: hit.name,
    area: hit.area,
    city: hit.city as Place['city'],
    lng: hit.lng,
    lat: hit.lat,
  };
}

export async function searchPlaces(
  query: string,
  opts?: { limit?: number; signal?: AbortSignal }
): Promise<GeocodeHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const params = new URLSearchParams({
    q,
    format: 'json',
    addressdetails: '1',
    limit: String(opts?.limit ?? 8),
    countrycodes: 'in',
    viewbox: INDIA_VIEWBOX,
    bounded: '0',
  });

  const res = await fetch(`${NOMINATIM}?${params}`, {
    signal: opts?.signal,
    headers: {
      Accept: 'application/json',
      'User-Agent': 'VergeIndia/1.2 (road confidence demo)',
    },
  });

  if (!res.ok) {
    console.warn('[Verge] Nominatim HTTP', res.status);
    return [];
  }

  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data
    .map((row, i) => toHit(row, i))
    .filter((h) => !Number.isNaN(h.lat) && !Number.isNaN(h.lng));
}
