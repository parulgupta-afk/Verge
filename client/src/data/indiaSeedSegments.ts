import type { RoadSegment } from '../types';

/**
 * Starter road segments for India MVP (Delhi-NCR + Bangalore).
 * Coordinates are approximate major corridors for demo / testing.
 * In production these will come from PostGIS / OSM extracts.
 */

export const INDIA_SEED_SEGMENTS: RoadSegment[] = [
  // ——— Delhi ———
  {
    id: 'del-ring-1',
    name: 'Outer Ring Road (South)',
    roadCode: 'ORR-S',
    city: 'Delhi',
    status: 'blocked',
    confidence: 92,
    confirms: 14,
    refutes: 1,
    updatedAt: '4 min ago',
    location: 'Delhi',
    description: 'Waterlogging near IIT Gate after heavy rain. Multiple lanes closed.',
    geometry: {
      type: 'LineString',
      coordinates: [
        [77.2000, 28.5450],
        [77.2200, 28.5450],
        [77.2400, 28.5500],
        [77.2600, 28.5550],
      ],
    },
  },
  {
    id: 'del-nh48-1',
    name: 'NH-48 (Gurgaon stretch)',
    roadCode: 'NH-48',
    city: 'Delhi',
    status: 'partial',
    confidence: 71,
    confirms: 8,
    refutes: 3,
    updatedAt: '12 min ago',
    location: 'Gurgaon',
    description: 'Slow traffic due to ongoing metro construction.',
    geometry: {
      type: 'LineString',
      coordinates: [
        [77.0700, 28.4600],
        [77.0900, 28.4700],
        [77.1100, 28.4800],
        [77.1300, 28.4900],
      ],
    },
  },
  {
    id: 'del-mg-road',
    name: 'MG Road',
    roadCode: 'MG',
    city: 'Delhi',
    status: 'clear',
    confidence: 88,
    confirms: 11,
    refutes: 0,
    updatedAt: '25 min ago',
    location: 'Delhi',
    description: 'Clear after morning peak.',
    geometry: {
      type: 'LineString',
      coordinates: [
        [77.2000, 28.6300],
        [77.2200, 28.6300],
        [77.2400, 28.6280],
      ],
    },
  },
  {
    id: 'del-ito',
    name: 'ITO Crossing approaches',
    roadCode: 'ITO',
    city: 'Delhi',
    status: 'partial',
    confidence: 65,
    confirms: 6,
    refutes: 2,
    updatedAt: '18 min ago',
    location: 'Delhi',
    description: 'Congestion due to temporary diversions.',
    geometry: {
      type: 'LineString',
      coordinates: [
        [77.2400, 28.6250],
        [77.2500, 28.6280],
        [77.2600, 28.6300],
      ],
    },
  },

  // ——— Bangalore ———
  {
    id: 'blr-or-1',
    name: 'Outer Ring Road (ORR) – Bellandur',
    roadCode: 'ORR-BLR',
    city: 'Bangalore',
    status: 'blocked',
    confidence: 89,
    confirms: 19,
    refutes: 2,
    updatedAt: '6 min ago',
    location: 'Bangalore',
    description: 'Major waterlogging near Bellandur lake. Avoid if possible.',
    geometry: {
      type: 'LineString',
      coordinates: [
        [77.6600, 12.9300],
        [77.6800, 12.9350],
        [77.7000, 12.9400],
        [77.7200, 12.9450],
      ],
    },
  },
  {
    id: 'blr-hosur',
    name: 'Hosur Road',
    roadCode: 'Hosur',
    city: 'Bangalore',
    status: 'partial',
    confidence: 58,
    confirms: 5,
    refutes: 3,
    updatedAt: '22 min ago',
    location: 'Bangalore',
    description: 'Construction work, one lane closed.',
    geometry: {
      type: 'LineString',
      coordinates: [
        [77.6000, 12.9000],
        [77.6200, 12.9100],
        [77.6400, 12.9200],
      ],
    },
  },
  {
    id: 'blr-airport',
    name: 'Airport Road (Old)',
    roadCode: 'AIRPORT',
    city: 'Bangalore',
    status: 'clear',
    confidence: 81,
    confirms: 9,
    refutes: 1,
    updatedAt: '40 min ago',
    location: 'Bangalore',
    description: 'Moving well.',
    geometry: {
      type: 'LineString',
      coordinates: [
        [77.6000, 13.0000],
        [77.6200, 13.0200],
        [77.6400, 13.0400],
      ],
    },
  },
  {
    id: 'blr-mg',
    name: 'MG Road – Brigade',
    roadCode: 'MG-BLR',
    city: 'Bangalore',
    status: 'unknown',
    confidence: 0,
    confirms: 0,
    refutes: 0,
    updatedAt: '—',
    location: 'Bangalore',
    description: 'No recent reports.',
    geometry: {
      type: 'LineString',
      coordinates: [
        [77.6000, 12.9750],
        [77.6100, 12.9750],
        [77.6200, 12.9760],
      ],
    },
  },
];
