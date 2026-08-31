import React from 'react';
import { MapPin } from 'lucide-react';

type Alert = {
  id: string;
  name: string;
  status: string;
  confidence: number;
  km: number;
};

interface Props {
  alerts: Alert[];
  onSelect: (id: string) => void;
}

/** First notify: issues near the user, not whole-India noise. */
export function NearMeStrip({ alerts, onSelect }: Props) {
  if (!alerts.length) return null;
  return (
    <div className="absolute top-[7.5rem] left-3 right-3 z-20 pointer-events-none">
      <div className="pointer-events-auto max-w-md rounded-2xl border border-slate-600/70 bg-slate-950/90 backdrop-blur-md shadow-xl overflow-hidden">
        <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-slate-800">
          <MapPin size={12} className="text-blue-400" />
          Near you · confidence first
        </div>
        <div className="flex gap-2 overflow-x-auto px-2 py-2 no-scrollbar">
          {alerts.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onSelect(a.id)}
              className={`shrink-0 rounded-xl border px-3 py-2 text-left min-w-[140px] ${
                a.status === 'blocked'
                  ? 'border-red-500/40 bg-red-950/40'
                  : 'border-amber-500/35 bg-amber-950/30'
              }`}
            >
              <div className="text-xs font-semibold text-white truncate max-w-[160px]">{a.name}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {a.km} km · {a.confidence}% · {a.status}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
