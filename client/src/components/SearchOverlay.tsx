import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, ArrowLeft, Navigation, MapPin, Loader2 } from 'lucide-react';
import { INDIA_PLACES, type Place } from '../data/indiaPlaces';
import { searchPlaces, hitToPlace, type GeocodeHit } from '../lib/geocode';

interface SearchOverlayProps {
  onClose: () => void;
  onSelectDestination: (place: Place) => void;
  cityFilter?: 'Delhi' | 'Bangalore' | 'All';
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
  onClose,
  onSelectDestination,
  cityFilter = 'All',
}) => {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<GeocodeHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const seeded = useMemo(() => {
    let list = INDIA_PLACES;
    if (cityFilter !== 'All') list = list.filter((p) => p.city === cityFilter);
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.area.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
    );
  }, [query, cityFilter]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      setError(null);
      return;
    }
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      setError(null);
      try {
        const results = await searchPlaces(q, { limit: 10, signal: ac.signal });
        if (!ac.signal.aborted) setHits(results);
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          setError('Live search failed — showing quick picks only.');
          setHits([]);
        }
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query]);

  return (
    <div className="fixed inset-0 z-50 bg-[#10131b]/95 backdrop-blur-xl flex flex-col px-4 pt-4 pb-8 max-w-lg md:max-w-xl mx-auto overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={onClose}
          className="p-2.5 rounded-full bg-[#1d1f27] border border-[#424754] text-[#c2c6d7] hover:text-white"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any place in India…"
            className="w-full rounded-full bg-[#1d1f27] border border-[#424754] pl-10 pr-10 py-2.5 text-sm text-white outline-none focus:border-blue-500"
            autoFocus
          />
          {loading && (
            <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
          )}
        </div>
      </div>

      <p className="text-[11px] text-slate-500 mb-2 px-1">
        Type to get suggestions (OpenStreetMap). Quick picks work offline.
      </p>
      {error && <p className="text-xs text-amber-400 mb-2 px-1">{error}</p>}

      {hits.length > 0 && (
        <div className="mb-4">
          <div className="text-[10px] uppercase text-slate-500 font-medium mb-1 px-1">Suggestions</div>
          <ul className="space-y-1">
            {hits.map((hit) => (
              <li key={hit.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelectDestination(hitToPlace(hit));
                    onClose();
                  }}
                  className="w-full flex items-start gap-3 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-left hover:border-blue-500"
                >
                  <Navigation size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm text-white font-medium truncate">{hit.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{hit.displayName}</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-[10px] uppercase text-slate-500 font-medium mb-1 px-1">Quick picks</div>
      <ul className="space-y-1">
        {seeded.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => {
                onSelectDestination(p);
                onClose();
              }}
              className="w-full flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2.5 text-left hover:border-slate-600"
            >
              <MapPin size={16} className="text-slate-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm text-slate-200 truncate">{p.name}</div>
                <div className="text-[11px] text-slate-500">
                  {p.area} · {p.city}
                </div>
              </div>
            </button>
          </li>
        ))}
        {seeded.length === 0 && query.length > 0 && hits.length === 0 && !loading && (
          <li className="text-sm text-slate-500 text-center py-6">No matches</li>
        )}
      </ul>
    </div>
  );
};
