import React, { useState, useEffect } from 'react';
import {
  AppScreen,
  RoadSegment,
  UserReport,
  OfflineMapItem,
  TrafficSettingsState,
  ReportStatus
} from './types';
import {
  INITIAL_USER_REPORTS,
  INITIAL_OFFLINE_MAPS,
  INITIAL_TRAFFIC_SETTINGS
} from './data/mockData';
import { type Place } from './data/indiaPlaces';
import { initVoices } from './lib/routing';
import { ensureAnonymousAuth } from './lib/auth';
import { WelcomeScreen } from './components/WelcomeScreen';
import { NavigationHeader } from './components/NavigationHeader';
import { BottomNavBar } from './components/BottomNavBar';
import { MapView } from './components/MapView';
import type { CityKey } from './lib/mapConfig';
import { SegmentDetailSheet } from './components/SegmentDetailSheet';
import { ReportFlowModal } from './components/ReportFlowModal';
import { ActiveNavigationScreen } from './components/ActiveNavigationScreen';
import { ReportsHistoryScreen } from './components/ReportsHistoryScreen';
import { TrafficSettingsScreen } from './components/TrafficSettingsScreen';
import { OfflineMapsScreen } from './components/OfflineMapsScreen';
import { SearchOverlay } from './components/SearchOverlay';
import { LeaderboardScreen } from './components/LeaderboardScreen';
import { StatusUpdateModal } from './components/StatusUpdateModal';
import { OfficialFeedsPanel } from './components/OfficialFeedsPanel';
import { SocialPanel } from './components/SocialPanel';
import { AdminDashboard } from './components/AdminDashboard';
import { RoutePlanner } from './components/RoutePlanner';
import { computeAdminStats } from './lib/adminStats';
import {
  loadCommutes,
  rememberDestination,
  removeCommute,
  shareToClipboard,
  decodeShare,
  placeFromShare,
  type SavedCommute,
} from './lib/commute';
import { OFFICIAL_NOTICES } from './data/officialFeeds';
import { useSegments } from './hooks/useSegments';
import { useRouting } from './hooks/useRouting';
import { checkMediaEvidence } from './services/mediaVerification';

