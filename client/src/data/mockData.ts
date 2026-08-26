import { RoadSegment, UserReport, OfflineMapItem, TrafficSettingsState, LeaderboardUser } from '../types';

export const ASSETS = {
  satelliteMapMain: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDBIXCn_-tbcG0hskOHqe3IM6P2zTldDgZYdtFTaZ-hTydGwAuc6yc3IFXeQ8wY-CXjqiby7rDc6cZjs3aYrF5Pj-bDuKvj-sKhlCvIz3Uf1FsxIpwfJiD4N145TFGaPbp-huA2zh82KZ7b6vvwQpRLLBB_UdBGYPOz_EBLfQNYlt71gB82n5yX86bmXpTzKcYCMqj_1ts9DoxHlmFpxaTq4s_tsPIe3JABsa0L3vkGGa6prBbZDdBM',
  segmentDetailMap: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCrvWZ_KbsnWC4hdHkmE57SNaQyl9bKw7AZjcrVzR22KmoWx9-VPtnHRbzxrTg011WLd1k_EgCGgI5RdRL5mpEEjjJKpSFJXTil0NSegnd8lKgyI71L4Lcppka-Rja_cnzABNsPNKFzT75OzQZJKTqKEkC5GV1une3SMmHjSvN53Na8TGt1iGt_TpABX1L_03Yb4hkHryP4CIdvAhXIPnlvZxVekivCVuPDceDkNFLMj1azL_SBboAg',
  recalculatingMap: 'https://lh3.googleusercontent.com/aida-public/AB6AXuATcmGKz4SHK6N68QqU02c_wq67yYUKLOlCggtPflnj1LAbPap2miYwIhX2xcWqloM8_2f-gj8eJE9NwAYjtcViHV5qtYs5ADU0tGA5ZTDxAiI377STaAbIUD-LxaLbm9HAN4QbBImsw-Hqrb4_Dm6Z-owUwOp1vG5Jfzpgs02cQaXJaYZSuJFp_hQHDv2amXEL1EMRaeNvkutuIlkjPNC7EKq3xaOftTRiaotB5rTJJ5_RB2xB3C0K',
  chicagoMonochromeMap: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB25FXFLBwddUdpLKxDeSHrpf0YodK_fnDjORI-z6HwWbGc5zCD0neN3dF99A5A6idxx5Bf5cSsask5IENAQCGH5akZIw-T2Kikmz5KFncxz-jWUTZqfHg5F6m9ynuHDBCpbH6tRYrKhlNTVvEAUk830JLL-oR661K3xQc0jLWY4LsCqbweqPm5WAV53hF1LbOx8ej1jVSApSSUUrAyUOxVyFjVh_r9GLf_gCUvMOyjkUHgWBpew8k5',
  activeNavigationMap: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBFm1577lsSNyJ30gxpk0rLLjgwEaLnceAOUbwzZF6EaM_DEH2IbsNlJhLCdK2EuTe7NoJiQU-kwbCkKTIjB5Yp-2n6zwL6M5Pp8yRXMRQloO0ScCDeMg9MTbqGf47RPwMKH7idC0EPAWePGMJm-A3mb-le2gQVJoB0GlJTvZvJcYUhcNQ74KUX7qrGJNmroi8wcfyzP2uO6x1pOAra2LokOVs-b6hdQZsSYOxLySIu9rUpDCb1mepu',
  trafficJamPhoto: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA2LHQViknfCJj9mgcpLYmNL_m-ZzEdDFmqxO2dLKM2I3N3UOMoxluGBDXGFS0t1fOXYEXtjjvZBfsuMhRHV0OKt6ZBEPpLDjX0tVl1pixf3ahMp7WQ9x63JD-lL4OSyWmEN_v6kS1KEIAY8vKHlkdlo2iY90YoWD5YvLiITFcIOiQRkIXFx1kSjQl6X9G5xpZdOCc8Jryd9acINPV6-4JlqB3EDw561NN2X-Mab30G51OFwET4WuCJ',
  clearDawnRoadPhoto: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDPhPuo-aVMxksIVZaH__-xJTDp9zIErZJdOHnbusZAbnk7EkwM1-496LOTWBbTmjmJapH45-bzrL6opbyU35byuIPznb4cOGmE3rDL2KGnC5u2MnkbHG0K10WfvC_9eOYnKofuoAU8YHV_CC58rThwQ_y6xmIk9ajYZMhdtBVMZ7Em9117YI6kCGqxMfmEvA9dqHQyYouHl58lhr_u1y9zlSmO3M4DuqcBeoNGKclra_vOVZeRs5IG',
  searchBackground: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVoApcdugKYPdbpqaUATdQPbcQoETsL0KIrlpufNv6k4yG7inOX9DuC1QF4m_Ctp0nex9DjKYeRg8A2Is6MTd4J7iaic3eihKC8Tlcyj4F0-rgPVHx7sKHXA9FOGXHSXJ5dwFiXN-gRiQOfVtT4pwdvpX5YBkqhUa0Pd-gLUNWQAruRhE4johRjfWH7uQmwuKYocGV6ESFZaI1NRuHj0CxEUqeVHBaGE8N9t7WmhSoYyrMDlaEWB1M',
  alexAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNC8gUQ0Majm_8xfjXgho3S55_uyqq9yja9LiEw4wxdRJ9fXYrGyMqGxi0OUYmbIQxSLAFV7NqTJhdhez0a-MIbSjmvNF4PICnagERMmaZsiwzXNqvq5t9HdZdyn1IVFSjdd2X0cw0yUEDxXaQVXx4Cp2PUL3-j5SogclzYNJ_jkeeabZxZ7KL6JrUw2I0z6VZFLXAccWw6oxdwC2cEFZfUL1GosCieDuZTqfAJSR-qwKz-DC7-CJm',
  sarahAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAVtN6lJgTr-j0O3Sfkcr_OQCgWuetaxRL4mTV0JFLBePiXy69lVA6-KAtQ8Zj70iNYFDFzb1CVSGSTEN_Q-qedCqPOGnHACikyvLXKJOKIZNrxNsNYbPefoj-lKtJyS2KLE-1wLASoqY7d0tDv9hkB4NaCQ-7Ew0VdtvkMj9KKl2C4ZPFZWdL1aXHoxh0tpPsGU7YA-XCSf9f2PfTx-sEiG48QWouh2-3MJLRVsNtXOzN-wxYt-TTu',
  neoAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBoEYYQSMbODnSngSZmtSNuHShu-zlw5fO67lukpWgOSSoHJmkfJf4w7sYCmPCQ--Sa03FsmiBK9GDeamKUZvDQiQW1izJhVO4KJiIoIRm25ogQF7peCGTFjdSn3cybGZVecnXwuW18V1VGwyPIyzEaRVHuico3nAi6HHjpTqo3TWDNy4oaxGzGQck44w0AwjpjsupRDtPoyLHrjDN-3dl_Fxnk6-orvk6Zm5eHWkRSO9D67kZJfw-I',
  userIcon: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2FFOjGgVwMsJooo8-KwCpIqIcJJu_6581e_AqsL5Q2bdeQqbcgtCro45Qr9fYjw-neYnWjUH5ey8-7kFCA6VzAjNgLJBgAaXNu-L91qHLPxclN5IBH-p3RG5Mf3hqswZiKL8czPqzk7jtUs-0buRe4PvKxEXXzxau643o-uGfblNeGOpAvNmV_VwpliWI1XelfFmd4-1Zn8d7cNZ3sZF0_8irVwfABThH4TpVva9lOChhvsSL1vmh'
};

