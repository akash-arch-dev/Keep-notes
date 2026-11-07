import React, { useState } from 'react';
import {
  X,
  Download,
  FolderArchive,
  FolderDown,
  FileCode,
  BookOpen,
  Database,
  Check,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Note, VocabularyItem } from '../types';
import {
  exportAllNotesAsMarkdownWorkspace,
  exportAllNotesToLocalDirectory,
  buildVocabularyMarkdown,
  triggerFileDownload,
  isDirectoryPickerSupported,
} from '../services/markdownExport';
import { exportAllData } from '../services/storage';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  vocabulary: VocabularyItem[];
  isDark: boolean;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  notes,
  vocabulary,
  isDark,
}) => {
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [isExportingFolder, setIsExportingFolder] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const canUseDirectoryPicker = isDirectoryPickerSupported();

  const handleExportDirectFolder = async () => {
    setIsExportingFolder(true);
    setExportSuccess(null);
    try {
      const folderPath = await exportAllNotesToLocalDirectory(notes, vocabulary);
      setExportSuccess(`Saved real folders directly to: ${folderPath}!`);
      setTimeout(() => setExportSuccess(null), 4000);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        alert(`Folder export error: ${err?.message || 'Failed to write to folder'}`);
      }
    } finally {
      setIsExportingFolder(false);
    }
  };

  const handleExportMarkdownWorkspace = async () => {
    setIsExportingZip(true);
    setExportSuccess(null);
    try {
      await exportAllNotesAsMarkdownWorkspace(notes, vocabulary);
      setExportSuccess('Notes project folder archive (.zip) downloaded successfully!');
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (err: any) {
      alert(`Export failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleExportJson = async () => {
    try {
      await exportAllData();
      setExportSuccess('JSON database backup downloaded!');
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (err: any) {
      alert(`JSON export failed: ${err?.message || 'Unknown error'}`);
    }
  };

  const handleExportVocabMarkdown = () => {
    try {
      const vocabMd = buildVocabularyMarkdown(vocabulary);
      const blob = new Blob([vocabMd], { type: 'text/markdown;charset=utf-8' });
      triggerFileDownload(blob, `keepscribe-vocabulary-${new Date().toISOString().split('T')[0]}.md`);
      setExportSuccess('Vocabulary Codex .md downloaded!');
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (err: any) {
      alert(`Export failed: ${err?.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        className={`flex flex-col w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden transition-colors ${
          isDark
            ? 'bg-[#292a2d] text-gray-100 border-gray-700/80'
            : 'bg-white text-gray-900 border-gray-300'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b ${
            isDark ? 'bg-[#202124] border-gray-700/70' : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-500">
              <Download size={20} />
            </span>
            <div>
              <h3 className="font-bold text-base tracking-tight font-writing">
                Export Studio Projects & Notes
              </h3>
              <p className="text-xs text-gray-400">
                Choose format for Obsidian, VS Code, publishing, or backup
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-3.5">
          {exportSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <Check size={16} className="shrink-0" />
              <span className="font-medium">{exportSuccess}</span>
            </div>
          )}

          {/* Option 1: Direct Local Folder Export (No unzip needed) */}
          {canUseDirectoryPicker && (
            <div
              onClick={handleExportDirectFolder}
              className={`p-4 rounded-xl border transition-all cursor-pointer group flex items-start gap-3.5 ${
                isDark
                  ? 'bg-amber-500/10 hover:bg-amber-500/15 border-amber-500/40 hover:border-amber-400'
                  : 'bg-amber-50 hover:bg-amber-100/60 border-amber-300 hover:border-amber-500'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-amber-500/25 text-amber-400 shrink-0 group-hover:scale-105 transition">
                {isExportingFolder ? <Loader2 size={22} className="animate-spin text-amber-400" /> : <FolderDown size={22} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm tracking-tight text-amber-300">
                    Export Directly to Local Folder (No Unzip Needed)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-black uppercase tracking-wider">
                    Native Disk
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                  Select any destination folder on your computer. Writes real folders for every note with <code className="text-amber-300 font-mono">index.md</code>, independent page <code className="text-amber-300 font-mono">.md</code> files, and <code className="text-amber-300 font-mono">assets/</code> subfolders containing all audio, sketches, and images.
                </p>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-amber-400/90 font-medium">
                  <span>⚡ Instant real folder creation on your local drive</span>
                </div>
              </div>
            </div>
          )}

          {/* Option 2: Notes Folder Archive (.zip) */}
          <div
            onClick={handleExportMarkdownWorkspace}
            className={`p-4 rounded-xl border transition-all cursor-pointer group flex items-start gap-3.5 ${
              isDark
                ? 'bg-gray-800/60 hover:bg-gray-800 border-gray-700 hover:border-amber-500/50'
                : 'bg-gray-50 hover:bg-amber-50/50 border-gray-200 hover:border-amber-400'
            }`}
          >
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 group-hover:scale-105 transition">
              {isExportingZip ? <Loader2 size={22} className="animate-spin" /> : <FolderArchive size={22} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight">
                  Markdown Projects Workspace (.zip)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-black uppercase tracking-wider">
                  Recommended
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Exports every note into its own project folder containing a complete{' '}
                <code className="text-amber-400 font-mono">index.md</code> and an{' '}
                <code className="text-amber-400 font-mono">assets/</code> subfolder with all drawings,
                sketches, audio recordings, and videos. Includes a master{' '}
                <code className="font-mono">README.md</code> index and{' '}
                <code className="font-mono">vocabulary.md</code>.
              </p>
              <div className="mt-2.5 flex items-center gap-2 text-[11px] text-gray-400">
                <span>📁 {notes.length} note folders</span>
                <span>•</span>
                <span>Ready for Obsidian, VS Code, Typora</span>
              </div>
            </div>
          </div>

          {/* Option 2: JSON Database Backup */}
          <div
            onClick={handleExportJson}
            className={`p-4 rounded-xl border transition-all cursor-pointer group flex items-start gap-3.5 ${
              isDark
                ? 'bg-gray-800/40 hover:bg-gray-800 border-gray-700 hover:border-blue-500/50'
                : 'bg-gray-50 hover:bg-blue-50/50 border-gray-200 hover:border-blue-400'
            }`}
          >
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 shrink-0 group-hover:scale-105 transition">
              <Database size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-bold text-sm tracking-tight">
                JSON Database Backup (.json)
              </span>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Full portable database snapshot for restoring your creative studio or syncing
                seamlessly across Arch Linux and Android PWA instances.
              </p>
            </div>
          </div>

          {/* Option 3: Vocabulary Codex Markdown */}
          <div
            onClick={handleExportVocabMarkdown}
            className={`p-4 rounded-xl border transition-all cursor-pointer group flex items-start gap-3.5 ${
              isDark
                ? 'bg-gray-800/40 hover:bg-gray-800 border-gray-700 hover:border-purple-500/50'
                : 'bg-gray-50 hover:bg-purple-50/50 border-gray-200 hover:border-purple-400'
            }`}
          >
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 shrink-0 group-hover:scale-105 transition">
              <BookOpen size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-bold text-sm tracking-tight">
                Vocabulary Codex (.md)
              </span>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Exports all {vocabulary.length} key-value vocabulary terms, pronunciations,
                etymology, and story examples into a clean reference Markdown document.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={`px-5 py-3 border-t flex items-center justify-between text-xs ${
            isDark ? 'bg-[#202124] border-gray-700/70 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-400" />
            <span>Individual notes can also be exported directly from their note card or editor!</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
