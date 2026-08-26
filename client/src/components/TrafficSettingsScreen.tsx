import React from 'react';
import { ArrowLeft, Bell, Palette, Layers, Sliders, Users, Radio, History, Check, ShieldCheck, Activity, BarChart2 } from 'lucide-react';
import { TrafficSettingsState } from '../types';

interface TrafficSettingsScreenProps {
  settings: TrafficSettingsState;
  onUpdateSettings: (newSettings: Partial<TrafficSettingsState>) => void;
  onBack: () => void;
  onOpenOfflineMaps: () => void;
}

export const TrafficSettingsScreen: React.FC<TrafficSettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  onBack,
  onOpenOfflineMaps
}) => {
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
          <h1 className="text-xl font-bold text-[#afc6ff] tracking-tight">Traffic Settings</h1>
        </div>

        <button
          onClick={onOpenOfflineMaps}
          className="text-xs font-mono font-bold text-[#afc6ff] hover:text-[#d9e2ff] bg-[#528dff]/15 px-3 py-1.5 rounded-full border border-[#528dff]/30 cursor-pointer"
        >
          Offline Maps →
        </button>
      </header>

      {/* Main Settings Body */}
      <main className="flex-1 px-4 pt-4 max-w-2xl mx-auto w-full space-y-5">
        {/* Real-time Alerts */}
        <section className="bg-[#1d1f27] border border-[#32353d] rounded-2xl p-4.5 space-y-3">
          <div className="flex items-center gap-2 text-[#afc6ff] border-b border-[#32353d] pb-2.5">
            <Bell className="w-4 h-4" />
            <h2 className="text-base font-bold">Real-time Alerts</h2>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <div className="font-semibold text-sm text-[#e1e2ed]">Major Blockages</div>
                <div className="text-xs text-[#8c90a0]">Accidents, road closures, heavy construction</div>
              </div>
              <input
                type="checkbox"
                checked={settings.majorBlockages}
                onChange={(e) => onUpdateSettings({ majorBlockages: e.target.checked })}
                className="w-5 h-5 accent-[#528dff] rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <div className="font-semibold text-sm text-[#e1e2ed]">Minor Delays</div>
                <div className="text-xs text-[#8c90a0]">Slow traffic, minor hazards</div>
              </div>
              <input
                type="checkbox"
                checked={settings.minorDelays}
                onChange={(e) => onUpdateSettings({ minorDelays: e.target.checked })}
                className="w-5 h-5 accent-[#528dff] rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <div className="font-semibold text-sm text-[#e1e2ed]">Speed Camera Alerts</div>
                <div className="text-xs text-[#8c90a0]">Fixed and reported mobile cameras</div>
              </div>
              <input
                type="checkbox"
                checked={settings.speedCameras}
                onChange={(e) => onUpdateSettings({ speedCameras: e.target.checked })}
                className="w-5 h-5 accent-[#528dff] rounded cursor-pointer"
              />
            </label>
          </div>
        </section>

        {/* Visual Style Switcher */}
        <section className="bg-[#1d1f27] border border-[#32353d] rounded-2xl p-4.5 space-y-3">
          <div className="flex items-center gap-2 text-[#afc6ff] border-b border-[#32353d] pb-2.5">
            <Palette className="w-4 h-4" />
            <h2 className="text-base font-bold">Visual Style</h2>
          </div>

          <div className="grid grid-cols-3 gap-1.5 bg-[#10131b] p-1 rounded-xl border border-[#32353d]">
            {(['standard', 'satellite', 'high_contrast'] as const).map((style) => (
              <button
                key={style}
                onClick={() => onUpdateSettings({ visualStyle: style })}
                className={`py-2 text-xs font-bold rounded-lg transition-all capitalize cursor-pointer ${
                  settings.visualStyle === style
                    ? 'bg-[#528dff] text-[#00275f] shadow-md'
                    : 'text-[#8c90a0] hover:text-[#e1e2ed]'
                }`}
              >
                {style.replace('_', ' ')}
              </button>
            ))}
          </div>
        </section>

        {/* Map Layers */}
        <section className="bg-[#1d1f27] border border-[#32353d] rounded-2xl p-4.5 space-y-3">
          <div className="flex items-center gap-2 text-[#afc6ff] border-b border-[#32353d] pb-2.5">
            <Layers className="w-4 h-4" />
            <h2 className="text-base font-bold">Map Layers</h2>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-semibold text-[#e1e2ed]">Show 3D Buildings</span>
              <input
                type="checkbox"
                checked={settings.show3dBuildings}
                onChange={(e) => onUpdateSettings({ show3dBuildings: e.target.checked })}
                className="w-5 h-5 accent-[#528dff] rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-semibold text-[#e1e2ed]">Show POIs</span>
              <input
                type="checkbox"
                checked={settings.showPois}
                onChange={(e) => onUpdateSettings({ showPois: e.target.checked })}
                className="w-5 h-5 accent-[#528dff] rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-semibold text-[#e1e2ed]">Show Traffic Flow</span>
              <input
                type="checkbox"
                checked={settings.showTrafficFlow}
                onChange={(e) => onUpdateSettings({ showTrafficFlow: e.target.checked })}
                className="w-5 h-5 accent-[#528dff] rounded cursor-pointer"
              />
            </label>
          </div>
        </section>

        {/* Confidence Threshold */}
        <section className="bg-[#1d1f27] border border-[#32353d] rounded-2xl p-4.5 space-y-3">
          <div className="flex items-center gap-2 text-[#afc6ff] border-b border-[#32353d] pb-2.5">
            <Sliders className="w-4 h-4" />
            <h2 className="text-base font-bold">Confidence Threshold</h2>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#c2c6d7]">Filter out low-confidence reports</span>
              <span className="text-xs font-mono font-bold text-[#afc6ff] bg-[#528dff]/20 px-2.5 py-1 rounded-md border border-[#528dff]/30">
                {settings.confidenceThreshold}%
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={100}
              value={settings.confidenceThreshold}
              onChange={(e) => onUpdateSettings({ confidenceThreshold: Number(e.target.value) })}
              className="w-full accent-[#528dff] cursor-pointer"
            />

            <div className="flex justify-between text-[11px] font-mono text-[#8c90a0]">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </section>

        {/* Data Sources */}
        <section className="bg-[#1d1f27] border border-[#32353d] rounded-2xl p-4.5 space-y-3">
          <div className="text-xs font-mono uppercase tracking-widest text-[#8c90a0]">
            Data Sources
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#272a32] flex items-center justify-center text-[#afc6ff]">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#e1e2ed]">Community Reports</div>
                  <div className="text-xs text-[#8c90a0]">User-submitted incidents and delays</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.communityReports}
                onChange={(e) => onUpdateSettings({ communityReports: e.target.checked })}
                className="w-5 h-5 accent-[#528dff] rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#272a32] flex items-center justify-center text-[#40e56c]">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#e1e2ed]">Real-time Sensor Data</div>
                  <div className="text-xs text-[#8c90a0]">DOT loop detectors & cameras</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.sensorData}
                onChange={(e) => onUpdateSettings({ sensorData: e.target.checked })}
                className="w-5 h-5 accent-[#528dff] rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#272a32] flex items-center justify-center text-[#ffb68f]">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#e1e2ed]">Historical Trends</div>
                  <div className="text-xs text-[#8c90a0]">Predictive models based on past flow</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.historicalTrends}
                onChange={(e) => onUpdateSettings({ historicalTrends: e.target.checked })}
                className="w-5 h-5 accent-[#528dff] rounded cursor-pointer"
              />
            </label>
          </div>
        </section>

        {/* Alert Thresholds & Notification Radius */}
        <section className="bg-[#1d1f27] border border-[#32353d] rounded-2xl p-4.5 space-y-4">
          <div className="text-xs font-mono uppercase tracking-widest text-[#8c90a0]">
            Alert Thresholds
          </div>

          {/* Minimum Confidence Level Selector */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-[#e1e2ed]">Minimum Confidence Level</span>
              <ShieldCheck className="w-4 h-4 text-[#afc6ff]" />
            </div>
            <div className="grid grid-cols-3 gap-1 bg-[#10131b] p-1 rounded-xl border border-[#32353d]">
              {(['Low', 'Medium', 'High'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => onUpdateSettings({ minConfidenceLevel: level })}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    settings.minConfidenceLevel === level
                      ? 'bg-[#32353d] text-[#afc6ff] border border-[#424754]'
                      : 'text-[#8c90a0] hover:text-[#e1e2ed]'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[#8c90a0] mt-1.5 text-center">
              Only show alerts verified by multiple telemetry sources.
            </p>
          </div>

          {/* Notification Radius Slider */}
          <div className="space-y-1.5 pt-2 border-t border-[#32353d]">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-[#e1e2ed]">Notification Radius</span>
              <span className="text-xs font-mono font-bold text-[#afc6ff] bg-[#528dff]/20 px-2 py-0.5 rounded border border-[#528dff]/30">
                {settings.notificationRadius} mi
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={50}
              value={settings.notificationRadius}
              onChange={(e) => onUpdateSettings({ notificationRadius: Number(e.target.value) })}
              className="w-full accent-[#528dff] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-[#8c90a0]">
              <span>5mi</span>
              <span>50mi</span>
            </div>
          </div>
        </section>

        {/* Visualization */}
        <section className="bg-[#1d1f27] border border-[#32353d] rounded-2xl p-4.5 space-y-3">
          <div className="text-xs font-mono uppercase tracking-widest text-[#8c90a0]">
            Visualization
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold text-[#e1e2ed]">Segment Thickness</span>
                <span className="text-xs font-mono text-[#afc6ff]">{settings.segmentThickness}px</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={settings.segmentThickness}
                onChange={(e) => onUpdateSettings({ segmentThickness: Number(e.target.value) })}
                className="w-full accent-[#528dff] cursor-pointer"
              />
            </div>

            <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-[#32353d]">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[#8c90a0]" />
                <span className="text-sm font-semibold text-[#e1e2ed]">Show Confidence Bars</span>
              </div>
              <input
                type="checkbox"
                checked={settings.showConfidenceBars}
                onChange={(e) => onUpdateSettings({ showConfidenceBars: e.target.checked })}
                className="w-5 h-5 accent-[#528dff] rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer pt-1">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#8c90a0]" />
                <span className="text-sm font-semibold text-[#e1e2ed]">Animate Flow</span>
              </div>
              <input
                type="checkbox"
                checked={settings.animateFlow}
                onChange={(e) => onUpdateSettings({ animateFlow: e.target.checked })}
                className="w-5 h-5 accent-[#528dff] rounded cursor-pointer"
              />
            </label>
          </div>
        </section>
      </main>
    </div>
  );
};
