import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, Ban, AlertTriangle, CheckCircle2, Camera, Upload, RotateCw, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import { RoadSegment, ReportStatus, UserReport } from '../types';
import { ASSETS } from '../data/mockData';

interface ReportFlowModalProps {
  initialSegment?: RoadSegment | null;
  allSegments: RoadSegment[];
  onClose: () => void;
  onSubmitReport: (report: Omit<UserReport, 'id' | 'updatedAt' | 'confirms' | 'refutes'>) => void;
}

export const ReportFlowModal: React.FC<ReportFlowModalProps> = ({
  initialSegment,
  allSegments,
  onClose,
  onSubmitReport
}) => {
  const [currentStep, setCurrentStep] = useState<number>(initialSegment ? 2 : 1);
  const [selectedSegment, setSelectedSegment] = useState<RoadSegment>(
    initialSegment || allSegments[0]
  );
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus>('partial');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setPhotoUrl(url);
    }
  };

  const handleFinishSubmit = () => {
    setIsSubmitting(true);
    // Move to step 4 (Success state with confidence recalculating)
    setCurrentStep(4);

    onSubmitReport({
      roadName: selectedSegment.name,
      segmentId: selectedSegment.id,
      status: selectedStatus,
      confidence: selectedStatus === 'blocked' ? 92 : selectedStatus === 'partial' ? 65 : 98,
      location: selectedSegment.location,
      photoUrl: photoUrl || (selectedStatus === 'blocked' ? ASSETS.trafficJamPhoto : selectedStatus === 'clear' ? ASSETS.clearDawnRoadPhoto : undefined),
      notes: notes || `Reported ${selectedStatus.toUpperCase()} condition for ${selectedSegment.name}.`
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Top Close Button for the reporting flow */}
      <header className="fixed top-4 right-4 z-50">
        <button
          onClick={onClose}
          id="btn-close-report-flow"
          className="w-10 h-10 rounded-full bg-[#1d1f27] border border-[#424754] flex items-center justify-center text-[#e1e2ed] hover:bg-[#272a32] transition-colors cursor-pointer shadow-lg"
          aria-label="Close Report Flow"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* STEP 1: Select Segment */}
      {currentStep === 1 && (
        <div className="bg-[#1d1f27] border-t border-[#424754] px-5 pt-6 pb-8 flex flex-col gap-5 rounded-t-3xl shadow-[0_-15px_50px_rgba(0,0,0,0.9)] max-w-lg md:max-w-xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#afc6ff] uppercase tracking-widest">
              Step 1 of 4 • Select Segment
            </span>
            <span className="px-2 py-0.5 rounded bg-[#528dff]/20 border border-[#afc6ff]/40 text-[#afc6ff] text-[11px] font-mono font-semibold">
              ACTIVE
            </span>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-medium text-[#c2c6d7]">
              Choose the road segment to update:
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
              {allSegments.map((seg) => (
                <button
                  key={seg.id}
                  onClick={() => setSelectedSegment(seg)}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    selectedSegment.id === seg.id
                      ? 'bg-[#272a32] border-[#afc6ff] text-[#e1e2ed]'
                      : 'bg-[#191b23] border-[#32353d] text-[#c2c6d7] hover:border-[#424754]'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-sm text-[#e1e2ed]">{seg.name}</div>
                    <div className="text-xs font-mono text-[#8c90a0]">
                      ID: {seg.roadCode} • {seg.distance}
                    </div>
                  </div>
                  <div className="text-xs font-mono font-bold uppercase">
                    {seg.status}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-[#424754] text-[#e1e2ed] font-bold text-xs hover:bg-[#272a32] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => setCurrentStep(2)}
              className="flex-[2] py-3 px-4 rounded-xl bg-[#afc6ff] hover:bg-[#d9e2ff] text-[#002d6d] font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md shadow-[#afc6ff]/20"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Select Route Status */}
      {currentStep === 2 && (
        <div className="bg-[#1A1A1A] border-t border-[#424754] px-5 pt-4 pb-8 flex flex-col gap-4 rounded-t-3xl shadow-[0_-15px_50px_rgba(0,0,0,0.9)] max-w-lg md:max-w-xl mx-auto w-full max-h-[85vh] overflow-y-auto">
          <div className="w-12 h-1 bg-[#424754] rounded-full mx-auto mb-1" />

          <div>
            <span className="text-[11px] font-mono text-[#afc6ff] uppercase tracking-widest">
              Step 2 of 4
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#e1e2ed] tracking-tight">
              Select Route Status
            </h2>
            <p className="text-xs text-[#c2c6d7] mt-0.5">
              Updating condition for <strong className="text-white">{selectedSegment.name}</strong>.
            </p>
          </div>

          {/* Status Selection Cards */}
          <div className="flex flex-col gap-2.5 my-1">
            {/* Blocked Option */}
            <label
              onClick={() => setSelectedStatus('blocked')}
              className={`p-3.5 rounded-xl border flex items-center gap-3.5 cursor-pointer transition-all ${
                selectedStatus === 'blocked'
                  ? 'bg-[#ffb4ab]/10 border-[#ffb4ab]'
                  : 'bg-[#262626] border-[#333333] hover:border-[#ffb4ab]/40'
              }`}
            >
              <div className="w-11 h-11 rounded-full bg-[#ffb4ab]/15 border border-[#ffb4ab]/30 flex items-center justify-center text-[#ffb4ab]">
                <Ban className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm text-[#ffb4ab]">Blocked</h3>
                <p className="text-xs text-[#c2c6d7]">Impassable to all traffic</p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selectedStatus === 'blocked'
                    ? 'border-[#ffb4ab] bg-[#ffb4ab] text-[#10131b]'
                    : 'border-[#424754]'
                }`}
              >
                {selectedStatus === 'blocked' && <CheckCircle2 className="w-4 h-4 fill-current" />}
              </div>
            </label>

            {/* Partial Option */}
            <label
              onClick={() => setSelectedStatus('partial')}
              className={`p-3.5 rounded-xl border flex items-center gap-3.5 cursor-pointer transition-all ${
                selectedStatus === 'partial'
                  ? 'bg-[#e96c16]/10 border-[#e96c16]'
                  : 'bg-[#262626] border-[#333333] hover:border-[#e96c16]/40'
              }`}
            >
              <div className="w-11 h-11 rounded-full bg-[#e96c16]/15 border border-[#e96c16]/30 flex items-center justify-center text-[#ffb68f]">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm text-[#ffb68f]">Partial</h3>
                <p className="text-xs text-[#c2c6d7]">Single lane or slow moving</p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selectedStatus === 'partial'
                    ? 'border-[#e96c16] bg-[#e96c16] text-[#10131b]'
                    : 'border-[#424754]'
                }`}
              >
                {selectedStatus === 'partial' && <CheckCircle2 className="w-4 h-4 fill-current" />}
              </div>
            </label>

            {/* Clear Option */}
            <label
              onClick={() => setSelectedStatus('clear')}
              className={`p-3.5 rounded-xl border flex items-center gap-3.5 cursor-pointer transition-all ${
                selectedStatus === 'clear'
                  ? 'bg-[#02c953]/10 border-[#40e56c]'
                  : 'bg-[#262626] border-[#333333] hover:border-[#40e56c]/40'
              }`}
            >
              <div className="w-11 h-11 rounded-full bg-[#02c953]/15 border border-[#40e56c]/30 flex items-center justify-center text-[#40e56c]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm text-[#40e56c]">Clear</h3>
                <p className="text-xs text-[#c2c6d7]">No delays, standard flow</p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selectedStatus === 'clear'
                    ? 'border-[#40e56c] bg-[#40e56c] text-[#10131b]'
                    : 'border-[#424754]'
                }`}
              >
                {selectedStatus === 'clear' && <CheckCircle2 className="w-4 h-4 fill-current" />}
              </div>
            </label>
          </div>

          {/* Action */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setCurrentStep(1)}
              className="py-3.5 px-4 rounded-xl border border-[#424754] text-[#e1e2ed] font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="flex-1 bg-[#528dff] hover:bg-[#afc6ff] text-[#00275f] font-bold text-xs sm:text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md shadow-[#528dff]/20"
            >
              <span>Continue to Evidence</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Add Photo Evidence & Notes */}
      {currentStep === 3 && (
        <div className="bg-[#1A1A1A] border-t border-[#424754] px-5 pt-4 pb-8 flex flex-col gap-4 rounded-t-3xl shadow-[0_-15px_50px_rgba(0,0,0,0.9)] max-w-lg md:max-w-xl mx-auto w-full max-h-[85vh] overflow-y-auto">
          <div className="w-12 h-1 bg-[#424754] rounded-full mx-auto mb-1" />

          <div>
            <span className="text-[11px] font-mono text-[#afc6ff] uppercase tracking-widest">
              Step 3 of 4
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#e1e2ed] tracking-tight">
              Add Photo Evidence
            </h2>
            <p className="text-xs text-[#c2c6d7] mt-0.5">
              Upload a photo of the obstruction to help others verify the report.
            </p>
          </div>

          {/* Photo Dropzone or Preview */}
          {photoUrl ? (
            <div className="relative rounded-2xl overflow-hidden border border-[#528dff] h-44 group">
              <img src={photoUrl} alt="Uploaded evidence" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <label className="p-2 bg-[#528dff] text-[#00275f] rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1">
                  <Camera className="w-4 h-4" /> Replace
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
                <button
                  onClick={() => setPhotoUrl(null)}
                  className="p-2 bg-[#ffb4ab] text-[#690005] rounded-lg font-bold text-xs cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="w-full h-40 border-2 border-dashed border-[#424754] hover:border-[#afc6ff] rounded-2xl bg-[#272a32]/60 hover:bg-[#272a32] flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors p-4">
                <div className="w-12 h-12 rounded-full bg-[#32353d] flex items-center justify-center text-[#afc6ff]">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <span className="text-sm font-bold text-[#e1e2ed]">Add Photo Evidence</span>
                  <p className="text-xs text-[#8c90a0] mt-0.5">JPG or PNG up to 10MB</p>
                </div>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>

              {/* Quick Preset Buttons for rapid testing */}
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPhotoUrl(ASSETS.trafficJamPhoto)}
                  className="flex-1 py-1.5 px-2 bg-[#272a32] border border-[#424754] text-[#c2c6d7] hover:text-[#afc6ff] rounded-lg text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ImageIcon className="w-3 h-3" /> Attach Traffic Photo
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoUrl(ASSETS.clearDawnRoadPhoto)}
                  className="flex-1 py-1.5 px-2 bg-[#272a32] border border-[#424754] text-[#c2c6d7] hover:text-[#40e56c] rounded-lg text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ImageIcon className="w-3 h-3" /> Attach Clear Road
                </button>
              </div>
            </div>
          )}

          {/* Notes Input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#c2c6d7]">
              Notes & Obstruction Description (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Provide additional details (e.g. fallen tree, construction, right lane closed)..."
              className="w-full bg-[#272a32] border border-[#424754] focus:border-[#afc6ff] rounded-xl p-3 text-xs text-[#e1e2ed] placeholder-[#8c90a0] focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleFinishSubmit}
              className="w-full bg-[#528dff] hover:bg-[#afc6ff] text-[#00275f] font-bold text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-[#528dff]/30"
            >
              <span>Submit Report for Telemetry Verification</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleFinishSubmit}
              className="w-full text-xs font-bold text-[#c2c6d7] hover:text-white py-2 transition-colors cursor-pointer"
            >
              Skip Photo & Submit Directly
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Success / Confidence Recalculating Overlay */}
      {currentStep === 4 && (
        <div className="fixed inset-0 z-50 bg-[#000000] flex flex-col justify-between p-6 map-grid-bg animate-in fade-in duration-300">
          {/* Map texture background */}
          <div className="absolute inset-0 opacity-40 mix-blend-screen pointer-events-none">
            <img src={ASSETS.recalculatingMap} alt="Map" className="w-full h-full object-cover" />
          </div>

          {/* Top Success Banner */}
          <div className="relative z-10 max-w-md mx-auto w-full pt-8">
            <div className="bg-[#10131b]/95 border border-[#40e56c] text-[#e1e2ed] p-4 rounded-2xl shadow-[0_0_30px_rgba(64,229,108,0.2)] flex items-start gap-3.5 animate-in slide-in-from-top-4 duration-300">
              <div className="w-10 h-10 rounded-full bg-[#40e56c]/20 border border-[#40e56c] flex items-center justify-center shrink-0 text-[#40e56c]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base text-[#40e56c]">Report Submitted!</h3>
                <p className="text-xs text-[#c2c6d7] mt-0.5 leading-relaxed">
                  Your report for <span className="text-white font-semibold">{selectedSegment.name}</span> ({selectedStatus.toUpperCase()}) has been received. Our system is currently verifying this with nearby telemetry.
                </p>
              </div>
            </div>
          </div>

          {/* Central Pulsing Road & Recalculating Badge */}
          <div className="relative z-10 flex flex-col items-center justify-center my-auto">
            {/* Simulated Road Line */}
            <div className="relative w-48 h-3 rounded-full rotate-45 mb-12 shadow-[0_0_25px_rgba(255,180,171,0.5)] border border-[#ffb4ab] bg-[#ffb4ab] animate-pulse">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#10131b] border border-[#ffb4ab] flex items-center justify-center shadow-xl">
                <AlertTriangle className="w-4 h-4 text-[#ffb4ab]" />
              </div>
            </div>

            {/* Recalculating Badge */}
            <div className="bg-[#ffb4ab]/10 border border-[#ffb4ab] text-[#ffb4ab] px-4 py-2 rounded-full flex items-center gap-2.5 backdrop-blur-md shadow-lg">
              <RotateCw className="w-4 h-4 animate-spin" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider">
                CONFIDENCE RECALCULATING...
              </span>
            </div>

            <div className="mt-3 text-xs font-mono text-[#8c90a0] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#40e56c]" />
              <span>Incorporating 14 nearby connected sensors</span>
            </div>
          </div>

          {/* Bottom Action */}
          <div className="relative z-10 max-w-md mx-auto w-full pb-4">
            <button
              onClick={onClose}
              id="btn-back-to-map"
              className="w-full bg-[#528dff] hover:bg-[#afc6ff] text-[#00275f] font-bold text-base py-4 rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#528dff]/30 active:scale-[0.98] transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Map</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
