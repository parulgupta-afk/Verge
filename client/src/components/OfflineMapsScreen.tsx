import React, { useState } from 'react';
import { ArrowLeft, Download, Map as MapIcon, Wifi, MoreVertical, CheckCircle2, RotateCw, Trash2, HardDrive } from 'lucide-react';
import { OfflineMapItem } from '../types';

interface OfflineMapsScreenProps {
  maps: OfflineMapItem[];
  onBack: () => void;
  onDownloadNew: (name: string, size: string) => void;
  onDeleteMap: (id: string) => void;
  onUpdateMap: (id: string) => void;
}

export const OfflineMapsScreen: React.FC<OfflineMapsScreenProps> = ({
  maps,
  onBack,
  onDownloadNew,
  onDeleteMap,
  onUpdateMap
}) => {
  const [autoUpdateWifi, setAutoUpdateWifi] = useState<boolean>(true);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showNewDownloadModal, setShowNewDownloadModal] = useState<boolean>(false);
  const [newRegionName, setNewRegionName] = useState<string>('');

  const handleCreateDownload = () => {
    if (!newRegionName.trim()) return;
    onDownloadNew(newRegionName.trim(), '220MB');
    setNewRegionName('');
    setShowNewDownloadModal(false);
  };

  return (
    <div className="min-h-screen bg-[#10131b] text-[#e1e2ed] flex flex-col justify-between pb-32">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#10131b]/85 backdrop-blur-md border-b border-[#424754]/50 flex items-center justify-between px-4 py-3 max-w-2xl mx-auto w-full">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-[#272a32] text-[#afc6ff] transition-colors cursor-pointer"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-[#afc6ff] tracking-tight">Offline Maps</h1>
        <div className="w-9" />
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pt-4 max-w-2xl mx-auto w-full space-y-5">
        {/* Download Action Button */}
        <section>
          <button
            onClick={() => setShowNewDownloadModal(true)}
            id="btn-download-new-map"
            className="w-full bg-[#528dff] hover:bg-[#afc6ff] text-[#00275f] font-bold text-base py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#528dff]/25 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Download className="w-5 h-5" />
            <span>Download New Map Region</span>
          </button>
        </section>

        {/* Downloaded Maps List */}
        <section className="space-y-3">
          <h2 className="text-xs font-mono text-[#8c90a0] uppercase tracking-widest pl-1">
            Downloaded Maps
          </h2>

          <div className="space-y-2.5">
            {maps.map((item) => (
              <div
                key={item.id}
                className="bg-[#191b23] border border-[#32353d] hover:border-[#afc6ff]/40 rounded-2xl p-4 flex items-center justify-between transition-colors relative"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-[#272a32] text-[#afc6ff] flex items-center justify-center border border-[#424754]/40">
                    <MapIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#e1e2ed]">{item.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs font-mono">
                      {item.status === 'downloaded' ? (
                        <span className="text-[#40e56c] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Downloaded
                        </span>
                      ) : item.status === 'update_available' ? (
                        <span className="text-[#ffb68f] font-bold flex items-center gap-1">
                          <RotateCw className="w-3.5 h-3.5" /> Update Available
                        </span>
                      ) : (
                        <span className="text-[#afc6ff] flex items-center gap-1 animate-pulse">
                          Downloading...
                        </span>
                      )}
                      <span className="text-[#424754]">•</span>
                      <span className="text-[#c2c6d7]">{item.size}</span>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                    className="w-9 h-9 rounded-full hover:bg-[#272a32] text-[#8c90a0] hover:text-[#e1e2ed] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {activeMenuId === item.id && (
                    <div className="absolute right-0 top-10 z-40 bg-[#1d1f27] border border-[#424754] rounded-xl p-1.5 shadow-2xl w-40 space-y-1">
                      {item.status === 'update_available' && (
                        <button
                          onClick={() => {
                            onUpdateMap(item.id);
                            setActiveMenuId(null);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-[#40e56c] hover:bg-[#272a32] rounded-lg flex items-center gap-2 cursor-pointer"
                        >
                          <RotateCw className="w-3.5 h-3.5" /> Update Cache
                        </button>
                      )}
                      <button
                        onClick={() => {
                          onDeleteMap(item.id);
                          setActiveMenuId(null);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-[#ffb4ab] hover:bg-[#272a32] rounded-lg flex items-center gap-2 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete Region
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Auto-update Settings Toggle */}
        <section className="bg-[#191b23] border border-[#32353d] rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#272a32] text-[#afc6ff] flex items-center justify-center border border-[#424754]/40">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#e1e2ed]">Auto-update</h3>
              <p className="text-xs text-[#8c90a0]">Download map tiles over Wi-Fi only</p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={autoUpdateWifi}
              onChange={(e) => setAutoUpdateWifi(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[#32353d] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#528dff]" />
          </label>
        </section>
      </main>

      {/* Storage Visualization Bar (Fixed Bottom) */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-[#1d1f27] border-t border-[#424754] p-4 pb-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 font-bold text-xs text-[#e1e2ed]">
            <HardDrive className="w-3.5 h-3.5 text-[#afc6ff]" />
            <span>Device Storage</span>
          </div>
          <span className="font-mono text-xs text-[#8c90a0]">64GB Total</span>
        </div>

        {/* Bar Graphic */}
        <div className="h-2.5 w-full bg-[#32353d] rounded-full overflow-hidden flex">
          <div className="h-full bg-[#528dff] transition-all" style={{ width: '25%' }} title="Verge Data (16GB)" />
          <div className="h-full bg-[#8c90a0] transition-all" style={{ width: '55%' }} title="Other Data (35GB)" />
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-3 justify-center text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#528dff]" />
            <span className="text-[#c2c6d7]">Verge (16GB)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#8c90a0]" />
            <span className="text-[#c2c6d7]">Other (35GB)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#32353d]" />
            <span className="text-[#8c90a0]">Free (13GB)</span>
          </div>
        </div>
      </footer>

      {/* New Region Download Modal */}
      {showNewDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-[#1d1f27] border border-[#424754] rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#e1e2ed]">Download Map Region</h3>
            <p className="text-xs text-[#c2c6d7]">
              Enter city or corridor name to cache vector road telemetry offline.
            </p>
            <input
              type="text"
              value={newRegionName}
              onChange={(e) => setNewRegionName(e.target.value)}
              placeholder="e.g. Portland Metro, Tokyo Expressway"
              className="w-full bg-[#272a32] border border-[#424754] focus:border-[#afc6ff] rounded-xl p-3 text-sm text-[#e1e2ed] focus:outline-none"
            />
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowNewDownloadModal(false)}
                className="flex-1 py-2.5 border border-[#424754] text-[#c2c6d7] rounded-xl text-xs font-bold hover:bg-[#272a32]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDownload}
                className="flex-1 py-2.5 bg-[#528dff] text-[#00275f] rounded-xl text-xs font-bold hover:bg-[#afc6ff]"
              >
                Download (220MB)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
