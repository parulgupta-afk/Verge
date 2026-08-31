import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Navigation, MapPin, LocateFixed, Loader2 } from 'lucide-react';
import { INDIA_PLACES, type Place } from '../data/indiaPlaces';
import { searchPlaces, hitToPlace, type GeocodeHit } from '../lib/geocode';

interface Props {
  cityFilter: 'Delhi' | 'Bangalore' | 'All';
  userLocation: { lng: number; lat: number } | null;
  onClose: () => void;
  onPlan: (from: Place | 'gps', to: Place) => void;
}

type Field = 'from' | 'to';

export function RoutePlanner({ cityFilter, userLocation, onClose, onPlan }: Props) {
  const seeded = useMemo(() => {
    let list = INDIA_PLACES;
    if (cityFilter !== 'All') list = list.filter((p) => p.city === cityFilter);
    return list;
  }, [cityFilter]);

  const [fromMode, setFromMode] = useState<'gps' | 'place'>(userLocation ? 'gps' : 'place');
  const [fromPlace, setFromPlace] = useState<Place | null>(seeded[0] || null);
  const [toPlace, setToPlace] = useState<Place | null>(seeded[1] || seeded[0] || null);
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [activeField, setActiveField] = useState<Field>('to');
  const [suggestions, setSuggestions] = useState<GeocodeHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const seededMatches = useMemo(() => {
    const q = (activeField === 'from' ? fromQuery : toQuery).trim().toLowerCase();
    if (!q) return seeded.slice(0, 6);
    return seeded
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.area.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [seeded, fromQuery, toQuery, activeField]);

  useEffect(() => {
    const q = (activeField === 'from' ? fromQuery : toQuery).trim();
    if (q.length < 2) {
      setSuggestions([]);
      setSearchError(null);
      return;
    }
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      setSearchError(null);
      try {
        const hits = await searchPlaces(q, { limit: 8, signal: ac.signal });
        if (!ac.signal.aborted) setSuggestions(hits);
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          setSearchError('Search unavailable — try a quick pick below or check network.');
          setSuggestions([]);
        }
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [fromQuery, toQuery, activeField]);

  const pickSeeded = (p: Place) => {
    if (activeField === 'from') {
      setFromMode('place');
      setFromPlace(p);
      setFromQuery(p.name);
    } else {
      setToPlace(p);
      setToQuery(p.name);
    }
    setSuggestions([]);
  };

  const pickHit = (hit: GeocodeHit) => {
    const p = hitToPlace(hit);
    if (activeField === 'from') {
      setFromMode('place');
      setFromPlace(p);
      setFromQuery(hit.displayName);
    } else {
      setToPlace(p);
      setToQuery(hit.displayName);
    }
    setSuggestions([]);
  };

  const canGo =
    Boolean(toPlace) && (fromMode === 'gps' ? Boolean(userLocation) : Boolean(fromPlace));

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 max-h-[80vh] overflow-y-auto rounded-t-2xl border border-slate-600 bg-slate-950/95 shadow-2xl">
      <div className="sticky top-0 flex items-center justify-between border-b border-slate-700 bg-slate-950/95 px-4 py-3">
        <div>
          <div className="text-sm font-semibold text-white">Plan route · From → To</div>
          <div className="text-xs text-slate-400">Type any place in India — suggestions as you type</div>
        </div>
        <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-800">
          <X size={18} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label className="text-[10px] uppercase text-slate-500 font-medium">From</label>
          <button
            type="button"
            onClick={() => {
              setFromMode('gps');
              setActiveField('from');
            }}
            className={`mt-1 w-full flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm ${
              fromMode === 'gps'
                ? 'border-blue-500 bg-blue-500/15 text-white'
                : 'border-slate-700 bg-slate-900 text-slate-300'
            }`}
          >
            <LocateFixed size={16} className="text-blue-400 shrink-0" />
            <div className="min-w-0">
              <div className="font-medium">My current location</div>
              <div className="text-[10px] text-slate-500 truncate">
                {userLocation
                  ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
                  : 'Allow location permission first'}
              </div>
            </div>
          </button>
          <input
            value={fromQuery}
            onChange={(e) => {
              setFromQuery(e.target.value);
              setFromMode('place');
              setActiveField('from');
            }}
            onFocus={() => setActiveField('from')}
            placeholder="Or search a start place…"
            className="mt-2 w-full rounded-xl bg-slate-900 border border-slate-600 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
          />
          {fromPlace && fromMode === 'place' && (
            <div className="mt-1 text-[10px] text-emerald-400/90 truncate">
              Selected: {fromPlace.name} ({fromPlace.city})
            </div>
          )}
        </div>

        <div>
          <label className="text-[10px] uppercase text-slate-500 font-medium">To</label>
          <div className="relative mt-1">
            <input
              value={toQuery}
              onChange={(e) => {
                setToQuery(e.target.value);
                setActiveField('to');
              }}
              onFocus={() => setActiveField('to')}
              placeholder="Type destination — e.g. Koramangala, India Gate…"
              className="w-full rounded-xl bg-slate-900 border border-slate-600 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
              autoFocus
            />
            {loading && (
              <Loader2 size={16} className="absolute right-3 top-3 animate-spin text-slate-400" />
            )}
            {toPlace && (
              <div className="mt-1 text-[10px] text-emerald-400/90 truncate">
                Selected: {toPlace.name} · {toPlace.area}
              </div>
            )}
          </div>
        </div>

        {searchError && <p className="text-xs text-amber-400">{searchError}</p>}

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 max-h-48 overflow-y-auto">
          {suggestions.length > 0 && (
            <div className="px-2 py-1 text-[10px] uppercase text-slate-500">Search results (India)</div>
          )}
          {suggestions.map((hit) => (
            <button
              key={hit.id}
              type="button"
              onClick={() => pickHit(hit)}
              className="w-full flex items-start gap-2 px-3 py-2 text-left text-sm hover:bg-slate-800 border-b border-slate-800/80"
            >
              <Navigation size={14} className="text-emerald-500 mt-1 shrink-0" />
              <div className="min-w-0">
                <div className="text-white font-medium truncate">{hit.name}</div>
                <div className="text-[10px] text-slate-500 truncate">{hit.displayName}</div>
              </div>
            </button>
          ))}
          {seededMatches.length > 0 && (
            <div className="px-2 py-1 text-[10px] uppercase text-slate-500">Quick picks</div>
          )}
          {seededMatches.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => pickSeeded(p)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-800 text-slate-300"
            >
              <MapPin size={14} className="text-slate-500 shrink-0" />
              <span className="truncate">
                {p.name} · {p.area}
              </span>
            </button>
          ))}
          {!loading &&
            suggestions.length === 0 &&
            seededMatches.length === 0 &&
            (fromQuery.length >= 2 || toQuery.length >= 2) && (
              <p className="text-xs text-slate-500 p-3">No matches — try a fuller name or area.</p>
            )}
        </div>

        <button
          type="button"
          disabled={!canGo}
          onClick={() => {
            if (!toPlace) return;
            if (fromMode === 'gps') onPlan('gps', toPlace);
            else if (fromPlace) onPlan(fromPlace, toPlace);
          }}
          className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          Calculate route
        </button>
      </div>
    </div>
  );
}
