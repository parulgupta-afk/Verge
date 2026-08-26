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
import { INDIA_SEED_SEGMENTS } from './data/indiaSeedSegments';
import { INDIA_PLACES, DEFAULT_ORIGIN_DELHI, DEFAULT_ORIGIN_BLR, type Place } from './data/indiaPlaces';
import { fetchSegments, voteOnSegment, submitReport, subscribeToSegments } from './lib/segmentsApi';
import {
  fetchRoute,
  routeIntersectsBlocked,
  buildRerouteExplanation,
  speak,
  type RouteResult,
} from './lib/routing';
import { isSupabaseConfigured } from './lib/supabase';
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

export default function App() {
  // Navigation screen state
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('welcome');

  // Road segments — India seed first, then hydrate from Supabase if configured
  const [segments, setSegments] = useState<RoadSegment[]>(INDIA_SEED_SEGMENTS);
  const [dataSource, setDataSource] = useState<'local' | 'supabase'>('local');
  const [activeCity, setActiveCity] = useState<CityKey>('delhi');

  // V1 routing state
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null);
  const [rerouteMessage, setRerouteMessage] = useState<string | null>(null);
  const [isRouting, setIsRouting] = useState(false);

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
    localStorage.setItem('verge_segments_india', JSON.stringify(segments));
  }, [segments]);

  useEffect(() => {
    localStorage.setItem('verge_reports', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem('verge_offline_maps', JSON.stringify(offlineMaps));
  }, [offlineMaps]);

  useEffect(() => {
    localStorage.setItem('verge_settings', JSON.stringify(settings));
  }, [settings]);

  // Load segments from Supabase when configured; subscribe to realtime updates
  useEffect(() => {
    let unsub = () => {};
    (async () => {
      const data = await fetchSegments();
      setSegments(data);
      setDataSource(isSupabaseConfigured ? 'supabase' : 'local');
    })();

    if (isSupabaseConfigured) {
      unsub = subscribeToSegments((updated) => {
        setSegments((prev) => {
          const idx = prev.findIndex((s) => s.id === updated.id);
          if (idx === -1) return [...prev, updated];
          const next = [...prev];
          next[idx] = updated;
          return next;
        });
        setSelectedSegment((cur) => (cur?.id === updated.id ? updated : cur));
      });
    }
    return () => unsub();
  }, []);

  // Handle voting on a segment (client-side preview of confidence formula)
  const recalcConfidence = (confirms: number, refutes: number) => {
    const base = confirms / (confirms + refutes + 1);
    return Math.round(Math.min(100, Math.max(0, base * 100)) * 10) / 10;
  };

  const handleConfirmSegment = (segmentId: string) => {
    // Optimistic local update
    setSegments((prev) =>
      prev.map((s) => {
        if (s.id !== segmentId) return s;
        const confirms = s.confirms + 1;
        const confidence = recalcConfidence(confirms, s.refutes);
        const status =
          confidence >= 70 && confirms > s.refutes
            ? 'blocked'
            : confidence >= 40
              ? 'partial'
              : s.status === 'unknown'
                ? 'partial'
                : s.status;
        return {
          ...s,
          confirms,
          confidence,
          status: status as ReportStatus,
          updatedAt: 'Just now',
        };
      })
    );
    // Persist when Supabase is configured
    voteOnSegment(segmentId, 'confirm');
  };

  const handleRefuteSegment = (segmentId: string) => {
    setSegments((prev) =>
      prev.map((s) => {
        if (s.id !== segmentId) return s;
        const refutes = s.refutes + 1;
        const confidence = recalcConfidence(s.confirms, refutes);
        return {
          ...s,
          refutes,
          confidence,
          updatedAt: 'Just now',
        };
      })
    );
    voteOnSegment(segmentId, 'refute');
  };


  // ——— V1 Routing (OSRM) ———
  const [routeDestination, setRouteDestination] = useState<Place | null>(null);

  const navigateToPlace = async (place: Place) => {
    setIsRouting(true);
    setRerouteMessage(null);
    setRouteDestination(place);
    const origin =
      place.city === 'Bangalore' ? DEFAULT_ORIGIN_BLR : DEFAULT_ORIGIN_DELHI;
    const route = await fetchRoute(origin, { lng: place.lng, lat: place.lat });
    setIsRouting(false);
    if (!route) {
      setRerouteMessage('Could not calculate route. Check network and try again.');
      return;
    }
    setActiveRoute(route);

    const { hit, segmentName } = routeIntersectsBlocked(route.geometry, segments);
    if (hit) {
      const msg = buildRerouteExplanation({
        segmentName,
        newDurationText: route.durationText,
      });
      setRerouteMessage(msg);
      speak(msg);
    } else {
      setRerouteMessage(
        `To ${place.name} · ${route.durationText} · ${route.distanceText}`
      );
    }
  };

  const startDemoNavigation = () => {
    // Default demo: CP → IIT Delhi area (often hits south ORR reports)
    const dest = INDIA_PLACES.find((p) => p.id === 'del-iit') || INDIA_PLACES[0];
    navigateToPlace(dest);
  };

  const clearRoute = () => {
    setActiveRoute(null);
    setRerouteMessage(null);
    setRouteDestination(null);
  };

  // Re-check route when segments change (e.g. new blockage)
  useEffect(() => {
    if (!activeRoute) return;
    const { hit, segmentName } = routeIntersectsBlocked(activeRoute.geometry, segments);
    if (hit) {
      const msg = buildRerouteExplanation({
        segmentName,
        oldDurationText: activeRoute.durationText,
        newDurationText: activeRoute.durationText,
      });
      setRerouteMessage(msg);
      speak(msg);
    }
  }, [segments]); // eslint-disable-line react-hooks/exhaustive-deps

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
    submitReport({
      segmentId: newReportData.segmentId,
      type: newReportData.status,
      notes: newReportData.notes,
      mediaUrl: newReportData.photoUrl,
    });
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
            />

            {/* Data source indicator */}
            <div className="absolute top-16 right-3 z-20 rounded-full bg-slate-900/90 border border-slate-600 px-3 py-1.5 text-[10px] font-medium text-slate-300 shadow-lg">
              {dataSource === 'supabase' ? '● Live · Supabase' : '○ Local seed'}
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
                  onClick={() => setIsReportFlowOpen(true)}
                  className="flex items-center gap-2 rounded-full bg-red-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/30 hover:bg-red-600 active:scale-95 transition"
                >
                  Report
                </button>
              </div>
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
