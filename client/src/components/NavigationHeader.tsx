import React from 'react';
import { Search, HardDriveDownload, Sparkles, Navigation } from 'lucide-react';
import { ASSETS } from '../data/mockData';

interface NavigationHeaderProps {
  onSearchClick: () => void;
  onOfflineMapsClick: () => void;
  onProfileClick: () => void;
  onStartNavigationClick: () => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  onSearchClick,
  onOfflineMapsClick,
  onProfileClick,
  onStartNavigationClick,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 bg-[#10131b]/85 backdrop-blur-md border-b border-[#32353d]/60">
      {/* Brand & Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          id="btn-header-search"
          onClick={onSearchClick}
          className="flex-1 flex items-center gap-2.5 bg-[#1d1f27]/90 hover:bg-[#272a32] border border-[#424754]/60 hover:border-[#afc6ff]/40 rounded-full px-4 py-2 text-[#c2c6d7] text-sm transition-all cursor-pointer shadow-inner"
        >
          <Search className="w-4 h-4 text-[#afc6ff]" />
          <span className="font-semibold text-[#e1e2ed] text-base tracking-tight mr-1">Verge</span>
          <span className="text-xs text-[#8c90a0] border-l border-[#424754] pl-2 hidden sm:inline">Search destinations or hazards...</span>
        </button>
      </div>

      {/* Action shortcuts */}
      <div className="flex items-center gap-2 ml-2">
        {/* Live Nav Button */}
        <button
          id="btn-header-nav"
          onClick={onStartNavigationClick}
          className="flex items-center gap-1.5 bg-[#528dff] hover:bg-[#afc6ff] text-[#00275f] font-bold text-xs px-3 py-1.5 rounded-full shadow-md shadow-[#528dff]/20 transition-all cursor-pointer active:scale-95"
          title="Start Live Drive Navigation"
        >
          <Navigation className="w-3.5 h-3.5 fill-current" />
          <span className="hidden sm:inline">Drive</span>
        </button>

        {/* Offline Maps Button */}
        <button
          id="btn-header-offline"
          onClick={onOfflineMapsClick}
          className="w-9 h-9 rounded-full bg-[#1d1f27] hover:bg-[#272a32] border border-[#424754]/60 flex items-center justify-center text-[#c2c6d7] hover:text-[#afc6ff] transition-colors cursor-pointer"
          title="Offline Maps & Cache"
        >
          <HardDriveDownload className="w-4 h-4" />
        </button>

        {/* Profile Avatar */}
        <button
          id="btn-header-profile"
          onClick={onProfileClick}
          className="relative w-9 h-9 rounded-full overflow-hidden border border-[#528dff]/60 hover:border-[#afc6ff] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#afc6ff]"
          title="Community Vanguard Profile"
        >
          <img
            src={ASSETS.alexAvatar}
            alt="Alex Vanguard"
            className="w-full h-full object-cover"
          />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#40e56c] border-2 border-[#10131b]" />
        </button>
      </div>
    </header>
  );
};