export const INITIAL_SEGMENTS: RoadSegment[] = [
  {
    id: 'seg-1',
    name: 'I-5 Northbound',
    roadCode: '8492-B',
    distance: '1.2 MILES',
    status: 'blocked',
    confidence: 94,
    confirms: 12,
    refutes: 1,
    updatedAt: '3 min ago',
    location: 'Seattle, WA',
    description: 'Multiple vehicles stalled in center lanes. Lane closure from Mercer to 45th.',
    photoUrl: ASSETS.trafficJamPhoto,
    notes: 'Right lane closed ahead due to emergency maintenance and barrier repair.',
    svgPath: 'M 120 700 C 140 550, 70 450, 180 250',
    nodeX: 45,
    nodeY: 42
  },
  {
    id: 'seg-2',
    name: 'Main St (between 5th & 6th)',
    roadCode: 'MAIN-506',
    distance: '0.4 MILES',
    status: 'blocked',
    confidence: 94,
    confirms: 12,
    refutes: 1,
    updatedAt: '3 min ago',
    location: 'Downtown Center',
    description: 'Fallen tree blocking intersection. Utility vehicles onsite.',
    photoUrl: ASSETS.trafficJamPhoto,
    notes: 'Impassable to all vehicular traffic. City crews dispatched.',
    svgPath: 'M 250,450 L 300,300 L 450,250',
    nodeX: 52,
    nodeY: 34
  },
  {
    id: 'seg-3',
    name: 'Downtown Ave & 4th',
    roadCode: 'DWTN-401',
    distance: '0.8 MILES',
    status: 'partial',
    confidence: 45,
    confirms: 5,
    refutes: 2,
    updatedAt: 'Yesterday',
    location: 'Financial District',
    description: 'Single lane open due to asphalt milling and utility conduit laying.',
    notes: 'Single lane or slow moving. Heavy delay during peak hours.',
    svgPath: 'M 60,320 Q 180,380 290,480',
    nodeX: 38,
    nodeY: 58
  },
  {
    id: 'seg-4',
    name: 'Bridge St Bypass',
    roadCode: 'BRDG-09',
    distance: '2.1 MILES',
    status: 'clear',
    confidence: 99,
    confirms: 24,
    refutes: 0,
    updatedAt: '3 Days ago',
    location: 'East River Connector',
    description: 'Former obstruction cleared. Smooth traffic flow standard speed.',
    photoUrl: ASSETS.clearDawnRoadPhoto,
    notes: 'Road open both ways. Normal flow verified by telemetry sensors.',
    svgPath: 'M 220 180 Q 290 280 340 380',
    nodeX: 72,
    nodeY: 28
  },
  {
    id: 'seg-5',
    name: 'Mercer St Exit',
    roadCode: 'MRC-88',
    distance: '0.6 MILES',
    status: 'partial',
    confidence: 76,
    confirms: 8,
    refutes: 1,
    updatedAt: '15 min ago',
    location: 'South Lake Union',
    description: 'Queue backing onto highway off-ramp. Signal timing adjustment underway.',
    notes: 'Moderate crawl, expect 8-10 min delay.',
    svgPath: 'M 100,500 L 250,450 L 300,300 L 450,250',
    nodeX: 28,
    nodeY: 74
  },
  {
    id: 'seg-6',
    name: 'Bellevue Way NE',
    roadCode: 'BLV-102',
    distance: '3.4 MILES',
    status: 'clear',
    confidence: 98,
    confirms: 31,
    refutes: 0,
    updatedAt: '1 hour ago',
    location: 'Bellevue, WA',
    description: 'Clear conditions across all arterial intersections.',
    notes: 'Standard flow and timing lights synchronized.',
    svgPath: 'M 50 780 Q 140 680 240 620',
    nodeX: 65,
    nodeY: 62
  }
];

