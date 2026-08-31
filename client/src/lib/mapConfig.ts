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
 */
export const FREE_STYLE_URLS = {
  cartoDark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  openFreeMap: 'https://tiles.openfreemap.org/styles/liberty',
  maplibreDemo: 'https://demotiles.maplibre.org/style.json',
} as const;

/** High-speed CARTO Dark Matter raster style — loads in milliseconds and matches Verge dark UI */
export const DARK_MATTER_STYLE = {
  version: 8 as const,
  sources: {
    'carto-dark': {
      type: 'raster' as const,
      tiles: [
        'https://a.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png',
        'https://d.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'carto-dark-layer',
      type: 'raster' as const,
      source: 'carto-dark',
      minzoom: 0,
      maxzoom: 20,
    },
  ],
};

/** Classic OSM raster style */
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

/** Primary map style: Fast CARTO Dark Matter (reliable, instant, dark theme) */
export const MAP_STYLE = DARK_MATTER_STYLE;
export const MAP_STYLE_URL = FREE_STYLE_URLS.cartoDark;

export const STATUS_COLORS = {
  blocked: '#ef4444',
  partial: '#f59e0b',
  clear: '#22c55e',
  unknown: '#94a3b8',
} as const;

