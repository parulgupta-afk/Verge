import React from 'react';
import { X, AlertTriangle, Info, Siren } from 'lucide-react';
import type { OfficialNotice } from '../data/officialFeeds';

interface Props {
  notices: OfficialNotice[];
  cityLabel: string;
  emergencyMode: boolean;
  onToggleEmergency: () => void;
  onClose: () => void;
}

const severityStyle = {
  info: 'border-slate-600 bg-slate-800/80',
  warning: 'border-amber-500/50 bg-amber-950/40',
  critical: 'border-red-500/50 bg-red-950/40',
};

export function OfficialFeedsPanel({
  notices,
  cityLabel,
  emergencyMode,
  onToggleEmergency,
  onClose,
}: Props) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-30 max-h-[55vh] overflow-y-auto rounded-t-2xl border border-slate-600 bg-slate-950/95 shadow-2xl">
      <div className="sticky top-0 flex items-center justify-between border-b border-slate-700 bg-slate-950/95 px-4 py-3">
        <div>
          <div className="text-sm font-semibold text-white">Civic & official feeds</div>
          <div className="text-xs text-slate-400">{cityLabel} · demo notices</div>
        </div>
        <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-800">
          <X size={18} />
        </button>
      </div>

      <div className="px-4 py-3 border-b border-slate-800">
        <button
          type="button"
          onClick={onToggleEmergency}
          className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
            emergencyMode
              ? 'border-red-500 bg-red-500/20 text-red-100'
              : 'border-slate-600 bg-slate-900 text-slate-200'
          }`}
        >
          <Siren size={20} className={emergencyMode ? 'text-red-400' : 'text-slate-400'} />
          <div className="flex-1">
            <div className="text-sm font-semibold">Emergency priority mode</div>
            <div className="text-xs opacity-80">
              {emergencyMode
                ? 'On — prefer routes that avoid high-risk segments near hospitals'
                : 'Off — standard risk weighting'}
            </div>
          </div>
        </button>
      </div>

      <ul className="flex flex-col gap-2 p-4">
        {notices.length === 0 && (
          <li className="text-sm text-slate-500 text-center py-6">No official notices for this city.</li>
        )}
        {notices.map((n) => (
          <li
            key={n.id}
            className={`rounded-xl border px-3 py-3 ${severityStyle[n.severity]}`}
          >
            <div className="flex items-start gap-2">
              {n.severity === 'info' ? (
                <Info size={16} className="mt-0.5 text-slate-300 shrink-0" />
              ) : (
                <AlertTriangle
                  size={16}
                  className={`mt-0.5 shrink-0 ${
                    n.severity === 'critical' ? 'text-red-400' : 'text-amber-400'
                  }`}
                />
              )}
              <div>
                <div className="text-sm font-medium text-white">{n.title}</div>
                <div className="text-xs text-slate-300 mt-1 leading-relaxed">{n.body}</div>
                <div className="text-[10px] text-slate-500 mt-2">
                  {n.source} · {n.updatedAt}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
