import React, { useState } from 'react';
import { Clock, CheckCircle, XCircle, Camera, FileEdit, X, ArrowRight, ShieldCheck, ShieldQuestion, Check, Loader2 } from 'lucide-react';
import { RoadSegment, ReportStatus } from '../types';
import { uploadReportMedia } from '../lib/segmentsApi';

interface SegmentDetailSheetProps {
  segment: RoadSegment;
  onClose: () => void;
  onConfirm: (segmentId: string) => void;
  onRefute: (segmentId: string) => void;
  onReportUpdate: (segment: RoadSegment) => void;
  onNextStep?: () => void;
}

export const SegmentDetailSheet: React.FC<SegmentDetailSheetProps> = ({
  segment,
  onClose,
  onConfirm,
  onRefute,
  onReportUpdate,
  onNextStep
}) => {
  const [userVoted, setUserVoted] = useState<'confirmed' | 'refuted' | null>(null);
  const [customNote, setCustomNote] = useState<string>(segment.notes || '');
  const [photoPreview, setPhotoPreview] = useState<string | null>(segment.photoUrl || null);
  const [photoUploadedUrl, setPhotoUploadedUrl] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUploadFailed, setPhotoUploadFailed] = useState(false);

  const handleVote = (type: 'confirmed' | 'refuted') => {
    setUserVoted(type);
    if (type === 'confirmed') onConfirm(segment.id);
    else onRefute(segment.id);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    // Local preview shows immediately, but this is NOT verification —
    // it's just what the user selected, before it's even uploaded.
    const localPreviewUrl = URL.createObjectURL(file);
    setPhotoPreview(localPreviewUrl);
    setPhotoUploadedUrl(null);
    setPhotoUploadFailed(false);
    setPhotoUploading(true);

    const uploadedUrl = await uploadReportMedia(file);
    setPhotoUploading(false);

    if (uploadedUrl) {
      setPhotoUploadedUrl(uploadedUrl);
    } else {
      // Upload failed or backend not configured — keep the local preview
      // visible for the user's own reference, but never claim it's attached
      // to the report or verified in any way.
      setPhotoUploadFailed(true);
    }
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'blocked':
        return (
          <span className="px-2.5 py-1 rounded bg-[#ffb4ab]/10 border border-[#ffb4ab] text-[#ffb4ab] font-bold text-xs uppercase tracking-wider">
            Blocked
          </span>
        );
      case 'partial':
        return (
          <span className="px-2.5 py-1 rounded bg-[#ffb68f]/10 border border-[#ffb68f] text-[#ffb68f] font-bold text-xs uppercase tracking-wider">
            Partial
          </span>
        );
      case 'clear':
        return (
          <span className="px-2.5 py-1 rounded bg-[#40e56c]/10 border border-[#40e56c] text-[#40e56c] font-bold text-xs uppercase tracking-wider">
            Clear
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 bg-[#1d1f27] border-t border-[#424754] rounded-t-3xl shadow-[0_-15px_50px_rgba(0,0,0,0.8)] max-w-lg md:max-w-xl mx-auto max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
      {/* Grabber Bar */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-12 h-1 bg-[#424754] rounded-full" />
      </div>

      <div className="px-5 pb-20 pt-2 space-y-4">
        {/* Header Section */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl sm:text-2xl font-bold text-[#e1e2ed] tracking-tight">
                {segment.name}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#c2c6d7]">
              <span>SEGMENT ID: {segment.roadCode}</span>
              <span className="w-1 h-1 rounded-full bg-[#424754]" />
              <span>{segment.distance}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(segment.status)}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#272a32] hover:bg-[#32353d] border border-[#424754] flex items-center justify-center text-[#c2c6d7] cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Timestamp */}
        <p className="text-xs text-[#c2c6d7] flex items-center gap-1.5 font-medium">
          <Clock className="w-3.5 h-3.5 text-[#8c90a0]" />
          Updated {segment.updatedAt}
        </p>

        {/* Confidence Section */}
        <div className="bg-[#191b23] border border-[#32353d] rounded-2xl p-4 space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl font-black text-[#e1e2ed] tracking-tight">
                {segment.confidence}%
              </div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-[#8c90a0]">
                Confidence
              </div>
            </div>
            <div className="text-xs text-right text-[#c2c6d7] font-medium">
              <span className="text-[#40e56c] font-bold">{segment.confirms} confirms</span>
              <br />
              <span className="text-[#8c90a0]">{segment.refutes} refute</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-[#32353d] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                segment.status === 'blocked'
                  ? 'bg-[#ffb4ab]'
                  : segment.status === 'partial'
                  ? 'bg-[#ffb68f]'
                  : 'bg-[#40e56c]'
              }`}
              style={{ width: `${segment.confidence}%` }}
            />
          </div>
        </div>

        {/* Evidence Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-[#c2c6d7]">
            <span>Evidence & Imagery</span>
            {photoPreview && photoUploading && (
              <span className="text-[11px] text-[#c2c6d7] flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Uploading…
              </span>
            )}
            {photoPreview && !photoUploading && photoUploadedUrl && (
              <span className="text-[11px] text-[#ffb68f] flex items-center gap-1">
                <ShieldQuestion className="w-3 h-3" /> Attached, not yet verified
              </span>
            )}
            {photoPreview && !photoUploading && photoUploadFailed && (
              <span className="text-[11px] text-[#ffb4ab] flex items-center gap-1">
                <ShieldQuestion className="w-3 h-3" /> Upload failed — not attached
              </span>
            )}
          </div>

          {photoPreview ? (
            <div className="relative rounded-xl overflow-hidden border border-[#424754] h-32 group">
              <img
                src={photoPreview}
                alt="Obstruction Evidence"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5">
                <span className="text-xs text-white font-mono">
                  {photoUploadedUrl
                    ? 'Attached to report — content not verified'
                    : photoUploadFailed
                    ? 'Not saved — local preview only'
                    : 'Uploading…'}
                </span>
              </div>
            </div>
          ) : (
            <label className="w-full h-24 border-2 border-dashed border-[#424754] hover:border-[#afc6ff] rounded-xl bg-[#272a32]/60 hover:bg-[#272a32] flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors">
              <Camera className="w-6 h-6 text-[#c2c6d7]" />
              <span className="text-xs font-bold text-[#c2c6d7]">Add Photo Evidence</span>
              <span className="text-[10px] text-[#8c90a0]">JPG or PNG up to 10MB</span>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          )}
        </div>

        {/* Notes (Optional) */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#c2c6d7]">
            Notes & Details
          </label>
          <textarea
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            rows={2}
            placeholder="Provide additional details (e.g. fallen tree, construction, right lane blocked)..."
            className="w-full bg-[#272a32] border border-[#424754] focus:border-[#afc6ff] rounded-xl p-3 text-xs text-[#e1e2ed] placeholder-[#8c90a0] focus:outline-none transition-colors"
          />
        </div>

        {/* Primary Voting / Confirmation Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => handleVote('confirmed')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              userVoted === 'confirmed'
                ? 'bg-[#40e56c] text-[#003912] shadow-md shadow-[#40e56c]/30'
                : 'bg-[#528dff] hover:bg-[#afc6ff] text-[#00275f]'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>{userVoted === 'confirmed' ? 'Confirmed (+1)' : 'Confirm'}</span>
          </button>

          <button
            onClick={() => handleVote('refuted')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer ${
              userVoted === 'refuted'
                ? 'bg-[#ffb4ab] text-[#690005] border-[#ffb4ab]'
                : 'bg-transparent border-[#424754] text-[#e1e2ed] hover:bg-[#32353d]'
            }`}
          >
            <XCircle className="w-4 h-4" />
            <span>{userVoted === 'refuted' ? 'Refuted (-1)' : 'Refute'}</span>
          </button>
        </div>

        {/* Update / Report Step Flow Action */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onReportUpdate(segment)}
            className="flex-1 py-3 px-4 bg-[#272a32] hover:bg-[#32353d] text-[#e1e2ed] border border-[#424754] rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <FileEdit className="w-4 h-4" />
            <span>Report Update</span>
          </button>

          {onNextStep && (
            <button
              onClick={onNextStep}
              className="flex-1 py-3 px-4 bg-[#afc6ff] hover:bg-[#d9e2ff] text-[#002d6d] rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md shadow-[#afc6ff]/20"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
