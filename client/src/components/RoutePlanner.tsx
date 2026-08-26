import React, { useMemo, useState } from 'react';
import { X, Navigation, MapPin, LocateFixed } from 'lucide-react';
import { INDIA_PLACES, type Place } from '../data/indiaPlaces';

interface Props {
  cityFilter: 'Delhi' | 'Bangalore' | 'All';
  userLocation: { lng: number; lat: number } | null;
  onClose: () => void;
  onPlan: (from: Place | 'gps', to: Place) => void;
}

export function RoutePlanner({ cityFilter, userLocation, onClose, onPlan }: Props) {
  const places = useMemo(() => {
    let list = INDIA_PLACES;
    if (cityFilter !== 'All') list = list.filter((p) => p.city === cityFilter);
    return list;
  }, [cityFilter]);

  const [fromId, setFromId] = useState<string>(userLocation ? '__gps__' : places[0]?.id || '');
  const [toId, setToId] = useState<string>(places[1]?.id || places[0]?.id || '');
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return places;
    return places.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.area.toLowerCase().includes(s) ||
        p.city.toLowerCase().includes(s)
    );
  }, [places, q]);

  const canGo = Boolean(toId) && (fromId === '__gps__' ? Boolean(userLocation) : Boolean(fromId));

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 max-h-[75vh] overflow-y-auto rounded-t-2xl border border-slate-600 bg-slate-950/95 shadow-2xl">
      <div className="sticky top-0 flex items-center justify-between border-b border-slate-700 bg-slate-950/95 px-4 py-3">
        <div>
          <div className="text-sm font-semibold text-white">Plan route · From → To</div>
          <div className="text-xs text-slate-400">Pick start and destination</div>
        </div>
        <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-800">
          <X size={18} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label className="text-[10px] uppercase text-slate-500 font-medium">From</label>
          <div className="mt-1 space-y-1">
            <button
              type="button"
              onClick={() => setFromId('__gps__')}
              className={`w-full flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm ${
                fromId === '__gps__'
                  ? 'border-blue-500 bg-blue-500/15 text-white'
                  : 'border-slate-700 bg-slate-900 text-slate-300'
              }`}
            >
              <LocateFixed size={16} className="text-blue-400" />
              <div>
                <div className="font-medium">My current location</div>
                <div className="text-[10px] text-slate-500">
                  {userLocation
                    ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
                    : 'Waiting for GPS — allow location permission'}
                </div>
              </div>
            </button>
            {filtered.map((p) => (
              <button
                key={`from-${p.id}`}
                type="button"
                onClick={() => setFromId(p.id)}
                className={`w-full flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm ${
                  fromId === p.id
                    ? 'border-blue-500 bg-blue-500/15 text-white'
                    : 'border-slate-800 bg-slate-900/60 text-slate-300'
                }`}
              >
                <MapPin size={14} className="text-slate-500" />
                <span className="truncate">
                  {p.name} · {p.area}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase text-slate-500 font-medium">To</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter destinations…"
            className="mt-1 mb-2 w-full rounded-xl bg-slate-900 border border-slate-600 px-3 py-2 text-sm text-white outline-none"
          />
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {filtered.map((p) => (
              <button
                key={`to-${p.id}`}
                type="button"
                onClick={() => setToId(p.id)}
                className={`w-full flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm ${
                  toId === p.id
                    ? 'border-emerald-500 bg-emerald-500/15 text-white'
                    : 'border-slate-800 bg-slate-900/60 text-slate-300'
                }`}
              >
                <Navigation size={14} className="text-emerald-500" />
                <span className="truncate">
                  {p.name} · {p.city}
                </span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          disabled={!canGo}
          onClick={() => {
            const to = places.find((p) => p.id === toId);
            if (!to) return;
            if (fromId === '__gps__') {
              onPlan('gps', to);
            } else {
              const from = places.find((p) => p.id === fromId);
              if (from) onPlan(from, to);
            }
          }}
          className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          Calculate route
        </button>
      </div>
    </div>
  );
}
