import React, { useState } from 'react';
import { Layers, Crosshair, AlertTriangle, CheckCircle2, AlertOctagon, Plus, Minus, Compass, Info, Touchpad } from 'lucide-react';
import { RoadSegment, TrafficSettingsState } from '../types';
import { ASSETS } from '../data/mockData';

interface InteractiveMapProps {
  segments: RoadSegment[];
  selectedSegment: RoadSegment | null;
  onSelectSegment: (segment: RoadSegment) => void;
  onOpenReportFlow: (segment?: RoadSegment) => void;
  settings: TrafficSettingsState;
  isSelectionMode?: boolean;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  segments,
  selectedSegment,
  onSelectSegment,
  onOpenReportFlow,
  settings,
  isSelectionMode = false
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [activeLayer, setActiveLayer] = useState<'high_contrast' | 'satellite' | 'standard'>(settings.visualStyle);
  const [centerNotification, setCenterNotification] = useState<string | null>(null);

  const handleRecenter = () => {
    setZoomLevel(1);
    setCenterNotification('GPS Telemetry Locked • Seattle Urban Grid');
    setTimeout(() => setCenterNotification(null), 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'blocked':
        return { stroke: '#ffb4ab', fill: '#93000a', text: '#ffb4ab', glow: 'rgba(255, 180, 171, 0.6)' };
      case 'partial':
        return { stroke: '#ffb68f', fill: '#e96c16', text: '#ffb68f', glow: 'rgba(233, 108, 22, 0.6)' };
      case 'clear':
      default:
        return { stroke: '#40e56c', fill: '#02c953', text: '#40e56c', glow: 'rgba(64, 229, 108, 0.6)' };
    }
  };

