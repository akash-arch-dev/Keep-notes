import React, { useState } from 'react';
import {
  Pin,
  Palette,
  Image as ImageIcon,
  Archive,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Volume2,
  Video,
  Edit3,
  FileText,
  RotateCcw,
  FolderArchive,
  FolderDown,
  FileCode,
} from 'lucide-react';
import { Note, KeepColorId } from '../types';
import { KEEP_COLORS, getCardColorStyle } from '../utils/colors';
import { ConfirmModal } from './ConfirmModal';
import {
  exportNoteAsMarkdownProject,
  exportNoteToLocalDirectory,
  exportNoteAsStandaloneMarkdown,
  isDirectoryPickerSupported,
} from '../services/markdownExport';

interface NoteCardProps {
  note: Note;
  onOpen: (note: Note) => void;
  onTogglePin: (id: string) => void;
  onUpdateColor: (id: string, color: KeepColorId) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onTrash: (id: string) => void;
  onRestore: (id: string) => void;
  onDeletePermanent: (id: string) => void;
  onDuplicate: (note: Note) => void;
  isDark: boolean;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onOpen,
  onTogglePin,
  onUpdateColor,
  onArchive,
  onUnarchive,
  onTrash,
  onRestore,
  onDeletePermanent,
  onDuplicate,
  isDark,
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(note.activePageIndex || 0);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const pages = note.pages && note.pages.length > 0 ? note.pages : [];
  const safePageIndex = Math.min(Math.max(currentPageIndex, 0), Math.max(pages.length - 1, 0));
  const activePage = pages[safePageIndex];

  const cardStyle = getCardColorStyle(note.color, isDark);

