import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  INDIA_CENTER,
  INDIA_ZOOM,
  MAP_STYLE,
  OSM_RASTER_STYLE,
  STATUS_COLORS,
  CITY_CENTERS,
  CityKey,
} from '../lib/mapConfig';
import type { RoadSegment } from '../types';

interface MapViewProps {
  segments?: RoadSegment[];
  selectedSegmentId?: string | null;
  onSegmentClick?: (segment: RoadSegment) => void;
  initialCity?: CityKey;
  /** When this changes, map flies to the city center */
  activeCity?: CityKey;
  className?: string;
  /** Active navigation route (GeoJSON LineString) */
  routeGeometry?: GeoJSON.LineString | null;
  /** Phase 8: exaggerate line width by confidence */
  heatmapMode?: boolean;
  /** Auto-request browser GPS and follow user */
  trackUser?: boolean;
  onUserLocation?: (pos: { lng: number; lat: number }) => void;
}

export function MapView({
  segments = [],
  selectedSegmentId,
  onSegmentClick,
  initialCity = 'delhi',
  activeCity = 'delhi',
  className = '',
  routeGeometry = null,
  heatmapMode = false,
  trackUser = true,
  onUserLocation,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Keep latest props in refs for event callbacks
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;
  const onSegmentClickRef = useRef(onSegmentClick);
  onSegmentClickRef.current = onSegmentClick;
  const routeGeometryRef = useRef(routeGeometry);
  routeGeometryRef.current = routeGeometry;
  const heatmapModeRef = useRef(heatmapMode);
  heatmapModeRef.current = heatmapMode;
  const selectedSegmentIdRef = useRef(selectedSegmentId);
  selectedSegmentIdRef.current = selectedSegmentId;

  // Unified function to sync segment & route layers to the map
  const syncLayers = useCallback((map: maplibregl.Map) => {
    if (!map || !map.isStyleLoaded()) return;

    const currentSegments = segmentsRef.current;
    const currentRoute = routeGeometryRef.current;
    const isHeatmap = heatmapModeRef.current;
    const selectedId = selectedSegmentIdRef.current;

    // 1. Road Segments GeoJSON
    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: currentSegments
        .filter((s) => s.geometry)
        .map((s) => ({
          type: 'Feature',
          id: s.id,
          properties: {
            id: s.id,
            name: s.name,
            status: s.status,
            confidence: s.confidence,
            confirms: s.confirms,
            refutes: s.refutes,
          },
          geometry: s.geometry as GeoJSON.LineString,
        })),
    };

    const segSource = map.getSource('road-segments') as maplibregl.GeoJSONSource | undefined;
    if (segSource) {
      segSource.setData(geojson);
    } else {
      map.addSource('road-segments', {
        type: 'geojson',
        data: geojson,
      });

      if (!map.getLayer('road-segments-casing')) {
        map.addLayer({
          id: 'road-segments-casing',
          type: 'line',
          source: 'road-segments',
          paint: {
            'line-color': '#000000',
            'line-width': isHeatmap ? 10 : 7,
            'line-opacity': 0.4,
          },
        });
      }

      if (!map.getLayer('road-segments-line')) {
        map.addLayer({
          id: 'road-segments-line',
          type: 'line',
          source: 'road-segments',
          paint: {
            'line-color': [
              'match',
              ['get', 'status'],
              'blocked', STATUS_COLORS.blocked,
              'partial', STATUS_COLORS.partial,
              'clear', STATUS_COLORS.clear,
              STATUS_COLORS.unknown,
            ],
            'line-width': isHeatmap
              ? ['interpolate', ['linear'], ['get', 'confidence'], 0, 4, 50, 8, 100, 14]
              : ['interpolate', ['linear'], ['get', 'confidence'], 0, 4, 100, 8],
            'line-opacity': isHeatmap ? 0.95 : 0.9,
          },
        });

        map.on('click', 'road-segments-line', (e) => {
          if (!e.features?.length || !onSegmentClickRef.current) return;
          const f = e.features[0];
          const id = f.properties?.id;
          const seg = segmentsRef.current.find((s) => s.id === id);
          if (seg) onSegmentClickRef.current(seg);
        });

        map.on('mouseenter', 'road-segments-line', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'road-segments-line', () => {
          map.getCanvas().style.cursor = '';
        });
      }
    }

    // 2. Active Route GeoJSON
    const routeData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: currentRoute
        ? [
            {
              type: 'Feature',
              properties: {},
              geometry: currentRoute,
            },
          ]
        : [],
    };

    const routeSource = map.getSource('active-route') as maplibregl.GeoJSONSource | undefined;
    if (routeSource) {
      routeSource.setData(routeData);
    } else if (currentRoute) {
      map.addSource('active-route', { type: 'geojson', data: routeData });
      if (!map.getLayer('active-route-casing')) {
        map.addLayer({
          id: 'active-route-casing',
          type: 'line',
          source: 'active-route',
          paint: {
            'line-color': '#1e3a8a',
            'line-width': 10,
            'line-opacity': 0.35,
          },
        });
      }
      if (!map.getLayer('active-route-line')) {
        map.addLayer({
          id: 'active-route-line',
          type: 'line',
          source: 'active-route',
          paint: {
            'line-color': '#3b82f6',
            'line-width': 5,
            'line-opacity': 0.95,
          },
        });
      }
    }

    // 3. Selection filter
    if (map.getLayer('road-segments-line')) {
      if (selectedId) {
        map.setFilter('road-segments-line', ['==', ['get', 'id'], selectedId]);
        map.setFilter('road-segments-line', null);
      }
    }
  }, []);

  // Initialize map once
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const start = activeCity && CITY_CENTERS[activeCity]
      ? CITY_CENTERS[activeCity]
      : initialCity && CITY_CENTERS[initialCity]
      ? CITY_CENTERS[initialCity]
      : { center: INDIA_CENTER, zoom: INDIA_ZOOM };

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE as any,
      center: start.center,
      zoom: start.zoom,
      attributionControl: { compact: true },
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    const geo = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showAccuracyCircle: true,
      showUserLocation: true,
    });
    map.addControl(geo, 'top-right');

    const handleReady = () => {
      setMapReady(true);
      map.resize();
      syncLayers(map);
      if (trackUser) {
        setTimeout(() => {
          try {
            geo.trigger();
          } catch {
            /* optional GPS */
          }
        }, 800);
      }
    };

    map.on('load', handleReady);
    map.on('styledata', () => {
      map.resize();
      if (map.isStyleLoaded()) {
        setMapReady(true);
        syncLayers(map);
      }
    });

    geo.on('geolocate', (e: any) => {
      const lng = e?.coords?.longitude;
      const lat = e?.coords?.latitude;
      if (typeof lng === 'number' && typeof lat === 'number' && onUserLocation) {
        onUserLocation({ lng, lat });
      }
    });

    mapRef.current = map;

    // ResizeObserver ensures canvas always fills container
    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(mapContainer.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [syncLayers]);

  // Fly to city when activeCity changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !activeCity || !CITY_CENTERS[activeCity]) return;
    const { center, zoom } = CITY_CENTERS[activeCity];
    map.flyTo({ center, zoom, duration: 1200 });
  }, [activeCity, mapReady]);

  // Re-sync layers whenever segments, route, heatmap, or selection changes
  useEffect(() => {
    if (mapRef.current && mapReady) {
      syncLayers(mapRef.current);
    }
  }, [segments, routeGeometry, heatmapMode, selectedSegmentId, mapReady, syncLayers]);

  // Fit bounds when route appears
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !routeGeometry?.coordinates?.length) return;
    const bounds = new maplibregl.LngLatBounds();
    routeGeometry.coordinates.forEach((c) => bounds.extend(c as [number, number]));
    map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 800 });
  }, [routeGeometry, mapReady]);

  return (
    <div className={`maplibre-map-root relative w-full h-full min-h-[300px] ${className}`}>
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
    </div>
  );
}

