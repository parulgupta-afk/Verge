import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { INDIA_CENTER, INDIA_ZOOM, MAP_STYLE, STATUS_COLORS, CITY_CENTERS, CityKey } from '../lib/mapConfig';
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
}

export function MapView({
  segments = [],
  selectedSegmentId,
  onSegmentClick,
  initialCity,
  activeCity,
  className = '',
  routeGeometry = null,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map once
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const start = initialCity && CITY_CENTERS[initialCity]
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
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      'top-right'
    );

    map.on('load', () => {
      setMapReady(true);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [initialCity]);


  // Fly to city when activeCity changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !activeCity || !CITY_CENTERS[activeCity]) return;
    const { center, zoom } = CITY_CENTERS[activeCity];
    map.flyTo({ center, zoom, duration: 1200 });
  }, [activeCity, mapReady]);

    // Render / update road segments as a GeoJSON source
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

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

    if (map.getSource('road-segments')) {
      (map.getSource('road-segments') as maplibregl.GeoJSONSource).setData(geojson);
    } else {
      map.addSource('road-segments', {
        type: 'geojson',
        data: geojson,
      });

      // Casing (outline)
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

      // Main colored line
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
  }, [segments, mapReady, onSegmentClick]);

  // Draw / update active route
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

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

    if (map.getSource('active-route')) {
      (map.getSource('active-route') as maplibregl.GeoJSONSource).setData(data);
    } else if (routeGeometry) {
      map.addSource('active-route', { type: 'geojson', data });
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
    if (!map || !mapReady || !map.getLayer('road-segments-line')) return;

    if (selectedSegmentId) {
      map.setFilter('road-segments-line', ['==', ['get', 'id'], selectedSegmentId]);
      map.setFilter('road-segments-line', null);
    }
  }, [selectedSegmentId, mapReady]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 text-white z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2" />
            <p className="text-sm">Loading India map…</p>
          </div>
        </div>
      )}
    </div>
  );
}
