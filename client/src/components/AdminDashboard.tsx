import React from 'react';
import { X, LayoutDashboard, AlertTriangle } from 'lucide-react';
import type { AdminStats } from '../lib/adminStats';
import type { RoadSegment } from '../types';
import { STATUS_COLORS } from '../lib/mapConfig';

interface Props {
  stats: AdminStats;
  segments: RoadSegment[];
  heatmapOn: boolean;
  onToggleHeatmap: () => void;
  onClose: () => void;
  onSelectSegment?: (id: string) => void;
}

export function AdminDashboard({
  stats,
  segments,
  heatmapOn,
  onToggleHeatmap,
  onClose,
  onSelectSegment,
}: Props) {
  const maxRisk = Math.max(1, ...stats.topRisky.map((r) => r.risk));

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 max-h-[70vh] overflow-y-auto rounded-t-2xl border border-slate-600 bg-slate-950/95 shadow-2xl">
      <div className="sticky top-0 flex items-center justify-between border-b border-slate-700 bg-slate-950/95 px-4 py-3">
        <div>
          <div className="text-sm font-semibold text-white flex items-center gap-2">
            <LayoutDashboard size={16} /> Admin dashboard
          </div>
          <div className="text-xs text-slate-400">Live snapshot of road confidence</div>
        </div>
        <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-800">
          <X size={18} />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4">
        {[
          { label: 'Segments', value: stats.total, color: 'text-white' },
          { label: 'Blocked', value: stats.blocked, color: 'text-red-400' },
          { label: 'Partial', value: stats.partial, color: 'text-amber-400' },
          { label: 'Clear', value: stats.clear, color: 'text-emerald-400' },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-3">
            <div className="text-[10px] text-slate-500 uppercase tracking-wide">{c.label}</div>
            <div className={`text-xl font-bold ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="px-4 pb-2 flex flex-wrap gap-3 text-xs text-slate-400">
        <span>Avg confidence: <strong className="text-white">{stats.avgConfidence}%</strong></span>
        <span>High risk: <strong className="text-amber-300">{stats.highRisk}</strong></span>
        {Object.entries(stats.byCity).map(([city, n]) => (
          <span key={city}>
            {city}: <strong className="text-white">{n}</strong>
          </span>
        ))}
      </div>

      <div className="px-4 py-3 border-y border-slate-800">
        <button
          type="button"
          onClick={onToggleHeatmap}
          className={`w-full rounded-xl px-3 py-2.5 text-sm font-semibold ${
            heatmapOn
              ? 'bg-orange-600 text-white'
              : 'bg-slate-800 text-slate-200 border border-slate-600'
          }`}
        >
          {heatmapOn ? 'Heatmap on — tap again to turn off' : 'Show risk heatmap on map'}
        </button>
        <p className="text-[10px] text-slate-500 mt-2">
          Heatmap thickens and intensifies colors by blockage probability (Phase 5 risk model).
        </p>
      </div>

      <div className="px-4 pt-3 pb-1 text-xs text-slate-500 font-medium flex items-center gap-1">
        <AlertTriangle size={12} /> Top risky segments
      </div>
      <ul className="px-4 pb-6 space-y-2">
        {stats.topRisky.map((r) => (
          <li key={r.name + r.city}>
            <button
              type="button"
              className="w-full text-left rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 hover:border-slate-500"
              onClick={() => {
                const seg = segments.find((s) => s.name === r.name);
                if (seg && onSelectSegment) onSelectSegment(seg.id);
              }}
            >
              <div className="flex justify-between text-sm text-white">
                <span className="truncate pr-2">{r.name}</span>
                <span className="text-xs text-slate-400 shrink-0">{r.risk}%</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-500"
                  style={{ width: `${(r.risk / maxRisk) * 100}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {r.city} · {r.status} · conf {r.confidence}%
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Optional export for map styling helpers */
export function heatmapLineWidth(confidence: number, status: string): number {
  const base = status === 'blocked' ? 8 : status === 'partial' ? 6 : 4;
  return base + (confidence / 100) * 4;
}

export function heatmapColor(status: string): string {
  return (
    STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.unknown
  );
}
