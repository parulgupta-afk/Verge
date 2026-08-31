import React, { useState } from 'react';
import {
  Navigation2,
  AlertTriangle,
  MoreHorizontal,
  Shield,
  Users,
  Landmark,
  Siren,
  X,
} from 'lucide-react';

interface Props {
  hasActiveRoute: boolean;
  emergencyMode: boolean;
  onDirections: () => void;
  onStartNav: () => void;
  onReport: () => void;
  onAdmin: () => void;
  onSocial: () => void;
  onCivic: () => void;
  onToggleEmergency: () => void;
}

/**
 * Verge map actions — hierarchy, not a Google-style control wall.
 * Primary: Directions / Start · Secondary: Report · Overflow: Admin/Social/Civic/Emergency
 */
export function MapActionRail({
  hasActiveRoute,
  emergencyMode,
  onDirections,
  onStartNav,
  onReport,
  onAdmin,
  onSocial,
  onCivic,
  onToggleEmergency,
}: Props) {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="absolute bottom-24 right-3 z-20 flex flex-col items-end gap-2 pointer-events-none">
      {moreOpen && (
        <div className="pointer-events-auto mb-1 w-44 rounded-2xl border border-slate-600/80 bg-slate-950/95 backdrop-blur-md shadow-2xl overflow-hidden">
          <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
            More · not navigation clutter
          </div>
          <button
            type="button"
            onClick={() => {
              onCivic();
              setMoreOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-200 hover:bg-slate-800"
          >
            <Landmark size={16} className="text-slate-400" /> Civic feeds
          </button>
          <button
            type="button"
            onClick={() => {
              onSocial();
              setMoreOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-200 hover:bg-slate-800"
          >
            <Users size={16} className="text-indigo-400" /> Social
          </button>
          <button
            type="button"
            onClick={() => {
              onAdmin();
              setMoreOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-200 hover:bg-slate-800"
          >
            <Shield size={16} className="text-violet-400" /> Admin
          </button>
          <button
            type="button"
            onClick={() => {
              onToggleEmergency();
              setMoreOpen(false);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-slate-800 ${
              emergencyMode ? 'text-amber-300' : 'text-slate-200'
            }`}
          >
            <Siren size={16} /> {emergencyMode ? 'Exit emergency weight' : 'Emergency weight'}
          </button>
          <button
            type="button"
            onClick={() => setMoreOpen(false)}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-500 hover:bg-slate-800 border-t border-slate-800"
          >
            <X size={14} /> Close
          </button>
        </div>
      )}

      <div className="pointer-events-auto flex flex-col items-end gap-2">
        {hasActiveRoute && (
          <button
            type="button"
            onClick={onStartNav}
            className="flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500 active:scale-[0.98] transition"
          >
            <Navigation2 size={18} />
            Start
          </button>
        )}
        <button
          type="button"
          onClick={onDirections}
          className="flex items-center gap-2 rounded-2xl bg-emerald-600/95 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 hover:bg-emerald-500 active:scale-[0.98] transition border border-emerald-400/20"
        >
          <Navigation2 size={18} />
          Directions
        </button>
        <button
          type="button"
          onClick={onReport}
          className="flex items-center gap-2 rounded-2xl bg-red-600/95 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-900/30 hover:bg-red-500 active:scale-[0.98] transition border border-red-400/20"
        >
          <AlertTriangle size={18} />
          Report
        </button>
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          className="flex items-center justify-center w-11 h-11 rounded-2xl bg-slate-900/90 border border-slate-600 text-slate-200 shadow-lg hover:bg-slate-800 active:scale-[0.98] transition"
          title="More"
          aria-label="More actions"
        >
          <MoreHorizontal size={20} />
        </button>
      </div>
    </div>
  );
}
