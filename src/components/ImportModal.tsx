import React, { useState, useRef } from 'react';
import { X, Upload, Check, AlertCircle, FileText } from 'lucide-react';
import { importData } from '../services/storage';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImportSuccess }) => {
  const [jsonText, setJsonText] = useState('');
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setJsonText(reader.result as string);
      setError(null);
      setStatus(`Loaded file: ${file.name}`);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (!jsonText.trim()) {
      setError('Please provide backup JSON data.');
      return;
    }
    setError(null);
    try {
      const result = await importData(jsonText, mode);
      setStatus(`Successfully imported ${result.notesCount} notes and ${result.vocabCount} vocabulary items!`);
      setTimeout(() => {
        onImportSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err?.message || 'Failed to parse JSON backup file.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="flex flex-col w-full max-w-md bg-[#292a2d] text-gray-100 rounded-2xl shadow-2xl border border-gray-700/80 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-700/70 bg-[#202124]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Upload size={18} />
            </span>
            <span className="font-semibold text-sm md:text-base">Import Backup (JSON)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-gray-300 leading-relaxed">
            Transfer notes, drawings, audio, and vocabulary between your Arch Linux machine and Android device.
          </p>

          {/* Mode selector */}
          <div className="flex gap-2 p-1 bg-gray-800 rounded-xl border border-gray-700 text-xs">
            <button
              onClick={() => setMode('merge')}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
                mode === 'merge' ? 'bg-amber-500 text-black shadow-xs' : 'text-gray-400 hover:text-white'
              }`}
            >
              Merge with Current
            </button>
            <button
              onClick={() => setMode('replace')}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
                mode === 'replace' ? 'bg-red-500 text-white shadow-xs' : 'text-gray-400 hover:text-white'
              }`}
            >
              Replace All
            </button>
          </div>

          {/* File picker */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 px-3 rounded-xl border-2 border-dashed border-gray-700 hover:border-amber-500/60 bg-gray-800/40 hover:bg-gray-800/80 flex flex-col items-center justify-center gap-1.5 text-xs font-medium text-gray-300 transition cursor-pointer"
          >
            <FileText size={22} className="text-amber-400" />
            <span>Select .json Backup File</span>
          </button>

          {/* Paste JSON */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 mb-1">Or paste JSON content:</label>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={4}
              placeholder='{"version": 1, "notes": [...], "vocabulary": [...]}'
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 font-mono text-[11px] text-gray-200 focus:outline-hidden focus:border-amber-500 resize-none"
            />
          </div>

          {status && (
            <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
              <Check size={14} className="shrink-0" />
              <span>{status}</span>
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-700/70 bg-[#202124]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-gray-300 hover:bg-gray-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleExecuteImport}
            disabled={!jsonText.trim()}
            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-semibold text-xs transition"
          >
            Import Data
          </button>
        </div>
      </div>
    </div>
  );
};
