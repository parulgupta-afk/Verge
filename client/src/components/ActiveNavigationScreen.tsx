import React, { useState, useEffect } from 'react';
import { CornerUpLeft, ArrowUp, ShieldCheck, AlertTriangle, Settings, Search, X, Volume2, VolumeX, Navigation } from 'lucide-react';
import { ASSETS } from '../data/mockData';
import { speak, stopSpeaking, setVoiceMuted, initVoices } from '../lib/voice';

interface NavStep {
  instruction: string;
  street: string;
  distance: string;
  next: string;
  icon: string;
}

interface ActiveNavigationScreenProps {
  onExit: () => void;
  onOpenSettings: () => void;
  onOpenReport: () => void;
  routeSummary?: {
    destinationName: string;
    durationText: string;
    distanceText: string;
    rerouteMessage?: string | null;
    steps?: Array<{ instruction: string; name: string; distanceText: string }>;
  } | null;
}

export const ActiveNavigationScreen: React.FC<ActiveNavigationScreenProps> = ({
  onExit,
  onOpenSettings,
  onOpenReport,
  routeSummary = null,
}) => {
  const [distanceToTurn, setDistanceToTurn] = useState<number>(0.5);
  const [remainingMinutes, setRemainingMinutes] = useState<number>(12);
  const [totalDistance, setTotalDistance] = useState<number>(4.2);
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('verge_voice_muted') === '1';
    } catch {
      return false;
    }
  });
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);

  const fallbackSteps: NavStep[] = [
    { instruction: 'Continue', street: 'on your route', distance: routeSummary?.distanceText || '—', next: 'Follow the blue line', icon: 'straight' },
    { instruction: 'Arrive at Destination', street: routeSummary?.destinationName || 'Destination', distance: '0.1 km', next: 'Route complete', icon: 'arrive' },
  ];

  const steps: NavStep[] =
    routeSummary?.steps && routeSummary.steps.length > 0
      ? routeSummary.steps.map((s, i, arr) => ({
          instruction: s.instruction,
          street: s.name ? `on ${s.name}` : '',
          distance: s.distanceText,
          next: arr[i + 1]?.instruction || 'Continue to destination',
          icon: /left/i.test(s.instruction)
            ? 'left'
            : /right/i.test(s.instruction)
              ? 'right'
              : /arrive/i.test(s.instruction)
                ? 'arrive'
                : 'straight',
        }))
      : fallbackSteps;

  // Drive progress simulation tick
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setDistanceToTurn((prev) => {
        if (prev <= 0.1) {
          setCurrentStepIndex((curr) => {
            const next = (curr + 1) % steps.length;
            return next;
          });
          return 0.8;
        }
        return Number((prev - 0.1).toFixed(1));
      });

      setTotalDistance((prev) => Math.max(0.1, Number((prev - 0.05).toFixed(1))));
    }, 4000);

    return () => clearInterval(interval);
  }, [isSimulating, steps.length]);

  // Phase 4: voice — init + speak current maneuver
  useEffect(() => {
    initVoices();
  }, []);

  useEffect(() => {
    if (isMuted) {
      stopSpeaking();
      return;
    }
    const step = steps[currentStepIndex];
    if (!step) return;
    const line = [step.instruction, step.street].filter(Boolean).join(' ');
    speak(line);
  }, [currentStepIndex, isMuted]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!routeSummary?.rerouteMessage || isMuted) return;
    speak(routeSummary.rerouteMessage);
  }, [routeSummary?.rerouteMessage, isMuted]);

  const currentStep = steps[currentStepIndex] || steps[0];

  return (
    <div className="fixed inset-0 z-50 bg-[#10131b] text-[#e1e2ed] flex flex-col justify-between select-none overflow-hidden animate-in fade-in duration-300">
      {routeSummary && (
        <div className="absolute top-0 left-0 right-0 z-30 px-3 pt-3 pointer-events-none">
          <div className="rounded-xl bg-slate-900/95 border border-slate-600 px-4 py-3 pointer-events-auto shadow-lg">
            <div className="text-xs text-slate-400">Navigating to</div>
            <div className="text-sm font-semibold text-white">{routeSummary.destinationName}</div>
            <div className="text-xs text-slate-300 mt-1">
              {routeSummary.durationText} · {routeSummary.distanceText}
            </div>
            {routeSummary.rerouteMessage && (
              <div className="mt-2 text-xs text-amber-300 leading-snug border-t border-slate-700 pt-2">
                {routeSummary.rerouteMessage}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Map Canvas Background */}
      <div className="absolute inset-0 z-0 map-grid-bg">
        <img
          src={ASSETS.activeNavigationMap}
          alt="3D Navigation Map"
          className="w-full h-full object-cover opacity-85"
        />
        {/* Animated Cyber Route Line Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            <path
              d="M 50 100 Q 55 70 45 40 T 60 10 L 60 -10"
              fill="none"
              stroke="#528dff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-[0_0_12px_rgba(82,141,255,0.9)] animate-route-glow"
            />
            {/* GPS Vehicle Position Puck */}
            <circle
              cx="48"
              cy="65"
              r="2.5"
              fill="#afc6ff"
              stroke="#ffffff"
              strokeWidth="1"
              className="drop-shadow-[0_0_14px_rgba(175,198,255,1)] animate-ping"
            />
            <circle
              cx="48"
              cy="65"
              r="2.2"
              fill="#afc6ff"
              stroke="#ffffff"
              strokeWidth="0.8"
            />
          </svg>
        </div>
      </div>

      {/* Top Turn-by-Turn Card & Next Peek */}
      <div className="relative z-20 pt-4 px-4 flex flex-col items-center gap-2 max-w-md mx-auto w-full">
        {/* Main Turn Card */}
        <div className="w-full bg-[#10131b]/95 backdrop-blur-xl border border-[#424754] rounded-2xl p-4 flex items-center justify-between shadow-2xl shadow-black/80">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-[#528dff]/20 border border-[#528dff] flex items-center justify-center text-[#afc6ff] shrink-0">
              <CornerUpLeft className="w-7 h-7" />
            </div>
            <div>
              <div className="text-xl font-bold text-[#e1e2ed] tracking-tight">
                {currentStep.instruction}
              </div>
              <div className="text-sm font-medium text-[#c2c6d7]">
                {currentStep.street}
              </div>
            </div>
          </div>

          <div className="text-right flex flex-col items-end">
            <span className="text-3xl font-extrabold text-[#afc6ff] leading-none">
              {distanceToTurn}
            </span>
            <span className="text-[11px] font-bold text-[#8c90a0] uppercase tracking-wider mt-0.5">
              MILES
            </span>
          </div>
        </div>

        {/* Next Instruction Peek */}
        <div className="w-full bg-[#10131b]/80 backdrop-blur-md border border-[#424754]/80 rounded-xl px-4 py-2.5 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2 text-xs text-[#c2c6d7]">
            <ArrowUp className="w-4 h-4 text-[#afc6ff]" />
            <span>{currentStep.next}</span>
          </div>

          <button
            onClick={() => {
              const next = !isMuted;
              setIsMuted(next);
              setVoiceMuted(next);
              if (next) stopSpeaking();
            }}
            className="text-[#8c90a0] hover:text-[#e1e2ed] p-1 rounded-full cursor-pointer"
            title={isMuted ? 'Unmute voice navigation' : 'Mute voice navigation'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-[#ffb4ab]" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mid-screen Overlays */}
      <div className="relative z-20 px-4 flex justify-between items-end mb-4">
        {/* Confidence Badge */}
        <div className="bg-[#10131b]/90 border border-[#40e56c] rounded-full px-3.5 py-1.5 flex items-center gap-1.5 backdrop-blur-md shadow-lg">
          <ShieldCheck className="w-4 h-4 text-[#40e56c]" />
          <span className="font-mono text-xs font-bold text-[#40e56c]">99% Confirmed</span>
        </div>

        {/* Hazard Quick Report FAB */}
        <button
          onClick={onOpenReport}
          id="btn-nav-quick-report"
          aria-label="Report issue along route"
          className="w-14 h-14 rounded-full bg-[#528dff] hover:bg-[#afc6ff] text-[#00275f] flex items-center justify-center shadow-[0_0_25px_rgba(82,141,255,0.6)] active:scale-95 transition-all cursor-pointer border border-[#afc6ff]/40"
        >
          <AlertTriangle className="w-7 h-7 fill-current" />
        </button>
      </div>

      {/* Bottom Navigation Dashboard Card */}
      <div className="relative z-20 w-full max-w-md mx-auto">
        <div className="bg-[#10131b]/95 backdrop-blur-2xl border-t border-[#424754] rounded-t-3xl p-5 shadow-[0_-15px_40px_rgba(0,0,0,0.9)]">
          {/* Primary Metric: Time, Distance, ETA */}
          <div className="flex justify-between items-end mb-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-5xl font-black text-[#40e56c] tracking-tight">
                {remainingMinutes}
              </span>
              <span className="text-xl font-bold text-[#40e56c]/90">
                min
              </span>
            </div>

            <div className="flex gap-6 text-right">
              <div>
                <span className="text-xs text-[#8c90a0] block mb-0.5">Distance</span>
                <span className="text-lg font-bold text-[#e1e2ed]">
                  {totalDistance} <span className="text-xs text-[#8c90a0]">mi</span>
                </span>
              </div>

              <div>
                <span className="text-xs text-[#8c90a0] block mb-0.5">ETA</span>
                <span className="text-lg font-bold text-[#e1e2ed]">4:32 <span className="text-xs text-[#8c90a0]">PM</span></span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex justify-between items-center border-t border-[#32353d] pt-3.5 mt-2">
            <div className="flex gap-2">
              <button
                onClick={onOpenSettings}
                className="w-10 h-10 rounded-xl bg-[#1d1f27] hover:bg-[#272a32] border border-[#424754] flex items-center justify-center text-[#c2c6d7] hover:text-[#afc6ff] transition-colors cursor-pointer"
                title="Route & Traffic Settings"
              >
                <Settings className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsSimulating(!isSimulating)}
                className={`px-3 h-10 rounded-xl border border-[#424754] flex items-center gap-1.5 text-xs font-mono transition-colors cursor-pointer ${
                  isSimulating ? 'bg-[#528dff]/20 text-[#afc6ff] border-[#528dff]' : 'bg-[#1d1f27] text-[#8c90a0]'
                }`}
                title="Toggle Drive Simulator"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>{isSimulating ? 'Live Sim' : 'Paused'}</span>
              </button>
            </div>

            {/* Exit Navigation Button */}
            <button
              onClick={onExit}
              id="btn-exit-navigation"
              className="bg-[#93000a]/30 hover:bg-[#93000a] text-[#ffb4ab] border border-[#ffb4ab]/60 font-bold text-xs px-5 py-2.5 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Exit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
