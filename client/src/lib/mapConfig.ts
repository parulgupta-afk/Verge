// Verge map configuration — India focused

export const INDIA_CENTER: [number, number] = [78.9629, 21.5937]; // roughly central India
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

// Free raster style (OpenStreetMap via free tile servers)
// For production you can switch to MapTiler / OpenFreeMap with a key
export const MAP_STYLE = {
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
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster' as const,
      source: 'osm',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

// Status colors for road segments
export const STATUS_COLORS = {
  blocked: '#ef4444',   // red-500
  partial: '#f59e0b',   // amber-500
  clear: '#22c55e',     // green-500
  unknown: '#94a3b8',   // slate-400
} as const;
