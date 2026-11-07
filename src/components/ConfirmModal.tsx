import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="flex flex-col w-full max-w-md bg-[#292a2d] text-gray-100 rounded-2xl shadow-2xl border border-gray-700/80 overflow-hidden scale-100 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/70 bg-[#202124]">
          <div className="flex items-center gap-2.5">
            <span
              className={`p-1.5 rounded-lg ${
                isDestructive ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              <AlertTriangle size={18} />
            </span>
            <h3 className="font-bold text-sm md:text-base text-gray-100">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Message Body */}
        <div className="p-6">
          <p className="text-xs md:text-sm text-gray-300 leading-relaxed">{message}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-gray-700/70 bg-[#202124]">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:bg-gray-800 transition cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-md transition active:scale-95 cursor-pointer ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-amber-500 hover:bg-amber-400 text-black'
            }`}
          >
            {isDestructive && <Trash2 size={14} />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
