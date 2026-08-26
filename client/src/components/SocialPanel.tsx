import React, { useState } from 'react';
import { X, Star, Share2, Trash2, Users, Navigation } from 'lucide-react';
import type { SavedCommute } from '../lib/commute';

interface Props {
  commutes: SavedCommute[];
  onClose: () => void;
  onNavigate: (commute: SavedCommute) => void;
  onRemove: (id: string) => void;
  onShareCurrent: () => void;
  canShare: boolean;
  onJoinCode: (code: string) => void;
  shareFeedback: string | null;
}

export function SocialPanel({
  commutes,
  onClose,
  onNavigate,
  onRemove,
  onShareCurrent,
  canShare,
  onJoinCode,
  shareFeedback,
}: Props) {
  const [joinCode, setJoinCode] = useState('');

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 max-h-[60vh] overflow-y-auto rounded-t-2xl border border-slate-600 bg-slate-950/95 shadow-2xl">
      <div className="sticky top-0 flex items-center justify-between border-b border-slate-700 bg-slate-950/95 px-4 py-3">
        <div>
          <div className="text-sm font-semibold text-white flex items-center gap-2">
            <Users size={16} /> Social & commutes
          </div>
          <div className="text-xs text-slate-400">Saved places · share route</div>
        </div>
        <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-800">
          <X size={18} />
        </button>
      </div>

      <div className="p-4 border-b border-slate-800 space-y-2">
        <button
          type="button"
          disabled={!canShare}
          onClick={onShareCurrent}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          <Share2 size={16} />
          Share current destination
        </button>
        {shareFeedback && (
          <p className="text-xs text-emerald-400 text-center">{shareFeedback}</p>
        )}
        <div className="flex gap-2">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Paste share code to join…"
            className="flex-1 rounded-xl bg-slate-900 border border-slate-600 px-3 py-2 text-xs text-white outline-none"
          />
          <button
            type="button"
            onClick={() => {
              if (joinCode.trim()) onJoinCode(joinCode.trim());
            }}
            className="rounded-xl bg-slate-700 px-3 py-2 text-xs font-semibold text-white"
          >
            Join
          </button>
        </div>
      </div>

      <div className="px-4 pt-3 pb-1 text-xs text-slate-500 font-medium">Your frequent destinations</div>
      <ul className="flex flex-col gap-1 px-4 pb-6">
        {commutes.length === 0 && (
          <li className="text-sm text-slate-500 text-center py-8">
            Search and navigate to places — they appear here automatically.
          </li>
        )}
        {commutes.map((c) => (
          <li
            key={c.id}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2.5"
          >
            <Star size={14} className="text-amber-400 shrink-0" />
            <button
              type="button"
              className="flex-1 text-left min-w-0"
              onClick={() => onNavigate(c)}
            >
              <div className="text-sm text-white truncate">{c.label}</div>
              <div className="text-[10px] text-slate-500">
                {c.place.city} · used {c.useCount}×
              </div>
            </button>
            <button
              type="button"
              onClick={() => onNavigate(c)}
              className="p-2 rounded-lg text-blue-400 hover:bg-slate-800"
              title="Navigate"
            >
              <Navigation size={16} />
            </button>
            <button
              type="button"
              onClick={() => onRemove(c.id)}
              className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800"
              title="Remove"
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
