import React, { useState } from 'react';
import { ArrowLeft, Star, ShieldCheck, Award, Trophy, Users, Zap, CheckCircle2, TrendingUp } from 'lucide-react';
import { LEADERBOARD_USERS, ASSETS } from '../data/mockData';
import { LeaderboardUser } from '../types';

interface LeaderboardScreenProps {
  onBack: () => void;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ onBack }) => {
  const [tab, setTab] = useState<'local' | 'global'>('local');

  const currentUser = LEADERBOARD_USERS.find((u) => u.isCurrentUser) || LEADERBOARD_USERS[4];
  const otherUsers = LEADERBOARD_USERS.filter((u) => !u.isCurrentUser);

  return (
    <div className="min-h-screen bg-[#10131b] text-[#e1e2ed] flex flex-col pb-28">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#10131b]/85 backdrop-blur-md border-b border-[#424754]/50 flex items-center justify-between px-4 py-3 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-[#272a32] text-[#afc6ff] transition-colors cursor-pointer"
            title="Back to Map"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-[#afc6ff] tracking-tight">Community Leaderboard</h1>
        </div>

        <div className="w-9" />
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pt-4 max-w-2xl mx-auto w-full space-y-4">
        {/* Title & Local/Global Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#e1e2ed]">Top Verge Vanguards</h2>
            <p className="text-xs text-[#8c90a0]">Real-time reputation verified through telemetry</p>
          </div>

          <div className="inline-flex bg-[#1d1f27] border border-[#424754] rounded-xl p-1">
            <button
              onClick={() => setTab('local')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                tab === 'local'
                  ? 'bg-[#32353d] text-[#afc6ff] shadow-sm'
                  : 'text-[#8c90a0] hover:text-[#e1e2ed]'
              }`}
            >
              Local
            </button>
            <button
              onClick={() => setTab('global')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                tab === 'global'
                  ? 'bg-[#32353d] text-[#afc6ff] shadow-sm'
                  : 'text-[#8c90a0] hover:text-[#e1e2ed]'
              }`}
            >
              Global
            </button>
          </div>
        </div>

        {/* Current User Stats Card */}
        <section className="bg-gradient-to-r from-[#191b23] via-[#272a32] to-[#191b23] border border-[#528dff]/40 rounded-2xl p-4.5 flex items-center justify-between relative overflow-hidden shadow-xl shadow-black/60">
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="relative">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-14 h-14 rounded-full border-2 border-[#528dff] object-cover bg-[#10131b]"
              />
              <div className="absolute -bottom-1 -right-1 bg-[#40e56c] text-[#003912] font-mono font-black text-[10px] px-1.5 py-0.5 rounded-full border border-[#10131b] flex items-center gap-0.5 shadow-md">
                <ShieldCheck className="w-3 h-3" />
                {currentUser.trustScore}%
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-[#e1e2ed]">{currentUser.name}</h3>
              <div className="flex items-center gap-2 mt-0.5 text-xs font-mono">
                <span className="text-[#40e56c] font-bold">Rank #{currentUser.rank}</span>
                <span className="text-[#424754]">•</span>
                <span className="text-[#c2c6d7]">{currentUser.reportsCount.toLocaleString()} Reports</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 text-right">
            <div className="text-[10px] font-mono text-[#8c90a0] uppercase tracking-wider mb-0.5">
              CURRENT TIER
            </div>
            <div className="text-xs font-bold text-[#afc6ff] flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-[#afc6ff]" />
              <span>{currentUser.tier}</span>
            </div>
          </div>
        </section>

        {/* Community Leaderboard List */}
        <section className="space-y-2.5">
          {otherUsers.map((user) => (
            <div
              key={user.id}
              className={`border rounded-2xl p-3.5 flex items-center justify-between transition-colors ${
                user.rank === 1
                  ? 'bg-[#272a32] border-[#40e56c]/40'
                  : 'bg-[#191b23] border-[#32353d] hover:border-[#424754]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 text-center font-bold font-mono text-base ${
                    user.rank === 1
                      ? 'text-[#40e56c]'
                      : user.rank === 2
                      ? 'text-[#afc6ff]'
                      : user.rank === 3
                      ? 'text-[#ffb68f]'
                      : 'text-[#8c90a0]'
                  }`}
                >
                  {user.rank}
                </div>

                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover border border-[#424754]"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#272a32] flex items-center justify-center font-bold text-sm text-[#e1e2ed] border border-[#424754]">
                    {user.name.charAt(0)}
                  </div>
                )}

                <div>
                  <div className="text-sm font-semibold text-[#e1e2ed]">{user.name}</div>
                  <div className="text-xs text-[#8c90a0]">
                    {user.reportsCount.toLocaleString()} Reports
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#40e56c]/10 text-[#40e56c] border border-[#40e56c]/30 text-xs font-mono font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{user.trustScore}%</span>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Vanguard System Breakdown */}
        <section className="bg-[#191b23] border border-[#32353d] rounded-2xl p-4 space-y-3 mt-4">
          <div className="flex items-center gap-2 text-[#afc6ff]">
            <Award className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">How Vanguard Scoring Works</h3>
          </div>
          <p className="text-xs text-[#c2c6d7] leading-relaxed">
            Every submitted road condition is matched against IoT loop sensors and neighboring driver reports. Consistently accurate reports increase your network weight from Observer to Supreme Guardian.
          </p>
        </section>
      </main>
    </div>
  );
};
