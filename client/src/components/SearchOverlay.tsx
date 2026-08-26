import React, { useMemo, useState } from 'react';
import { Search, ArrowLeft, Navigation, MapPin } from 'lucide-react';
import { INDIA_PLACES, type Place } from '../data/indiaPlaces';

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

  const places = useMemo(() => {
    let list = INDIA_PLACES;
    if (cityFilter !== 'All') {
      list = list.filter((p) => p.city === cityFilter);
    }
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.area.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
    );
  }, [query, cityFilter]);

  return (
    <div className="fixed inset-0 z-50 bg-[#10131b]/95 backdrop-blur-xl flex flex-col px-4 pt-4 pb-8 max-w-lg md:max-w-xl mx-auto overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={onClose}
          className="p-2.5 rounded-full bg-[#1d1f27] border border-[#424754] text-[#c2c6d7] hover:text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 flex items-center gap-2 rounded-2xl bg-[#1d1f27] border border-[#424754] px-3 py-2.5">
          <Search size={18} className="text-[#8b90a0]" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Delhi or Bangalore…"
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-[#6b7080]"
          />
        </div>
      </div>

      <p className="text-xs text-[#8b90a0] mb-2 px-1">
        Destinations · India MVP
      </p>

      <ul className="flex flex-col gap-1">
        {places.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onSelectDestination(p)}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-[#1d1f27] border border-transparent hover:border-[#424754] transition"
            >
              <div className="w-9 h-9 rounded-full bg-[#2a2f3a] flex items-center justify-center text-[#afc6ff]">
                <MapPin size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{p.name}</div>
                <div className="text-xs text-[#8b90a0]">
                  {p.area} · {p.city}
                </div>
              </div>
              <Navigation size={16} className="text-[#528dff] shrink-0" />
            </button>
          </li>
        ))}
        {places.length === 0 && (
          <li className="text-sm text-[#8b90a0] px-3 py-6 text-center">
            No matches. Try “AIIMS”, “Bellandur”, or “Airport”.
          </li>
        )}
      </ul>
    </div>
  );
};
