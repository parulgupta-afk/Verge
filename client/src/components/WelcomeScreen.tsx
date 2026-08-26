import React from 'react';
import { Users, Gauge, ShieldCheck, ArrowRight } from 'lucide-react';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted, onSignIn }) => {
  return (
    <div className="min-h-screen bg-[#10131b] text-[#e1e2ed] flex flex-col justify-between px-4 sm:px-6 py-8 sm:py-12 max-w-5xl mx-auto selection:bg-[#afc6ff]/30">
      {/* Top Header */}
      <header className="flex flex-col items-center justify-center text-center mt-6 sm:mt-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#528dff]/10 border border-[#528dff]/30 text-[#afc6ff] text-xs font-mono tracking-widest uppercase mb-4">
          <span className="w-2 h-2 rounded-full bg-[#40e56c] animate-pulse" />
          Autonomous Road Intelligence
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#afc6ff] tracking-tighter mb-3">
          VERGE
        </h1>
        <h2 className="text-xl sm:text-2xl font-semibold text-[#e1e2ed] max-w-xl mb-3">
          Honest Confidence for Every Drive.
        </h2>
        <p className="text-sm sm:text-base text-[#c2c6d7] max-w-lg leading-relaxed">
          Navigate uncertainty with precision engineering, hyper-local road telemetry, and real-time community validation.
        </p>
      </header>

      {/* Feature Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8 sm:my-12">
        {/* Card 1 */}
        <article className="bg-gradient-to-b from-[#272a32] to-[#191b23] border border-[#32353d] hover:border-[#afc6ff]/50 p-6 rounded-2xl flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 shadow-lg shadow-black/40">
          <div>
            <div className="w-12 h-12 rounded-xl bg-[#528dff]/20 border border-[#528dff]/40 flex items-center justify-center text-[#afc6ff] mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-[#e1e2ed] mb-2">
              Community-Powered Reports
            </h3>
            <p className="text-sm text-[#c2c6d7] leading-relaxed">
              Hyper-local hazard alerts sourced directly from drivers navigating the same disruptions in real-time.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#32353d]/60 flex items-center gap-2 text-xs font-mono text-[#afc6ff]">
            <span>12.4k active observers</span>
          </div>
        </article>

        {/* Card 2 */}
        <article className="bg-gradient-to-b from-[#272a32] to-[#191b23] border border-[#32353d] hover:border-[#40e56c]/50 p-6 rounded-2xl flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 shadow-lg shadow-black/40">
          <div>
            <div className="w-12 h-12 rounded-xl bg-[#02c953]/20 border border-[#40e56c]/40 flex items-center justify-center text-[#40e56c] mb-4 group-hover:scale-110 transition-transform">
              <Gauge className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-[#e1e2ed] mb-2">
              Real-time Confidence Scoring
            </h3>
            <p className="text-sm text-[#c2c6d7] leading-relaxed">
              Algorithmic telemetry validation ensures data integrity, presenting alerts with definitive confidence badges.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#32353d]/60 flex items-center gap-2 text-xs font-mono text-[#40e56c]">
            <span>Sub-second recalculated metrics</span>
          </div>
        </article>

        {/* Card 3 */}
        <article className="bg-gradient-to-b from-[#272a32] to-[#191b23] border border-[#32353d] hover:border-[#ffb68f]/50 p-6 rounded-2xl flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 shadow-lg shadow-black/40">
          <div>
            <div className="w-12 h-12 rounded-xl bg-[#e96c16]/20 border border-[#ffb68f]/40 flex items-center justify-center text-[#ffb68f] mb-4 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-[#e1e2ed] mb-2">
              Trust-Based Verification
            </h3>
            <p className="text-sm text-[#c2c6d7] leading-relaxed">
              A sophisticated reputation matrix filters out false positives, prioritizing high-signal updates from proven reporters.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#32353d]/60 flex items-center gap-2 text-xs font-mono text-[#ffb68f]">
            <span>Cryptographic telemetry proofs</span>
          </div>
        </article>
      </section>

      {/* Action Footer */}
      <footer className="w-full max-w-md mx-auto flex flex-col gap-3 pb-6">
        <button
          onClick={onGetStarted}
          id="btn-get-started"
          className="w-full bg-[#afc6ff] hover:bg-[#d9e2ff] text-[#002d6d] font-bold text-base sm:text-lg py-3.5 px-6 rounded-full shadow-[0_0_25px_rgba(175,198,255,0.4)] hover:shadow-[0_0_35px_rgba(175,198,255,0.6)] transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
        >
          <span>Get Started</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        <div className="text-center mt-2">
          <span className="text-xs sm:text-sm text-[#c2c6d7]">Already a Verge Vanguard?</span>
          <button
            onClick={onSignIn}
            className="text-xs sm:text-sm text-[#afc6ff] hover:text-[#d9e2ff] font-medium underline ml-2 cursor-pointer transition-colors"
          >
            Sign In with Telemetry ID
          </button>
        </div>
      </footer>
    </div>
  );
};
