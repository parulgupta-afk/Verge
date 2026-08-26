import React from 'react';
import { Map, AlertTriangle, Layers, User, PlusCircle } from 'lucide-react';
import { AppScreen } from '../types';

interface BottomNavBarProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  onQuickReport?: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentScreen,
  onNavigate,
  onQuickReport
}) => {
  return (
    <nav
      id="main-bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#1d1f27]/95 backdrop-blur-xl border-t border-[#424754]/50 flex justify-around items-center px-4 py-2 h-16 max-w-lg md:max-w-xl mx-auto md:rounded-t-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.7)]"
    >
      {/* Map Tab */}
      <button
        id="nav-tab-map"
        onClick={() => onNavigate('map')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
          currentScreen === 'map'
            ? 'text-[#afc6ff] font-bold'
            : 'text-[#c2c6d7] hover:text-[#e1e2ed]'
        }`}
      >
        <Map className="w-5 h-5" />
        <span className="text-[11px] font-semibold tracking-wider mt-0.5 uppercase">Map</span>
      </button>

      {/* Reports Tab */}
      <button
        id="nav-tab-reports"
        onClick={() => onNavigate('reports_history')}
        className={`flex flex-col items-center justify-center py-1 px-3.5 rounded-full transition-all cursor-pointer ${
          currentScreen === 'reports_history'
            ? 'bg-[#528dff] text-[#00275f] font-bold shadow-md shadow-[#528dff]/30'
            : 'text-[#c2c6d7] hover:text-[#e1e2ed]'
        }`}
      >
        <AlertTriangle className="w-5 h-5" />
        <span className="text-[11px] font-semibold tracking-wider mt-0.5 uppercase">Reports</span>
      </button>

      {/* Quick Center Report Button if provided */}
      {onQuickReport && (
        <button
          id="nav-tab-quick-report"
          onClick={onQuickReport}
          title="Report Hazard"
          className="flex flex-col items-center justify-center -mt-5 w-12 h-12 rounded-full bg-[#afc6ff] text-[#002d6d] shadow-[0_0_18px_rgba(175,198,255,0.6)] hover:bg-[#d9e2ff] active:scale-95 transition-all cursor-pointer"
        >
          <PlusCircle className="w-7 h-7" />
        </button>
      )}

      {/* Layers / Traffic Settings Tab */}
      <button
        id="nav-tab-layers"
        onClick={() => onNavigate('traffic_settings')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
          currentScreen === 'traffic_settings' || currentScreen === 'offline_maps'
            ? 'text-[#afc6ff] font-bold'
            : 'text-[#c2c6d7] hover:text-[#e1e2ed]'
        }`}
      >
        <Layers className="w-5 h-5" />
        <span className="text-[11px] font-semibold tracking-wider mt-0.5 uppercase">Layers</span>
      </button>

      {/* Profile / Leaderboard Tab */}
      <button
        id="nav-tab-profile"
        onClick={() => onNavigate('leaderboard')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
          currentScreen === 'leaderboard'
            ? 'text-[#afc6ff] font-bold'
            : 'text-[#c2c6d7] hover:text-[#e1e2ed]'
        }`}
      >
        <User className="w-5 h-5" />
        <span className="text-[11px] font-semibold tracking-wider mt-0.5 uppercase">Profile</span>
      </button>
    </nav>
  );
};
