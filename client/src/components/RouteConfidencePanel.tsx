import React from 'react';
import { AlertOctagon, CheckCircle2, Info, X } from 'lucide-react';

export type RouteIssue = {
  id: string;
  name: string;
  status: string;
  confidence: number;
  updatedAt?: string;
};

interface Props {
  destinationLabel?: string | null;
  durationText?: string | null;
  distanceText?: string | null;
  issues: RouteIssue[];
  onClose?: () => void;
  onStart?: () => void;
  onOpenSegment?: (id: string) => void;
}

/**
 * Verge unique: transparent confidence on *this route*, not a generic traffic bar.
 */
export function RouteConfidencePanel({
  destinationLabel,
  durationText,
  distanceText,
  issues,
  onClose,
  onStart,
  onOpenSegment,
}: Props) {
  const blocked = issues.filter((i) => i.status === 'blocked');
  const partial = issues.filter((i) => i.status === 'partial');
  const tone =
    blocked.length > 0 ? 'risk' : partial.length > 0 ? 'caution' : 'clear';

  return (
    <div className="absolute left-3 right-3 bottom-28 z-25 max-w-md mx-auto pointer-events-auto">
      <div
        className={`rounded-2xl border shadow-2xl backdrop-blur-md overflow-hidden ${
          tone === 'risk'
            ? 'bg-slate-950/95 border-red-500/50'
            : tone === 'caution'
            ? 'bg-slate-950/95 border-amber-500/40'
            : 'bg-slate-950/95 border-emerald-500/35'
        }`}
      >
        <div className="flex items-start justify-between gap-2 px-4 pt-3 pb-2">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
              Route confidence · Verge
            </div>
            <div className="text-sm font-semibold text-white truncate">
              {destinationLabel ? `→ ${destinationLabel}` : 'Active route'}
            </div>
            {(durationText || distanceText) && (
              <div className="text-xs text-slate-400 mt-0.5">
                {[durationText, distanceText].filter(Boolean).join(' · ')}
              </div>
            )}
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-500 hover:bg-slate-800 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="px-4 pb-2">
          {tone === 'clear' && (
            <div className="flex items-center gap-2 text-sm text-emerald-300/95 py-1">
              <CheckCircle2 size={16} className="shrink-0" />
              No high-confidence blockages on this path in Verge data.
            </div>
          )}
          {tone === 'caution' && (
            <div className="flex items-start gap-2 text-sm text-amber-200 py-1">
              <Info size={16} className="shrink-0 mt-0.5" />
              Partial / slow reports on path — check confidence before you go.
            </div>
          )}
          {tone === 'risk' && (
            <div className="flex items-start gap-2 text-sm text-red-200 py-1">
              <AlertOctagon size={16} className="shrink-0 mt-0.5" />
              Verified-style blockage reports sit on this route.
            </div>
          )}

          {issues.length > 0 && (
            <ul className="mt-2 space-y-1.5 max-h-28 overflow-y-auto">
              {issues.map((i) => (
                <li key={i.id}>
                  <button
                    type="button"
                    onClick={() => onOpenSegment?.(i.id)}
                    className="w-full text-left rounded-xl border border-slate-700/80 bg-slate-900/80 px-3 py-2 hover:border-slate-500"
                  >
                    <div className="flex justify-between gap-2 text-xs">
                      <span className="font-medium text-slate-100 truncate">{i.name}</span>
                      <span
                        className={
                          i.status === 'blocked' ? 'text-red-400' : 'text-amber-400'
                        }
                      >
                        {i.confidence}% · {i.status}
                      </span>
                    </div>
                    {i.updatedAt && (
                      <div className="text-[10px] text-slate-500 mt-0.5">Updated {i.updatedAt}</div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {onStart && (
          <div className="px-4 pb-3 pt-1">
            <button
              type="button"
              onClick={onStart}
              className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
            >
              {tone === 'clear' ? 'Start navigation' : 'Start anyway'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
