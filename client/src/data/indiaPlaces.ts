/** Demo destinations for India MVP routing */

export interface Place {
  id: string;
  name: string;
  area: string;
  city: 'Delhi' | 'Bangalore';
  lng: number;
  lat: number;
}

export const INDIA_PLACES: Place[] = [
  // Delhi
  { id: 'del-cp', name: 'Connaught Place', area: 'Central Delhi', city: 'Delhi', lng: 77.2190, lat: 28.6320 },
  { id: 'del-aiims', name: 'AIIMS', area: 'South Delhi', city: 'Delhi', lng: 77.2100, lat: 28.5672 },
  { id: 'del-igu', name: 'IGI Airport T3', area: 'Dwarka', city: 'Delhi', lng: 77.1000, lat: 28.5562 },
  { id: 'del-gurgaon', name: 'Cyber City', area: 'Gurgaon', city: 'Delhi', lng: 77.0900, lat: 28.4950 },
  { id: 'del-noida', name: 'Sector 18', area: 'Noida', city: 'Delhi', lng: 77.3260, lat: 28.5700 },
  { id: 'del-ito', name: 'ITO', area: 'Delhi', city: 'Delhi', lng: 77.2500, lat: 28.6280 },
  { id: 'del-iit', name: 'IIT Delhi', area: 'Hauz Khas', city: 'Delhi', lng: 77.1920, lat: 28.5450 },
  // Bangalore
  { id: 'blr-mg', name: 'MG Road', area: 'Bangalore', city: 'Bangalore', lng: 77.6100, lat: 12.9750 },
  { id: 'blr-airport', name: 'Kempegowda Airport', area: 'Devanahalli', city: 'Bangalore', lng: 77.7060, lat: 13.1986 },
  { id: 'blr-electronic', name: 'Electronic City', area: 'Bangalore', city: 'Bangalore', lng: 77.6700, lat: 12.8450 },
  { id: 'blr-whitefield', name: 'Whitefield', area: 'Bangalore', city: 'Bangalore', lng: 77.7500, lat: 12.9700 },
  { id: 'blr-koramangala', name: 'Koramangala', area: 'Bangalore', city: 'Bangalore', lng: 77.6300, lat: 12.9350 },
  { id: 'blr-bellandur', name: 'Bellandur', area: 'ORR', city: 'Bangalore', lng: 77.6800, lat: 12.9300 },
];

export const DEFAULT_ORIGIN_DELHI = { lng: 77.2190, lat: 28.6320 }; // CP
export const DEFAULT_ORIGIN_BLR = { lng: 77.6100, lat: 12.9750 }; // MG Road
