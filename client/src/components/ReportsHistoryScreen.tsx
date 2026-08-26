import React, { useState } from 'react';
import { ArrowLeft, Search, Filter, Clock, Trash2, MapPin, CheckCircle2, ChevronDown, AlertTriangle, CameraOff, Plus } from 'lucide-react';
import { UserReport, ReportStatus, RoadSegment } from '../types';
import { ASSETS } from '../data/mockData';

interface ReportsHistoryScreenProps {
  reports: UserReport[];
  onBack: () => void;
  onViewOnMap: (segmentId: string) => void;
  onUpdateStatus: (report: UserReport) => void;
  onDeleteReport: (reportId: string) => void;
  onAddNewReport: () => void;
}

export const ReportsHistoryScreen: React.FC<ReportsHistoryScreenProps> = ({
  reports,
  onBack,
  onViewOnMap,
  onUpdateStatus,
  onDeleteReport,
  onAddNewReport
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'blocked' | 'partial' | 'clear'>('all');
  const [reportToDelete, setReportToDelete] = useState<UserReport | null>(null);

  const filteredReports = reports.filter((rep) => {
    const matchesSearch =
      rep.roadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || rep.status === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#10131b] text-[#e1e2ed] flex flex-col pb-28">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#10131b]/85 backdrop-blur-md border-b border-[#424754]/50 flex items-center justify-between px-4 py-3 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-[#272a32] text-[#afc6ff] transition-colors cursor-pointer"
            title="Back to Map"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-[#afc6ff] tracking-tight">My Reports</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onAddNewReport}
            className="flex items-center gap-1 bg-[#528dff] hover:bg-[#afc6ff] text-[#00275f] font-bold text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Report</span>
          </button>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-[#424754]">
            <img src={ASSETS.alexAvatar} alt="User Avatar" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pt-4 max-w-3xl mx-auto w-full space-y-4">
        {/* Search & Filter Chips */}
        <div className="space-y-3">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c90a0]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search road name or area..."
              className="w-full bg-[#1d1f27] border border-[#424754] focus:border-[#afc6ff] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#e1e2ed] placeholder-[#8c90a0] focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-[#528dff] text-[#00275f]'
                  : 'bg-[#1d1f27] border border-[#424754] text-[#c2c6d7] hover:bg-[#272a32]'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setFilterType('blocked')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                filterType === 'blocked'
                  ? 'bg-[#ffb4ab] text-[#690005]'
                  : 'bg-[#1d1f27] border border-[#424754] text-[#c2c6d7] hover:bg-[#272a32]'
              }`}
            >
              Blocked
            </button>
            <button
              onClick={() => setFilterType('partial')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                filterType === 'partial'
                  ? 'bg-[#ffb68f] text-[#4a1c00]'
                  : 'bg-[#1d1f27] border border-[#424754] text-[#c2c6d7] hover:bg-[#272a32]'
              }`}
            >
              Partial
            </button>
            <button
              onClick={() => setFilterType('clear')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                filterType === 'clear'
                  ? 'bg-[#40e56c] text-[#003912]'
                  : 'bg-[#1d1f27] border border-[#424754] text-[#c2c6d7] hover:bg-[#272a32]'
              }`}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <article
              key={report.id}
              className="bg-[#1A1A1A] border border-[#333333] hover:border-[#424754] rounded-2xl overflow-hidden flex flex-col md:flex-row transition-all shadow-md"
            >
              {/* Thumbnail / Image Area */}
              <div className="h-36 md:h-auto md:w-52 relative border-b md:border-b-0 md:border-r border-[#333333] shrink-0 bg-[#262626] flex items-center justify-center overflow-hidden">
                {report.photoUrl ? (
                  <img
                    src={report.photoUrl}
                    alt={report.roadName}
                    className={`w-full h-full object-cover ${report.status === 'clear' ? 'grayscale opacity-75' : ''}`}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-[#8c90a0]">
                    <CameraOff className="w-8 h-8 mb-1" />
                    <span className="text-[11px] font-mono">No Image Attached</span>
                  </div>
                )}

                {/* Floating Status Pill on Mobile */}
                <div className="absolute top-2.5 left-2.5">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-md ${
                      report.status === 'blocked'
                        ? 'bg-[#ffb4ab]/20 border-[#ffb4ab] text-[#ffb4ab]'
                        : report.status === 'partial'
                        ? 'bg-[#ffb68f]/20 border-[#ffb68f] text-[#ffb68f]'
                        : 'bg-[#40e56c]/20 border-[#40e56c] text-[#40e56c]'
                    }`}
                  >
                    {report.status}
                  </span>
                </div>
              </div>

              {/* Content Area */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3
                        className={`text-lg font-bold text-[#e1e2ed] ${
                          report.status === 'clear' ? 'line-through decoration-[#8c90a0]' : ''
                        }`}
                      >
                        {report.roadName}
                      </h3>
                      <p className="text-xs text-[#c2c6d7] mt-0.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#8c90a0]" />
                        {report.updatedAt} • {report.location}
                      </p>
                    </div>
                  </div>

                  {/* Notes snippet if present */}
                  {report.notes && (
                    <p className="text-xs text-[#8c90a0] mt-2 line-clamp-2 bg-[#10131b]/60 p-2 rounded-lg border border-[#32353d]">
                      "{report.notes}"
                    </p>
                  )}

                  {/* Confidence Bar */}
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[#32353d] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          report.status === 'blocked'
                            ? 'bg-[#40e56c]'
                            : report.status === 'partial'
                            ? 'bg-[#ffb68f]'
                            : 'bg-[#40e56c]'
                        }`}
                        style={{ width: `${report.confidence}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-mono font-bold text-[#40e56c]">
                      {report.confidence}% CONFIRMED
                    </span>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="flex items-center gap-2 pt-3 border-t border-[#333333]">
                  <button
                    onClick={() => setReportToDelete(report)}
                    className="p-2 text-[#ffb4ab] hover:bg-[#ffb4ab]/10 rounded-lg transition-colors cursor-pointer"
                    title="Delete Report"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onUpdateStatus(report)}
                    className="flex-1 py-2 px-3 bg-[#1d1f27] hover:bg-[#272a32] text-[#e1e2ed] border border-[#424754] rounded-lg text-xs font-bold transition-colors cursor-pointer text-center"
                  >
                    Update Status
                  </button>

                  <button
                    onClick={() => onViewOnMap(report.segmentId)}
                    className="flex-1 py-2 px-3 bg-[#528dff] hover:bg-[#afc6ff] text-[#00275f] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>View on Map</span>
                  </button>
                </div>
              </div>
            </article>
          ))}

          {filteredReports.length === 0 && (
            <div className="text-center py-12 bg-[#1A1A1A] border border-[#333333] rounded-2xl p-6">
              <AlertTriangle className="w-10 h-10 text-[#8c90a0] mx-auto mb-2" />
              <p className="text-sm font-medium text-[#c2c6d7]">No matching reports found.</p>
              <button
                onClick={onAddNewReport}
                className="mt-3 px-4 py-2 bg-[#afc6ff] text-[#002d6d] font-bold text-xs rounded-xl cursor-pointer"
              >
                Create New Report
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {reportToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-[#1d1f27] border border-[#424754] rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#e1e2ed]">Delete Report?</h3>
            <p className="text-xs text-[#c2c6d7] leading-relaxed">
              This will remove your contribution for <strong className="text-white">{reportToDelete.roadName}</strong> from Verge. This action cannot be undone.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => setReportToDelete(null)}
                className="w-full py-3 bg-[#afc6ff] text-[#002d6d] font-bold text-xs rounded-xl hover:bg-[#d9e2ff] transition-colors cursor-pointer"
              >
                Keep Report
              </button>
              <button
                onClick={() => {
                  onDeleteReport(reportToDelete.id);
                  setReportToDelete(null);
                }}
                className="w-full py-2.5 bg-[#ffb4ab]/10 text-[#ffb4ab] border border-[#ffb4ab]/40 font-bold text-xs rounded-xl hover:bg-[#ffb4ab]/20 transition-colors cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
