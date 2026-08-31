import { useState, useEffect, useCallback } from 'react';
import type { Place } from '../data/indiaPlaces';
import { INDIA_PLACES, DEFAULT_ORIGIN_DELHI, DEFAULT_ORIGIN_BLR } from '../data/indiaPlaces';
import type { RoadSegment } from '../types';
import {
  fetchRoute,
  fetchRouteAlternatives,
  routeIntersectsBlocked,
  buildRerouteExplanation,
  speak,
  type RouteResult,
} from '../lib/routing';
import { scoreRoute, rankRoutes, buildComparisonSummary } from '../lib/risk';
import { rememberDestination, type SavedCommute } from '../lib/commute';

type LatLng = { lng: number; lat: number };

/**
 * Route calculation, risk ranking, blockage re-check, speech.
 * Extracted from App.tsx for separation of concerns.
 */
export function useRouting(opts: {
  segments: RoadSegment[];
  userLocation: LatLng | null;
  emergencyMode: boolean;
  onCommutesChange?: (c: SavedCommute[]) => void;
}) {
  const { segments, userLocation, emergencyMode, onCommutesChange } = opts;

  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null);
  const [routeDestination, setRouteDestination] = useState<Place | null>(null);
  const [rerouteMessage, setRerouteMessage] = useState<string | null>(null);
  const [isRouting, setIsRouting] = useState(false);

  const resolveOriginForCity = useCallback(
    (city: string) => {
      if (userLocation) return userLocation;
      return city === 'Bangalore' ? DEFAULT_ORIGIN_BLR : DEFAULT_ORIGIN_DELHI;
    },
    [userLocation]
  );

  const runRouteCalculation = useCallback(
    async (origin: LatLng, place: Place, fromLabel?: string) => {
      setIsRouting(true);
      setRerouteMessage(null);
      setRouteDestination(place);
      const next = rememberDestination(place);
      onCommutesChange?.(next);

      const dest = { lng: place.lng, lat: place.lat };
      let routes = await fetchRouteAlternatives(origin, dest);
      if (!routes.length) {
        const single = await fetchRoute(origin, dest);
        if (single) routes = [single];
      }
      setIsRouting(false);

      if (!routes.length) {
        setRerouteMessage('Could not calculate route. Check network and try again.');
        return;
      }

      const labels = ['Route A', 'Route B', 'Route C'];
      const scoringSegments = emergencyMode
        ? segments.map((s) =>
            s.status === 'blocked' || s.status === 'partial'
              ? { ...s, confidence: Math.min(100, s.confidence + 25) }
              : s
          )
        : segments;
      const scored = routes.map((r, i) =>
        scoreRoute(r, scoringSegments, labels[i] || `Route ${i + 1}`)
      );
      const ranked = rankRoutes(scored);
      const best = ranked[0];
      setActiveRoute(best.route);

      const summary = buildComparisonSummary(ranked);
      const fromText = fromLabel || (userLocation ? 'Your location' : 'Start');
      setRerouteMessage(
        `From ${fromText} → ${place.name} · ${best.route.durationText} · ${best.route.distanceText}. ${summary}`
      );

      if (best.intersectsBlockage) {
        speak(
          buildRerouteExplanation({
            segmentName: best.blockageName,
            newDurationText: best.route.durationText,
          })
        );
      } else {
        speak(
          `Route from ${fromText} to ${place.name}. About ${best.route.durationText}, ${best.route.distanceText}.`
        );
      }
    },
    [segments, emergencyMode, userLocation, onCommutesChange]
  );

  const navigateToPlace = useCallback(
    async (place: Place) => {
      const origin = resolveOriginForCity(place.city);
      await runRouteCalculation(
        origin,
        place,
        userLocation ? 'Your location' : undefined
      );
    },
    [resolveOriginForCity, runRouteCalculation, userLocation]
  );

  const startDemoNavigation = useCallback(() => {
    const dest = INDIA_PLACES.find((p) => p.id === 'del-iit') || INDIA_PLACES[0];
    navigateToPlace(dest);
  }, [navigateToPlace]);

  const clearRoute = useCallback(() => {
    setActiveRoute(null);
    setRerouteMessage(null);
    setRouteDestination(null);
  }, []);

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

  return {
    activeRoute,
    routeDestination,
    rerouteMessage,
    setRerouteMessage,
    isRouting,
    runRouteCalculation,
    navigateToPlace,
    startDemoNavigation,
    clearRoute,
  };
}
