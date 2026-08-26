// Verge map configuration — India focused
// 100% free stack: MapLibre GL + free styles/tiles (NO Mapbox account)

export const INDIA_CENTER: [number, number] = [78.9629, 21.5937];
export const INDIA_ZOOM = 4.5;

export const CITY_CENTERS = {
  delhi: { center: [77.2090, 28.6139] as [number, number], zoom: 11 },
  bangalore: { center: [77.5946, 12.9716] as [number, number], zoom: 12 },
  mumbai: { center: [72.8777, 19.0760] as [number, number], zoom: 11 },
  hyderabad: { center: [78.4867, 17.3850] as [number, number], zoom: 12 },
  chennai: { center: [80.2707, 13.0827] as [number, number], zoom: 12 },
  pune: { center: [73.8567, 18.5204] as [number, number], zoom: 12 },
} as const;

export type CityKey = keyof typeof CITY_CENTERS;

/**
 * Free map styles (pick one — no API key, no payment method)
 *
 * 1. OpenFreeMap Liberty — vector, looks modern
 * 2. MapLibre demo style — always works for local dev
 * 3. OSM raster — classic, simple
 */
export const FREE_STYLE_URLS = {
  openFreeMap: 'https://tiles.openfreemap.org/styles/liberty',
  maplibreDemo: 'https://demotiles.maplibre.org/style.json',
} as const;

/** Default: OpenFreeMap (free, no signup). Fallback handled in MapView if load fails. */
export const MAP_STYLE_URL = FREE_STYLE_URLS.openFreeMap;

/** OSM raster fallback if vector style fails */
export const OSM_RASTER_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: 'raster' as const,
      tiles: [
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster' as const,
      source: 'osm',
    },
  ],
};

export const STATUS_COLORS = {
  blocked: '#ef4444',
  partial: '#f59e0b',
  clear: '#22c55e',
  unknown: '#94a3b8',
} as const;