  return (
    <div className="relative w-full h-full min-h-[580px] bg-[#000000] overflow-hidden select-none">
      {/* Map Tile & Imagery Layer */}
      <div className="absolute inset-0 z-0 map-grid-bg">
        <img
          src={ASSETS.satelliteMapMain}
          alt="Satellite Road Network"
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            activeLayer === 'satellite'
              ? 'opacity-80'
              : activeLayer === 'high_contrast'
              ? 'opacity-40 mix-blend-luminosity grayscale contrast-125'
              : 'opacity-55 mix-blend-multiply'
          }`}
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center', transition: 'transform 0.3s ease-out' }}
        />
        {/* Tonal gradient layer for deep black high contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#10131b]/60 via-[#10131b]/30 to-[#10131b]/80 pointer-events-none" />
      </div>

      {/* SVG Road Network & Segments Overlay */}
      <svg
        className="absolute inset-0 w-full h-full z-10 pointer-events-none"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 400 800"
      >
        <defs>
          <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Static Background Grid Road Network */}
        <path
          d="M 20 100 L 380 120 M 10 300 L 390 310 M 30 520 L 370 540 M 100 850 C 150 600, 50 400, 200 200 C 300 50, 250 -50, 250 -50"
          fill="none"
          stroke="#272a32"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="4 6"
        />

        {/* Dynamic Road Segments */}
        {segments.map((seg) => {
          const isSelected = selectedSegment?.id === seg.id;
          const colors = getStatusColor(seg.status);
          const thickness = isSelected ? 12 : (settings.segmentThickness * 2.2 + 2);

          return (
            <g key={seg.id} className="pointer-events-auto cursor-pointer" onClick={() => onSelectSegment(seg)}>
              {/* Outer Glow Halo if selected or blocked */}
              {(isSelected || seg.status === 'blocked') && (
                <path
                  d={seg.svgPath}
                  fill="none"
                  stroke={isSelected ? '#528dff' : colors.stroke}
                  strokeWidth={thickness + 8}
                  strokeLinecap="round"
                  opacity={isSelected ? 0.6 : 0.3}
                  className={settings.animateFlow ? 'animate-pulse' : ''}
                />
              )}

              {/* Main Colored Segment Line */}
              <path
                d={seg.svgPath}
                fill="none"
                stroke={isSelected ? '#afc6ff' : colors.stroke}
                strokeWidth={thickness}
                strokeLinecap="round"
                opacity={0.9}
                className="transition-all duration-200 hover:opacity-100"
              />

              {/* Segment Core Line (High Visibility White/Cyan inside) */}
              <path
                d={seg.svgPath}
                fill="none"
                stroke={isSelected ? '#ffffff' : (seg.status === 'clear' ? '#d9e2ff' : '#ffffff')}
                strokeWidth={isSelected ? 3.5 : 2}
                strokeLinecap="round"
              />
            </g>
          );
        })}
      </svg>

      {/* Segment Node Pins & Confidence Badges */}
      {segments.map((seg) => {
        const isSelected = selectedSegment?.id === seg.id;
        const colors = getStatusColor(seg.status);

        return (
          <div
            key={`node-${seg.id}`}
            onClick={() => onSelectSegment(seg)}
            style={{ top: `${seg.nodeY}%`, left: `${seg.nodeX}%` }}
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer group pointer-events-auto"
          >
            {/* Ripple Pulse on active or high priority */}
            {(isSelected || seg.status === 'blocked') && (
              <div
                className={`absolute inset-0 -m-3 w-10 h-10 rounded-full border ${
                  isSelected ? 'border-[#528dff] bg-[#528dff]/20' : 'border-[#ffb4ab] bg-[#ffb4ab]/20'
                } animate-ping`}
              />
            )}

            {/* Core Node Marker */}
            <div
              className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 transition-transform duration-200 group-hover:scale-110 shadow-lg ${
                isSelected
                  ? 'bg-[#528dff] border-white text-white shadow-[#528dff]/60'
                  : seg.status === 'blocked'
                  ? 'bg-[#10131b] border-[#ffb4ab] text-[#ffb4ab]'
                  : seg.status === 'partial'
                  ? 'bg-[#10131b] border-[#ffb68f] text-[#ffb68f]'
                  : 'bg-[#10131b] border-[#40e56c] text-[#40e56c]'
              }`}
            >
              {seg.status === 'blocked' ? (
                <AlertOctagon className="w-4 h-4" />
              ) : seg.status === 'partial' ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>

            {/* Floating Live Confidence Pill */}
            {settings.showConfidenceBars && (
              <div
                className={`absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider border backdrop-blur-md shadow-md flex items-center gap-1 transition-all ${
                  seg.status === 'blocked'
                    ? 'bg-[#ffb4ab]/10 border-[#ffb4ab]/60 text-[#ffb4ab]'
                    : seg.status === 'partial'
                    ? 'bg-[#ffb68f]/10 border-[#ffb68f]/60 text-[#ffb68f]'
                    : 'bg-[#40e56c]/10 border-[#40e56c]/60 text-[#40e56c]'
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: colors.stroke }}
                />
                <span>{seg.confidence}% CONFIRMED</span>
              </div>
            )}
          </div>
        );
      })}

      {/* Floating Mode Header: Select Segment instruction when in selection flow */}
      {isSelectionMode && (
        <header className="absolute top-14 left-0 w-full px-4 z-30 flex justify-center pointer-events-none">
          <div className="bg-[#272a32]/95 backdrop-blur-md border border-[#424754] rounded-full px-4 py-2 flex items-center gap-2 pointer-events-auto shadow-lg shadow-black/50">
            <Touchpad className="w-4 h-4 text-[#afc6ff]" />
            <span className="font-bold text-xs text-[#e1e2ed] uppercase tracking-wider">
              Tap any road segment to select
            </span>
          </div>
        </header>
      )}

      {/* GPS Recenter Notification Toast */}
      {centerNotification && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-[#1d1f27]/90 border border-[#528dff] text-[#afc6ff] px-4 py-1.5 rounded-full text-xs font-mono backdrop-blur-md shadow-xl flex items-center gap-2 animate-bounce">
          <Compass className="w-3.5 h-3.5" />
          <span>{centerNotification}</span>
        </div>
      )}

      {/* Map Control Buttons: Layers, Zoom, Recenter, Quick Report FAB */}
      <div className="absolute right-4 bottom-24 z-30 flex flex-col gap-2.5 items-end">
        {/* Layer Switcher Button */}
        <div className="relative group">
          <button
            id="btn-map-layer-toggle"
            onClick={() => {
              const nextLayer =
                activeLayer === 'high_contrast'
                  ? 'satellite'
                  : activeLayer === 'satellite'
                  ? 'standard'
                  : 'high_contrast';
              setActiveLayer(nextLayer);
            }}
            className="w-11 h-11 rounded-xl bg-[#272a32]/90 hover:bg-[#32353d] border border-[#424754] text-[#e1e2ed] flex items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer"
            title={`Current Style: ${activeLayer}`}
          >
            <Layers className="w-5 h-5 text-[#afc6ff]" />
          </button>
        </div>

        {/* GPS Recenter */}
        <button
          id="btn-map-recenter"
          onClick={handleRecenter}
          className="w-11 h-11 rounded-xl bg-[#272a32]/90 hover:bg-[#32353d] border border-[#424754] text-[#e1e2ed] flex items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer"
          title="Recenter Map (Lock GPS)"
        >
          <Crosshair className="w-5 h-5 text-[#afc6ff]" />
        </button>

        {/* Zoom Controls */}
        <div className="flex flex-col rounded-xl bg-[#272a32]/90 border border-[#424754] overflow-hidden shadow-lg">
          <button
            onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.5))}
            className="w-11 h-9 hover:bg-[#32353d] text-[#e1e2ed] flex items-center justify-center transition-colors cursor-pointer border-b border-[#424754]/50"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
            className="w-11 h-9 hover:bg-[#32353d] text-[#e1e2ed] flex items-center justify-center transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* High-Contrast "REPORT" Action Pill Button */}
        <button
          id="btn-map-report-hazard"
          onClick={() => onOpenReportFlow(selectedSegment || undefined)}
          className="mt-2 bg-[#528dff] hover:bg-[#afc6ff] text-[#00275f] hover:text-[#001944] font-bold text-xs sm:text-sm px-4 py-3 rounded-xl shadow-[0_4px_20px_rgba(82,141,255,0.4)] flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
        >
          <AlertTriangle className="w-4 h-4 fill-current" />
          <span className="tracking-wider uppercase">REPORT</span>
        </button>
      </div>
    </div>
  );
};