export default function App() {
  // Navigation screen state
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('welcome');

  const [activeCity, setActiveCity] = useState<CityKey>('delhi');
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [showOfficialFeeds, setShowOfficialFeeds] = useState(false);
  const [showSocial, setShowSocial] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [heatmapMode, setHeatmapMode] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lng: number; lat: number } | null>(null);
  const [showRoutePlanner, setShowRoutePlanner] = useState(false);
  const [commutes, setCommutes] = useState<SavedCommute[]>(() => loadCommutes());
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // Extracted: segments + offline + realtime
  const {
    segments,
    setSegments,
    dataSource,
    offlineBanner,
    confirm: confirmSegment,
    refute: refuteSegment,
    report: reportSegment,
  } = useSegments();

  // Extracted: routing + risk ranking
  const {
    activeRoute,
    routeDestination,
    
    rerouteMessage,
    setRerouteMessage,
    isRouting,
    runRouteCalculation,
    navigateToPlace,
    startDemoNavigation,
    clearRoute,
  } = useRouting({
    segments,
    userLocation,
    emergencyMode,
    onCommutesChange: setCommutes,
  });
  

  // Selected road segment
  const [selectedSegment, setSelectedSegment] = useState<RoadSegment | null>(null);

  // User submitted reports
  const [reports, setReports] = useState<UserReport[]>(() => {
    const saved = localStorage.getItem('verge_reports');
    return saved ? JSON.parse(saved) : INITIAL_USER_REPORTS;
  });

  // Offline maps data
  const [offlineMaps, setOfflineMaps] = useState<OfflineMapItem[]>(() => {
    const saved = localStorage.getItem('verge_offline_maps');
    return saved ? JSON.parse(saved) : INITIAL_OFFLINE_MAPS;
  });

  // Traffic & UI settings
  const [settings, setSettings] = useState<TrafficSettingsState>(() => {
    const saved = localStorage.getItem('verge_settings');
    return saved ? JSON.parse(saved) : INITIAL_TRAFFIC_SETTINGS;
  });

  // Modals state
  const [isReportFlowOpen, setIsReportFlowOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [statusUpdateTarget, setStatusUpdateTarget] = useState<{
    segmentId: string;
    segmentName: string;
    status: ReportStatus;
  } | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('verge_reports', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem('verge_offline_maps', JSON.stringify(offlineMaps));
  }, [offlineMaps]);

  useEffect(() => {
    localStorage.setItem('verge_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    initVoices();
    ensureAnonymousAuth();
  }, []);

  // segments load + realtime: useSegments()

  const handleConfirmSegment = (segmentId: string) => {
    confirmSegment(segmentId, userLocation);
  };

  const handleRefuteSegment = (segmentId: string) => {
    refuteSegment(segmentId, userLocation);
  };

  // routing: useRouting() — navigateToPlace, runRouteCalculation, clearRoute, etc.

  // Handle creating a new report
  const handleCreateReport = (
    newReportData: Omit<UserReport, 'id' | 'updatedAt' | 'confirms' | 'refutes'>
  ) => {
    const newReport: UserReport = {
      ...newReportData,
      id: `rep-${Date.now()}`,
      updatedAt: 'Just now',
      confirms: 1,
      refutes: 0
    };

    setReports((prev) => [newReport, ...prev]);

    // Also update corresponding segment condition
    setSegments((prev) =>
      prev.map((s) =>
        s.id === newReportData.segmentId
          ? {
              ...s,
              status: newReportData.status,
              updatedAt: 'Just now',
              photoUrl: newReportData.photoUrl || s.photoUrl,
              notes: newReportData.notes || s.notes,
              confirms: s.confirms + 1,
              confidence: newReportData.status === 'clear' ? 99 : newReportData.status === 'blocked' ? 94 : 65
            }
          : s
      )
    );

    // Persist to Supabase when configured
    void (async () => {
      let mediaVerified: boolean | null = null;
      if (newReportData.photoUrl) {
        const check = await checkMediaEvidence({
          mediaUrl: newReportData.photoUrl,
          type: newReportData.status,
        });
        mediaVerified = check.verified;
        if (check.verified === null) {
          console.info('[Verge] Media evidence: stored only —', check.note);
        }
      }
      reportSegment({
        segmentId: newReportData.segmentId,
        type: newReportData.status,
        notes: newReportData.notes,
        mediaUrl: newReportData.photoUrl,
        location: userLocation,
      });
      void mediaVerified;
    })();
  };

  // Handle updating segment condition directly from modal
  const handleDirectConditionUpdate = (newStatus: ReportStatus, note?: string) => {
    if (!statusUpdateTarget) return;

    setSegments((prev) =>
      prev.map((s) =>
        s.id === statusUpdateTarget.segmentId
          ? {
              ...s,
              status: newStatus,
              updatedAt: 'Just now',
              notes: note || s.notes,
              confidence: newStatus === 'clear' ? 98 : newStatus === 'blocked' ? 95 : 60
            }
          : s
      )
    );

    // Update in user reports as well if exists
    setReports((prev) =>
      prev.map((r) =>
        r.segmentId === statusUpdateTarget.segmentId
          ? {
              ...r,
              status: newStatus,
              updatedAt: 'Just now',
              notes: note || r.notes
            }
          : r
      )
    );

    setStatusUpdateTarget(null);
  };

  // Delete report
  const handleDeleteReport = (reportId: string) => {
    setReports((prev) => prev.filter((r) => r.id !== reportId));
  };

  // Offline maps actions
  const handleDownloadNewMap = (name: string, size: string) => {
    const newMap: OfflineMapItem = {
      id: `map-${Date.now()}`,
      name,
      size,
      status: 'downloaded',
      lastUpdated: 'Just now'
    };
    setOfflineMaps((prev) => [newMap, ...prev]);
  };

  const handleDeleteOfflineMap = (id: string) => {
    setOfflineMaps((prev) => prev.filter((m) => m.id !== id));
  };

  const handleUpdateOfflineMap = (id: string) => {
    setOfflineMaps((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, status: 'downloaded', lastUpdated: 'Just now' } : m
      )
    );
  };

  // Jump to segment on map from another screen
  const handleJumpToSegment = (segmentId: string) => {
    const target = segments.find((s) => s.id === segmentId) || segments[0];
    setSelectedSegment(target);
    setCurrentScreen('map');
  };

  return (
    <div className="min-h-screen bg-[#10131b] text-[#e1e2ed] flex flex-col antialiased relative">
      {/* 1. WELCOME SCREEN */}
      {currentScreen === 'welcome' && (
        <WelcomeScreen
          onGetStarted={() => setCurrentScreen('map')}
          onSignIn={() => setCurrentScreen('map')}
        />
      )}

      {/* 2. MAIN MAP SCREEN */}
      {currentScreen === 'map' && (
        <div className="relative w-full h-screen overflow-hidden flex flex-col">
          {/* Top App Bar Navigation */}
          <NavigationHeader
            onSearchClick={() => setIsSearchOpen(true)}
            onOfflineMapsClick={() => setCurrentScreen('offline_maps')}
            onProfileClick={() => setCurrentScreen('leaderboard')}
            onStartNavigationClick={() => {
              startDemoNavigation();
            }}
          />

          {/* Main Map Viewport — real MapLibre map (India) */}
          <main className="flex-1 w-full h-full relative">
            <MapView
              segments={segments.filter(
                (s) =>
                  !s.city ||
                  s.city.toLowerCase() === activeCity ||
                  (activeCity === 'delhi' && s.city === 'Delhi') ||
                  (activeCity === 'bangalore' && s.city === 'Bangalore')
              )}
              selectedSegmentId={selectedSegment?.id}
              onSegmentClick={(seg) => setSelectedSegment(seg)}
              initialCity={activeCity}
              activeCity={activeCity}
              className="w-full h-full"
              routeGeometry={activeRoute?.geometry ?? null}
              heatmapMode={heatmapMode}
              trackUser={true}
              onUserLocation={(pos) => setUserLocation(pos)}
            />

            {/* Data source indicator */}
            <div className="absolute top-16 right-3 z-20 flex flex-col items-end gap-1">
              <div className="rounded-full bg-slate-900/90 border border-slate-600 px-3 py-1.5 text-[10px] font-medium text-slate-300 shadow-lg">
                {dataSource === 'supabase' ? '● Live · Supabase' : '○ Local seed'}
                {emergencyMode ? ' · 🚨 Emergency' : ''}
              </div>
              {offlineBanner && (
                <div className="rounded-lg bg-amber-950/90 border border-amber-600/50 px-3 py-1.5 text-[10px] text-amber-100 max-w-[200px] shadow-lg">
                  {offlineBanner}
                </div>
              )}
            </div>

            {/* City switcher */}
            <div className="absolute top-16 left-3 z-20 flex gap-1 rounded-full bg-slate-900/90 border border-slate-600 p-1 shadow-lg">
              {([
                ['delhi', 'Delhi'],
                ['bangalore', 'Bangalore'],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setActiveCity(key);
                    clearRoute();
                    setSelectedSegment(null);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                    activeCity === key
                      ? 'bg-blue-500 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Reroute / route status banner */}
            {(rerouteMessage || isRouting) && (
              <div className="absolute top-16 left-3 right-3 z-20 rounded-xl bg-slate-900/95 border border-slate-700 px-4 py-3 shadow-lg">
                <p className="text-sm text-white leading-snug">
                  {isRouting ? 'Calculating route…' : rerouteMessage}
                </p>
                {activeRoute && !isRouting && (
                  <button
                    type="button"
                    onClick={clearRoute}
                    className="mt-2 text-xs text-slate-400 underline"
                  >
                    Clear route
                  </button>
                )}
              </div>
            )}

            {/* Floating actions */}
            {!selectedSegment && (
              <div className="absolute bottom-24 right-4 z-20 flex flex-col gap-2 items-end">
                {activeRoute && (
                  <button
                    type="button"
                    onClick={() => setCurrentScreen('navigation')}
                    className="flex items-center gap-2 rounded-full bg-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-600 active:scale-95 transition"
                  >
                    Start navigation
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowRoutePlanner(true)}
                  className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-emerald-500 active:scale-95 transition"
                >
                  Directions
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdmin(true)}
                  className="flex items-center gap-2 rounded-full bg-violet-700 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-violet-600 active:scale-95 transition"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => setShowSocial(true)}
                  className="flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-indigo-500 active:scale-95 transition"
                >
                  Social
                </button>
                <button
                  type="button"
                  onClick={() => setShowOfficialFeeds(true)}
                  className="flex items-center gap-2 rounded-full bg-slate-700 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-slate-600 active:scale-95 transition"
                >
                  Civic
                </button>
                <button
                  type="button"
                  onClick={() => setIsReportFlowOpen(true)}
                  className="flex items-center gap-2 rounded-full bg-red-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/30 hover:bg-red-600 active:scale-95 transition"
                >
                  Report
                </button>
              </div>
            )}

            {showOfficialFeeds && (
              <OfficialFeedsPanel
                notices={OFFICIAL_NOTICES.filter((n) =>
                  activeCity === 'delhi' ? n.city === 'Delhi' : n.city === 'Bangalore'
                )}
                cityLabel={activeCity === 'delhi' ? 'Delhi-NCR' : 'Bangalore'}
                emergencyMode={emergencyMode}
                onToggleEmergency={() => setEmergencyMode((v) => !v)}
                onClose={() => setShowOfficialFeeds(false)}
              />
            )}

            {showSocial && (
              <SocialPanel
                commutes={commutes}
                onClose={() => {
                  setShowSocial(false);
                  setShareFeedback(null);
                }}
                onNavigate={(c) => {
                  setShowSocial(false);
                  if (c.place.city === 'Delhi') setActiveCity('delhi');
                  if (c.place.city === 'Bangalore') setActiveCity('bangalore');
                  navigateToPlace(c.place);
                }}
                onRemove={(id) => setCommutes(removeCommute(id))}
                canShare={Boolean(routeDestination)}
                shareFeedback={shareFeedback}
                onShareCurrent={async () => {
                  if (!routeDestination) return;
                  try {
                    await shareToClipboard(routeDestination);
                    setShareFeedback('Copied share code to clipboard');
                  } catch {
                    setShareFeedback('Could not copy — try again');
                  }
                }}
                onJoinCode={(code) => {
                  const payload = decodeShare(code);
                  if (!payload) {
                    setShareFeedback('Invalid share code');
                    return;
                  }
                  const place = placeFromShare(payload);
                  setShowSocial(false);
                  setShareFeedback(null);
                  if (place.city === 'Delhi') setActiveCity('delhi');
                  if (place.city === 'Bangalore') setActiveCity('bangalore');
                  navigateToPlace(place);
                }}
              />
            )}


            {showRoutePlanner && (
              <RoutePlanner
                cityFilter={activeCity === 'delhi' ? 'Delhi' : activeCity === 'bangalore' ? 'Bangalore' : 'All'}
                userLocation={userLocation}
                onClose={() => setShowRoutePlanner(false)}
                onPlan={async (from, to) => {
                  setShowRoutePlanner(false);
                  if (to.city === 'Delhi') setActiveCity('delhi');
                  if (to.city === 'Bangalore') setActiveCity('bangalore');
                  if (from === 'gps') {
                    if (!userLocation) {
                      setRerouteMessage('Enable location permission to route from where you are.');
                      return;
                    }
                    await runRouteCalculation(userLocation, to, 'Your location');
                  } else {
                    await runRouteCalculation(
                      { lng: from.lng, lat: from.lat },
                      to,
                      from.name
                    );
                  }
                }}
              />
            )}

            {showAdmin && (
              <AdminDashboard
                stats={computeAdminStats(segments)}
                segments={segments}
                heatmapOn={heatmapMode}
                onToggleHeatmap={() => setHeatmapMode((v) => !v)}
                onClose={() => setShowAdmin(false)}
                onSelectSegment={(id) => {
                  const seg = segments.find((s) => s.id === id);
                  if (seg) {
                    setSelectedSegment(seg);
                    setShowAdmin(false);
                  }
                }}
              />
            )}


            {/* Selected Segment Detail Bottom Sheet */}
            {selectedSegment && (
              <SegmentDetailSheet
                segment={selectedSegment}
                onClose={() => setSelectedSegment(null)}
                onConfirm={handleConfirmSegment}
                onRefute={handleRefuteSegment}
                onReportUpdate={(seg) => {
                  setStatusUpdateTarget({
                    segmentId: seg.id,
                    segmentName: seg.name,
                    status: seg.status === 'unknown' ? 'blocked' : seg.status
                  });
                }}
                onNextStep={() => {
                  setIsReportFlowOpen(true);
                }}
              />
            )}
          </main>

          {/* Bottom Nav Bar (hidden when bottom sheet is expanded) */}
          {!selectedSegment && (
            <BottomNavBar
              currentScreen={currentScreen}
              onNavigate={(screen) => setCurrentScreen(screen)}
              onQuickReport={() => setIsReportFlowOpen(true)}
            />
          )}
        </div>
      )}

      {/* 3. ACTIVE TURN-BY-TURN NAVIGATION SCREEN */}
      {currentScreen === 'navigation' && (
        <ActiveNavigationScreen
          onExit={() => {
            clearRoute();
            setCurrentScreen('map');
          }}
          onOpenSettings={() => setCurrentScreen('traffic_settings')}
          onOpenReport={() => setIsReportFlowOpen(true)}
          routeSummary={
            activeRoute
              ? {
                  destinationName: routeDestination?.name || 'Destination',
                  durationText: activeRoute.durationText,
                  distanceText: activeRoute.distanceText,
                  rerouteMessage,
                  steps: activeRoute.steps?.map((s) => ({
                    instruction: s.instruction,
                    name: s.name,
                    distanceText: s.distanceText,
                  })),
                }
              : null
          }
        />
      )}

      {/* 4. REPORTS HISTORY SCREEN */}
      {currentScreen === 'reports_history' && (
        <div className="relative min-h-screen flex flex-col">
          <ReportsHistoryScreen
            reports={reports}
            onBack={() => setCurrentScreen('map')}
            onViewOnMap={handleJumpToSegment}
            onUpdateStatus={(rep) => {
              setStatusUpdateTarget({
                segmentId: rep.segmentId,
                segmentName: rep.roadName,
                status: rep.status
              });
            }}
            onDeleteReport={handleDeleteReport}
            onAddNewReport={() => setIsReportFlowOpen(true)}
          />
          <BottomNavBar
            currentScreen={currentScreen}
            onNavigate={(screen) => setCurrentScreen(screen)}
            onQuickReport={() => setIsReportFlowOpen(true)}
          />
        </div>
      )}

      {/* 5. TRAFFIC SETTINGS SCREEN */}
      {currentScreen === 'traffic_settings' && (
        <div className="relative min-h-screen flex flex-col">
          <TrafficSettingsScreen
            settings={settings}
            onUpdateSettings={(newSettings) =>
              setSettings((prev) => ({ ...prev, ...newSettings }))
            }
            onBack={() => setCurrentScreen('map')}
            onOpenOfflineMaps={() => setCurrentScreen('offline_maps')}
          />
          <BottomNavBar
            currentScreen={currentScreen}
            onNavigate={(screen) => setCurrentScreen(screen)}
            onQuickReport={() => setIsReportFlowOpen(true)}
          />
        </div>
      )}

      {/* 6. OFFLINE MAPS SCREEN */}
      {currentScreen === 'offline_maps' && (
        <div className="relative min-h-screen flex flex-col">
          <OfflineMapsScreen
            maps={offlineMaps}
            onBack={() => setCurrentScreen('map')}
            onDownloadNew={handleDownloadNewMap}
            onDeleteMap={handleDeleteOfflineMap}
            onUpdateMap={handleUpdateOfflineMap}
          />
          <BottomNavBar
            currentScreen={currentScreen}
            onNavigate={(screen) => setCurrentScreen(screen)}
            onQuickReport={() => setIsReportFlowOpen(true)}
          />
        </div>
      )}

      {/* 7. COMMUNITY LEADERBOARD & PROFILE SCREEN */}
      {currentScreen === 'leaderboard' && (
        <div className="relative min-h-screen flex flex-col">
          <LeaderboardScreen onBack={() => setCurrentScreen('map')} />
          <BottomNavBar
            currentScreen={currentScreen}
            onNavigate={(screen) => setCurrentScreen(screen)}
            onQuickReport={() => setIsReportFlowOpen(true)}
          />
        </div>
      )}

      {/* MODAL 1: Multi-step Report Flow Modal */}
      {isReportFlowOpen && (
        <ReportFlowModal
          initialSegment={selectedSegment}
          allSegments={segments}
          onClose={() => setIsReportFlowOpen(false)}
          onSubmitReport={handleCreateReport}
        />
      )}

      {/* MODAL 2: Search Overlay */}
      {isSearchOpen && (
        <SearchOverlay
          onClose={() => setIsSearchOpen(false)}
          cityFilter={activeCity === 'delhi' ? 'Delhi' : activeCity === 'bangalore' ? 'Bangalore' : 'All'}
          onSelectDestination={(place) => {
            setIsSearchOpen(false);
            setCurrentScreen('map');
            if (place.city === 'Delhi') setActiveCity('delhi');
            if (place.city === 'Bangalore') setActiveCity('bangalore');
            navigateToPlace(place);
          }}
        />
      )}

      {/* MODAL 3: Direct Status Update Modal */}
      {statusUpdateTarget && (
        <StatusUpdateModal
          segmentName={statusUpdateTarget.segmentName}
          currentStatus={statusUpdateTarget.status}
          onClose={() => setStatusUpdateTarget(null)}
          onConfirmUpdate={handleDirectConditionUpdate}
        />
      )}
    </div>
  );
}
