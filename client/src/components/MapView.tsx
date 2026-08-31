import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  INDIA_CENTER,
  INDIA_ZOOM,
  MAP_STYLE_URL,
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
  const isFallbackApplied = useRef(false);

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
      style: MAP_STYLE_URL,
      center: start.center,
      zoom: start.zoom,
      attributionControl: { compact: true },
    });

    const fallbackToOsm = () => {
      if (isFallbackApplied.current) return;
      isFallbackApplied.current = true;
      console.info('[Verge] Switching to standard OpenStreetMap raster tiles');
      try {
        map.setStyle(OSM_RASTER_STYLE as any);
      } catch (err) {
        console.warn('[Verge] Error setting fallback style:', err);
      }
    };

    // If OpenFreeMap vector style fails or hangs, switch to OSM
    const styleTimeout = setTimeout(() => {
      if (!map.isStyleLoaded()) {
        fallbackToOsm();
      }
    }, 4000);

    map.on('error', (e) => {
      const msg = String((e as any)?.error?.message || (e as any)?.message || '');
      if (msg.includes('style') || msg.includes('404') || msg.includes('Failed to fetch')) {
        fallbackToOsm();
      }
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
      clearTimeout(styleTimeout);
      setMapReady(true);
      map.resize();
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
      clearTimeout(styleTimeout);
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Fly to city when activeCity changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !activeCity || !CITY_CENTERS[activeCity]) return;
    const { center, zoom } = CITY_CENTERS[activeCity];
    map.flyTo({ center, zoom, duration: 1200 });
  }, [activeCity, mapReady]);

  // Render / update road segments as a GeoJSON source
  const updateSegmentsLayers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !map.isStyleLoaded()) return;

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: segments
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

    const source = map.getSource('road-segments') as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(geojson);
    } else {
      map.addSource('road-segments', {
        type: 'geojson',
        data: geojson,
      });

      // Casing (outline)
      if (!map.getLayer('road-segments-casing')) {
        map.addLayer({
          id: 'road-segments-casing',
          type: 'line',
          source: 'road-segments',
          paint: {
            'line-color': '#000000',
            'line-width': 7,
            'line-opacity': 0.25,
          },
        });
      }

      // Main colored line
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
            'line-width': [
              'interpolate',
              ['linear'],
              ['get', 'confidence'],
              0, 3,
              100, 6,
            ],
            'line-opacity': 0.9,
          },
        });

        // Click handler
        map.on('click', 'road-segments-line', (e) => {
          if (!e.features?.length || !onSegmentClick) return;
          const f = e.features[0];
          const id = f.properties?.id;
          const seg = segments.find((s) => s.id === id);
          if (seg) onSegmentClick(seg);
        });

        map.on('mouseenter', 'road-segments-line', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'road-segments-line', () => {
          map.getCanvas().style.cursor = '';
        });
      }
    }
  }, [segments, mapReady, onSegmentClick]);

  useEffect(() => {
    updateSegmentsLayers();
  }, [updateSegmentsLayers]);

  // Phase 8 heatmap styling
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !map.isStyleLoaded() || !map.getLayer('road-segments-line')) return;
    if (heatmapMode) {
      map.setPaintProperty('road-segments-line', 'line-width', [
        'interpolate',
        ['linear'],
        ['get', 'confidence'],
        0, 4,
        50, 8,
        100, 14,
      ]);
      map.setPaintProperty('road-segments-line', 'line-opacity', 0.95);
    } else {
      map.setPaintProperty('road-segments-line', 'line-width', [
        'interpolate',
        ['linear'],
        ['get', 'confidence'],
        0, 3,
        100, 6,
      ]);
      map.setPaintProperty('road-segments-line', 'line-opacity', 0.9);
    }
  }, [heatmapMode, mapReady, segments]);

  // Draw / update active route
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !map.isStyleLoaded()) return;

    const data: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: routeGeometry
        ? [
            {
              type: 'Feature',
              properties: {},
              geometry: routeGeometry,
            },
          ]
        : [],
    };

    const source = map.getSource('active-route') as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(data);
    } else if (routeGeometry) {
      map.addSource('active-route', { type: 'geojson', data });
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

    // Fit bounds when route appears
    if (routeGeometry?.coordinates?.length) {
      const bounds = new maplibregl.LngLatBounds();
      routeGeometry.coordinates.forEach((c) => bounds.extend(c as [number, number]));
      map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 800 });
    }
  }, [routeGeometry, mapReady]);

  // Highlight selected segment
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !map.isStyleLoaded() || !map.getLayer('road-segments-line')) return;

    if (selectedSegmentId) {
      map.setFilter('road-segments-line', ['==', ['get', 'id'], selectedSegmentId]);
      map.setFilter('road-segments-line', null);
    }
  }, [selectedSegmentId, mapReady]);

  return (
    <div className={`relative w-full h-full min-h-[300px] ${className}`}>
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs text-white z-10 pointer-events-none transition-opacity duration-300">
          <div className="text-center bg-slate-900/90 border border-slate-700 px-5 py-3 rounded-2xl shadow-2xl">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-400 border-t-transparent mx-auto mb-2" />
            <p className="text-xs text-slate-300 font-medium">Rendering India map…</p>
          </div>
        </div>
      )}
    </div>
  );
}

