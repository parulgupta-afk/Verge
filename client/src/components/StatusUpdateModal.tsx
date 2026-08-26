import React, { useState } from 'react';
import { X, CheckCircle2, Ban, AlertTriangle, ArrowRight } from 'lucide-react';
import { ReportStatus, RoadSegment } from '../types';

interface StatusUpdateModalProps {
  segmentName: string;
  currentStatus: ReportStatus;
  onClose: () => void;
  onConfirmUpdate: (status: ReportStatus, note?: string) => void;
}

export const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
  segmentName,
  currentStatus,
  onClose,
  onConfirmUpdate
}) => {
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus>(currentStatus);
  const [note, setNote] = useState<string>('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm bg-[#1d1f27] border border-[#424754] rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#e1e2ed]">Update Condition</h3>
            <p className="text-xs text-[#8c90a0]">{segmentName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#8c90a0] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status choices */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setSelectedStatus('blocked')}
            className={`w-full p-3 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
              selectedStatus === 'blocked'
                ? 'bg-[#ffb4ab]/15 border-[#ffb4ab] text-[#ffb4ab]'
                : 'bg-[#272a32] border-[#32353d] text-[#c2c6d7]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Ban className="w-4 h-4 text-[#ffb4ab]" />
              <span className="text-xs font-bold">Blocked (Impassable)</span>
            </div>
            {selectedStatus === 'blocked' && <CheckCircle2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus('partial')}
            className={`w-full p-3 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
              selectedStatus === 'partial'
                ? 'bg-[#e96c16]/15 border-[#e96c16] text-[#ffb68f]'
                : 'bg-[#272a32] border-[#32353d] text-[#c2c6d7]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-[#ffb68f]" />
              <span className="text-xs font-bold">Partial (Lane Delays)</span>
            </div>
            {selectedStatus === 'partial' && <CheckCircle2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus('clear')}
            className={`w-full p-3 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
              selectedStatus === 'clear'
                ? 'bg-[#02c953]/15 border-[#40e56c] text-[#40e56c]'
                : 'bg-[#272a32] border-[#32353d] text-[#c2c6d7]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#40e56c]" />
              <span className="text-xs font-bold">Clear (Standard Flow)</span>
            </div>
            {selectedStatus === 'clear' && <CheckCircle2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Note input */}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional remarks on current road status..."
          rows={2}
          className="w-full bg-[#272a32] border border-[#424754] focus:border-[#afc6ff] rounded-xl p-2.5 text-xs text-[#e1e2ed] focus:outline-none"
        />

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-[#424754] text-[#c2c6d7] rounded-xl text-xs font-bold hover:bg-[#272a32] cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirmUpdate(selectedStatus, note)}
            className="flex-1 py-2.5 bg-[#528dff] text-[#00275f] rounded-xl text-xs font-bold hover:bg-[#afc6ff] cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-[#528dff]/25"
          >
            <span>Update</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