export const INITIAL_USER_REPORTS: UserReport[] = [
  {
    id: 'rep-1',
    roadName: 'I-5 Northbound',
    segmentId: 'seg-1',
    status: 'blocked',
    confidence: 92,
    confirms: 12,
    refutes: 1,
    updatedAt: '2 hours ago',
    location: 'Seattle, WA',
    photoUrl: ASSETS.trafficJamPhoto,
    notes: 'Right lane closed ahead. Heavy bottleneck near the express lane merge.'
  },
  {
    id: 'rep-2',
    roadName: 'Downtown Ave & 4th',
    segmentId: 'seg-3',
    status: 'partial',
    confidence: 45,
    confirms: 5,
    refutes: 2,
    updatedAt: 'Yesterday',
    location: 'Seattle, WA',
    notes: 'Construction crew working on manhole in rightmost lane.'
  },
  {
    id: 'rep-3',
    roadName: 'Bridge St Bypass',
    segmentId: 'seg-4',
    status: 'clear',
    confidence: 99,
    confirms: 24,
    refutes: 0,
    updatedAt: '3 Days ago',
    location: 'Seattle, WA',
    photoUrl: ASSETS.clearDawnRoadPhoto,
    notes: 'Debris completely swept and all lanes reopened to full speed limit.'
  }
];

export const INITIAL_OFFLINE_MAPS: OfflineMapItem[] = [
  {
    id: 'map-sf',
    name: 'San Francisco',
    status: 'downloaded',
    size: '420MB',
    lastUpdated: 'Aug 2026'
  },
  {
    id: 'map-sea',
    name: 'Seattle',
    status: 'update_available',
    size: '180MB',
    lastUpdated: 'Jul 2026'
  },
  {
    id: 'map-pdx',
    name: 'Portland Metro',
    status: 'not_downloaded' as any,
    size: '260MB',
    lastUpdated: 'Available'
  },
  {
    id: 'map-van',
    name: 'Vancouver Corridor',
    status: 'not_downloaded' as any,
    size: '310MB',
    lastUpdated: 'Available'
  }
];

export const INITIAL_TRAFFIC_SETTINGS: TrafficSettingsState = {
  majorBlockages: true,
  minorDelays: false,
  speedCameras: true,
  visualStyle: 'high_contrast',
  show3dBuildings: true,
  showPois: false,
  showTrafficFlow: true,
  confidenceThreshold: 85,
  communityReports: true,
  sensorData: true,
  historicalTrends: false,
  minConfidenceLevel: 'High',
  notificationRadius: 15,
  segmentThickness: 3,
  showConfidenceBars: true,
  animateFlow: true
};

export const LEADERBOARD_USERS: LeaderboardUser[] = [
  {
    id: 'user-top-1',
    name: 'Sarah_Lens',
    rank: 1,
    reportsCount: 4210,
    trustScore: 99,
    tier: 'Supreme Guardian',
    avatarUrl: ASSETS.sarahAvatar
  },
  {
    id: 'user-top-2',
    name: 'Neo_Mapper',
    rank: 2,
    reportsCount: 3890,
    trustScore: 99,
    tier: 'Grand Scout',
    avatarUrl: ASSETS.neoAvatar
  },
  {
    id: 'user-top-3',
    name: 'Echo_Grid',
    rank: 3,
    reportsCount: 3542,
    trustScore: 98,
    tier: 'Pathfinder Core',
    avatarUrl: ''
  },
  {
    id: 'user-top-4',
    name: 'Kira_Vector',
    rank: 4,
    reportsCount: 2980,
    trustScore: 97,
    tier: 'Elite Observer',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-current',
    name: 'Alex_Vanguard',
    rank: 124,
    reportsCount: 1432,
    trustScore: 98,
    tier: 'Elite Observer',
    avatarUrl: ASSETS.alexAvatar,
    isCurrentUser: true
  }
];
