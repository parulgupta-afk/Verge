// Verge map configuration — India focused
// NO Mapbox. NO Carto API key. Pure OpenStreetMap raster tiles.

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
 * OpenStreetMap raster — free, no API key.
 * (Carto dark_all now watermarks "API KEY REQUIRED" without a key — do not use.)
 */
export const OSM_RASTER_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: 'raster' as const,
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
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

/** Optional: MapLibre demo style (no key) if OSM is blocked on a network */
export const MAPLIBRE_DEMO_STYLE_URL = 'https://demotiles.maplibre.org/style.json';

/** Primary style — OSM only, never Carto/Mapbox */
export const MAP_STYLE = OSM_RASTER_STYLE;

export const STATUS_COLORS = {
  blocked: '#ef4444',
  partial: '#f59e0b',
  clear: '#22c55e',
  unknown: '#94a3b8',
} as const;
