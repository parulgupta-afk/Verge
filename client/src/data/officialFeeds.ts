/** Phase 6 — Mock official / civic traffic notices (India MVP) */

export interface OfficialNotice {
  id: string;
  city: 'Delhi' | 'Bangalore';
  title: string;
  body: string;
  severity: 'info' | 'warning' | 'critical';
  source: string;
  updatedAt: string;
}

export const OFFICIAL_NOTICES: OfficialNotice[] = [
  {
    id: 'del-monsoon-1',
    city: 'Delhi',
    title: 'Monsoon waterlogging alert — South Delhi',
    body: 'Traffic police: Expect slow movement near Outer Ring Road / IIT stretch during heavy rain. Prefer elevated corridors if possible.',
    severity: 'warning',
    source: 'Delhi Traffic Police (demo)',
    updatedAt: 'Today',
  },
  {
    id: 'del-vip-1',
    city: 'Delhi',
    title: 'Temporary diversions — Central Delhi',
    body: 'Short-duration diversions possible near VIP movement corridors. Follow on-ground signage.',
    severity: 'info',
    source: 'Delhi Traffic Police (demo)',
    updatedAt: 'Today',
  },
  {
    id: 'blr-orr-1',
    city: 'Bangalore',
    title: 'ORR Bellandur — flooding risk',
    body: 'BBMP / traffic advisory: Waterlogging reported historically near Bellandur lake stretch in heavy rain. Allow extra time.',
    severity: 'critical',
    source: 'Bengaluru Traffic (demo)',
    updatedAt: 'Today',
  },
  {
    id: 'blr-airport-1',
    city: 'Bangalore',
    title: 'Airport road — normal operations',
    body: 'No major official closures on primary airport approach at this time (demo feed).',
    severity: 'info',
    source: 'Bengaluru Traffic (demo)',
    updatedAt: 'Today',
  },
];

/** Hospital / emergency destinations for priority mode */
export const EMERGENCY_PLACES = [
  { id: 'del-aiims', name: 'AIIMS Delhi', city: 'Delhi' as const, lng: 77.2100, lat: 28.5672 },
  { id: 'del-safdarjung', name: 'Safdarjung Hospital', city: 'Delhi' as const, lng: 77.2050, lat: 28.5680 },
  { id: 'blr-nimhans', name: 'NIMHANS', city: 'Bangalore' as const, lng: 77.5950, lat: 12.9430 },
  { id: 'blr-manipal', name: 'Manipal Hospital HAL', city: 'Bangalore' as const, lng: 77.6600, lat: 12.9600 },
];
