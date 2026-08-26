export type AppScreen =
  | 'welcome'
  | 'map'
  | 'report_flow'
  | 'navigation'
  | 'reports_history'
  | 'traffic_settings'
  | 'offline_maps'
  | 'search'
  | 'leaderboard';

export type ReportStatus = 'blocked' | 'partial' | 'clear' | 'unknown';

export interface RoadSegment {
  id: string;
  name: string;
  roadCode?: string;
  city?: string;
  distance?: string;
  status: ReportStatus;
  confidence: number;
  confirms: number;
  refutes: number;
  updatedAt: string;
  location?: string;
  description?: string;
  photoUrl?: string;
  notes?: string;
  // Real geometry for MapLibre (GeoJSON LineString)
  geometry?: GeoJSON.LineString;
  // Legacy decorative fields (prototype)
  svgPath?: string;
  nodeX?: number;
  nodeY?: number;
}

export interface UserReport {
  id: string;
  roadName: string;
  segmentId: string;
  status: ReportStatus;
  confidence: number;
  confirms: number;
  refutes: number;
  updatedAt: string;
  location: string;
  photoUrl?: string;
  notes?: string;
}

export interface OfflineMapItem {
  id: string;
  name: string;
  status: 'downloaded' | 'update_available' | 'downloading';
  size: string;
  progress?: number;
  lastUpdated: string;
}

export interface TrafficSettingsState {
  majorBlockages: boolean;
  minorDelays: boolean;
  speedCameras: boolean;
  visualStyle: 'standard' | 'satellite' | 'high_contrast';
  show3dBuildings: boolean;
  showPois: boolean;
  showTrafficFlow: boolean;
  confidenceThreshold: number;
  communityReports: boolean;
  sensorData: boolean;
  historicalTrends: boolean;
  minConfidenceLevel: 'Low' | 'Medium' | 'High';
  notificationRadius: number; // in miles
  segmentThickness: number; // 1 to 5
  showConfidenceBars: boolean;
  animateFlow: boolean;
}

export interface LeaderboardUser {
  id: string;
  name: string;
  rank: number;
  reportsCount: number;
  trustScore: number;
  tier: string;
  avatarUrl: string;
  isCurrentUser?: boolean;
}

export interface NavigationState {
  isActive: boolean;
  instruction: string;
  streetName: string;
  distanceToTurn: string;
  nextInstruction: string;
  eta: string;
  remainingMinutes: number;
  totalDistance: string;
  confirmedPercent: number;
}
