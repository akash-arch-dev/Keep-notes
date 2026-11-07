import React from 'react';
import { X, Terminal, Smartphone, Keyboard, Sparkles, Check } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="flex flex-col w-full max-w-lg bg-[#292a2d] text-gray-100 rounded-2xl shadow-2xl border border-gray-700/80 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-700/70 bg-[#202124]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Terminal size={18} />
            </span>
            <span className="font-semibold text-sm md:text-base">
              Linux (Arch) & Android Shortcuts
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Arch Linux Keyboard Shortcuts */}
          <div>
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Keyboard size={15} />
              Linux / Desktop Shortcuts
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-800/80 border border-gray-700/60">
                <span className="text-gray-300">Focus Global Search</span>
                <kbd className="px-2 py-0.5 rounded-md bg-gray-900 text-amber-300 font-mono text-[11px] border border-gray-700">
                  /
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-800/80 border border-gray-700/60">
                <span className="text-gray-300">Take a new Note</span>
                <kbd className="px-2 py-0.5 rounded-md bg-gray-900 text-amber-300 font-mono text-[11px] border border-gray-700">
                  c
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-800/80 border border-gray-700/60">
                <span className="text-gray-300">Save Note / Close Modal</span>
                <kbd className="px-2 py-0.5 rounded-md bg-gray-900 text-amber-300 font-mono text-[11px] border border-gray-700">
                  Ctrl + Enter
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-800/80 border border-gray-700/60">
                <span className="text-gray-300">Close open Dialog or Drawer</span>
                <kbd className="px-2 py-0.5 rounded-md bg-gray-900 text-amber-300 font-mono text-[11px] border border-gray-700">
                  Esc
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-800/80 border border-gray-700/60">
                <span className="text-gray-300">Toggle Vocabulary Codex Map</span>
                <kbd className="px-2 py-0.5 rounded-md bg-gray-900 text-amber-300 font-mono text-[11px] border border-gray-700">
                  Alt + V
                </kbd>
              </div>
            </div>
          </div>

          {/* Android Mobile & Touch Optimization */}
          <div>
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Smartphone size={15} />
              Android & Touch Experience
            </h4>
            <div className="space-y-2 text-xs text-gray-300 leading-relaxed bg-gray-800/60 p-3.5 rounded-xl border border-gray-700/60">
              <p>
                • <strong>PWA Installation</strong>: Tap the "Install PWA" button in the header or Chrome menu to install KeepScribe as a standalone app on Android or Linux desktop.
              </p>
              <p>
                • <strong>Touch & Stylus Sketching</strong>: The drawing canvas supports stylus and finger pressure on Android tablets or phones.
              </p>
              <p>
                • <strong>Voice Dictation / Audio Memos</strong>: Record vocal scene descriptions with live waveform meter.
              </p>
              <p>
                • <strong>Offline Support</strong>: All data is stored in high-capacity local IndexedDB; notes and vocabulary are available even without network.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 border-t border-gray-700/70 bg-[#202124]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