  const handlePrevPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (safePageIndex > 0) {
      setCurrentPageIndex(safePageIndex - 1);
    }
  };

  const handleNextPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (safePageIndex < pages.length - 1) {
      setCurrentPageIndex(safePageIndex + 1);
    }
  };

  const calculateWordCount = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  return (
    <div
      onClick={() => onOpen(note)}
      style={cardStyle}
      className={`group relative rounded-2xl border transition-all duration-200 hover:shadow-xl cursor-pointer flex flex-col justify-between overflow-hidden mb-4 break-inside-avoid ${
        note.isPinned ? 'ring-1 ring-amber-400/40' : ''
      }`}
    >
      {/* Top Bar: Title & Pin */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <h3
            className={`font-semibold text-base leading-snug tracking-tight font-writing line-clamp-2 ${
              isDark ? 'text-gray-100' : 'text-gray-900'
            }`}
          >
            {note.title || (activePage?.title ? activePage.title : 'Untitled Story Note')}
          </h3>

          {!note.isTrashed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(note.id);
              }}
              className={`p-1.5 rounded-full transition cursor-pointer shrink-0 ${
                note.isPinned
                  ? 'text-amber-400 hover:bg-amber-400/20'
                  : 'text-gray-400 opacity-60 group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10'
              }`}
              title={note.isPinned ? 'Unpin note' : 'Pin note'}
            >
              <Pin size={17} className={note.isPinned ? 'fill-current' : ''} />
            </button>
          )}
        </div>

        {/* Multi-Page Navigation Header Pill */}
        {pages.length > 1 && (
          <div
            onClick={(e) => e.stopPropagation()}
            className={`mt-2 flex items-center justify-between px-2.5 py-1 rounded-lg text-xs font-medium border ${
              isDark
                ? 'bg-black/25 border-white/10 text-amber-300'
                : 'bg-black/5 border-black/10 text-amber-800'
            }`}
          >
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-bold font-mono">
                {safePageIndex + 1}/{pages.length}
              </span>
              <span className="text-gray-400">•</span>
              <span className="truncate">{activePage?.title || `Page ${safePageIndex + 1}`}</span>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={handlePrevPage}
                disabled={safePageIndex === 0}
                className="p-0.5 rounded-sm hover:bg-black/20 dark:hover:bg-white/20 disabled:opacity-30 transition cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={handleNextPage}
                disabled={safePageIndex === pages.length - 1}
                className="p-0.5 rounded-sm hover:bg-black/20 dark:hover:bg-white/20 disabled:opacity-30 transition cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Media Attachments Preview on Active Page */}
      {activePage?.media && activePage.media.length > 0 && (
        <div className="px-4 pb-2 space-y-2">
          {activePage.media.slice(0, 2).map((m) => {
            if (m.type === 'drawing' || m.type === 'image') {
              return (
                <div
                  key={m.id}
                  className="relative rounded-xl overflow-hidden border border-black/10 dark:border-white/10 max-h-48 bg-black/20"
                >
                  <img
                    src={m.url}
                    alt={m.name || 'Visual Media'}
                    className="w-full object-cover max-h-48"
                  />
                  {m.name && (
                    <span className="absolute bottom-1 left-2 text-[10px] bg-black/60 text-white px-2 py-0.5 rounded-md backdrop-blur-xs truncate max-w-[80%]">
                      {m.name}
                    </span>
                  )}
                </div>
              );
            }
            if (m.type === 'audio') {
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-2 p-2 rounded-xl bg-black/10 dark:bg-black/30 border border-black/10 dark:border-white/10 text-xs"
                >
                  <Volume2 size={16} className="text-amber-400 shrink-0" />
                  <span className="truncate text-gray-200">{m.name || 'Voice Memo'}</span>
                </div>
              );
            }
            if (m.type === 'video') {
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-2 p-2 rounded-xl bg-black/10 dark:bg-black/30 border border-black/10 dark:border-white/10 text-xs"
                >
                  <Video size={16} className="text-blue-400 shrink-0" />
                  <span className="truncate text-gray-200">{m.name || 'Video Reference'}</span>
                </div>
              );
            }
            return null;
          })}
          {activePage.media.length > 2 && (
            <div className="text-[10px] text-gray-400 font-medium">
              +{activePage.media.length - 2} more media attachments
            </div>
          )}
        </div>
      )}

      {/* Page Text Content Preview */}
      <div className="px-4 py-1 flex-1">
        <p
          className={`text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-writing line-clamp-6 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          {activePage?.content || (
            <span className="italic text-gray-400">Empty page. Click to write...</span>
          )}
        </p>
      </div>

      {/* Tags / Labels */}
      {note.tags && note.tags.length > 0 && (
        <div className="px-4 pt-2.5 pb-1 flex flex-wrap gap-1">
          {note.tags.map((t) => (
            <span
              key={t}
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                isDark
                  ? 'bg-black/30 text-amber-300/90 border border-amber-500/20'
                  : 'bg-black/5 text-amber-900 border border-black/10'
              }`}
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Card Footer: Word count & Quick Actions */}
      <div className="px-3 py-2 flex items-center justify-between border-t border-black/5 dark:border-white/5 mt-2">
        {/* Word count & Page count indicator */}
        <div className="text-[11px] text-gray-400 font-mono flex items-center gap-2">
          <span>{calculateWordCount(activePage?.content || '')} words</span>
          {pages.length > 1 && (
            <span className="px-1.5 py-0.2 rounded-sm bg-black/10 dark:bg-white/10 text-[10px]">
              {pages.length} pages
            </span>
          )}
        </div>

        {/* Quick action buttons */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-0.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
        >
          {note.isTrashed ? (
            <>
              <button
                onClick={() => onRestore(note.id)}
                className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-black/20 dark:hover:bg-white/10 transition"
                title="Restore note"
              >
                <RotateCcw size={15} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsConfirmDeleteOpen(true);
                }}
                className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-900/30 transition cursor-pointer"
                title="Delete forever"
              >
                <Trash2 size={15} />
              </button>
            </>
          ) : (
            <>
              {/* Color Palette Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowColorMenu(!showColorMenu)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-black/20 dark:hover:bg-white/10 transition cursor-pointer"
                  title="Note color"
                >
                  <Palette size={15} />
                </button>

                {showColorMenu && (
                  <div className="absolute bottom-8 right-0 z-40 bg-[#292a2d] p-2 rounded-xl shadow-2xl border border-gray-700 flex flex-wrap gap-1.5 w-44">
                    {Object.values(KEEP_COLORS).map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          onUpdateColor(note.id, c.id);
                          setShowColorMenu(false);
                        }}
                        className={`w-6 h-6 rounded-full border transition hover:scale-110 ${
                          note.color === c.id ? 'ring-2 ring-amber-400' : 'border-gray-600'
                        }`}
                        style={{ backgroundColor: isDark ? c.darkBg : c.lightBg }}
                        title={c.name}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Archive */}
              <button
                onClick={() => (note.isArchived ? onUnarchive(note.id) : onArchive(note.id))}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-black/20 dark:hover:bg-white/10 transition cursor-pointer"
                title={note.isArchived ? 'Unarchive' : 'Archive'}
              >
                <Archive size={15} />
              </button>

              {/* More options dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-black/20 dark:hover:bg-white/10 transition cursor-pointer"
                >
                  <MoreVertical size={15} />
                </button>

                {showMoreMenu && (
                  <div className="absolute bottom-8 right-0 z-40 bg-[#292a2d] py-1 rounded-xl shadow-2xl border border-gray-700 min-w-[140px] text-xs text-gray-200">
                    <button
                      onClick={() => {
                        onDuplicate(note);
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-800 flex items-center gap-2"
                    >
                      <Copy size={13} />
                      Duplicate Note
                    </button>
                    <div className="my-1 border-t border-gray-700/60" />
                    {isDirectoryPickerSupported() && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          setShowMoreMenu(false);
                          try {
                            const folder = await exportNoteToLocalDirectory(note);
                            alert(`Saved note folder to: ${folder}`);
                          } catch (err: any) {
                            if (err.name !== 'AbortError') {
                              alert(`Folder export error: ${err?.message || 'Error'}`);
                            }
                          }
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-amber-500/20 text-amber-300 flex items-center gap-2"
                        title="Directly write note folder to your computer disk"
                      >
                        <FolderDown size={13} />
                        Export to Local Folder
                      </button>
                    )}
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        setShowMoreMenu(false);
                        try {
                          await exportNoteAsMarkdownProject(note);
                        } catch (err: any) {
                          alert(`Export failed: ${err?.message || 'Error'}`);
                        }
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-amber-500/20 text-amber-300 flex items-center gap-2"
                      title="Download note folder with index.md and assets/ as .zip"
                    >
                      <FolderArchive size={13} />
                      Export Folder (.zip)
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMoreMenu(false);
                        try {
                          exportNoteAsStandaloneMarkdown(note);
                        } catch (err: any) {
                          alert(`Export failed: ${err?.message || 'Error'}`);
                        }
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-800 text-gray-300 flex items-center gap-2"
                      title="Download index.md file"
                    >
                      <FileCode size={13} />
                      Export index.md
                    </button>
                    <div className="my-1 border-t border-gray-700/60" />
                    <button
                      onClick={() => {
                        onTrash(note.id);
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-red-900/30 text-red-300 flex items-center gap-2"
                    >
                      <Trash2 size={13} />
                      Move to Trash
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Confirmation Dialog before permanent delete */}
      {isConfirmDeleteOpen && (
        <ConfirmModal
          isOpen={isConfirmDeleteOpen}
          title="Delete Note Forever"
          message={`Are you sure you want to permanently delete "${note.title || 'Untitled Story Note'}"? This action cannot be undone.`}
          confirmLabel="Delete Forever"
          isDestructive={true}
          onConfirm={() => {
            onDeletePermanent(note.id);
            setIsConfirmDeleteOpen(false);
          }}
          onCancel={() => setIsConfirmDeleteOpen(false)}
        />
      )}
    </div>
  );
};
