import React, { useState, useRef, useEffect } from 'react';
import {
  Pin,
  Palette,
  Image as ImageIcon,
  Edit3,
  Volume2,
  Video,
  Plus,
  X,
  BookOpen,
  Tag,
  Check,
} from 'lucide-react';
import { Note, NotePage, MediaItem, KeepColorId, VocabularyItem } from '../types';
import { KEEP_COLORS, getCardColorStyle } from '../utils/colors';
import { DrawingModal } from './DrawingModal';
import { AudioRecorderModal } from './AudioRecorderModal';
import { VideoModal } from './VideoModal';
import { VocabularyDrawer } from './VocabularyDrawer';
import { ConfirmModal } from './ConfirmModal';
import { uploadMediaToSupabase } from '../services/supabase';

interface NoteComposerProps {
  onSaveNote: (note: Note) => void;
  vocabulary: VocabularyItem[];
  isDark: boolean;
}

export const NoteComposer: React.FC<NoteComposerProps> = ({
  onSaveNote,
  vocabulary,
  isDark,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [color, setColor] = useState<KeepColorId>('default');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [tagsInput, setTagsInput] = useState('');

  // Multi-page state
  const [pages, setPages] = useState<NotePage[]>([
    {
      id: `p-${Date.now()}`,
      title: 'Page 1',
      content: '',
      media: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ]);
  const [activePageIndex, setActivePageIndex] = useState(0);

  // Modals state
  const [isDrawingOpen, setIsDrawingOpen] = useState(false);
  const [isAudioOpen, setIsAudioOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isVocabDrawerOpen, setIsVocabDrawerOpen] = useState(false);
  const [pageIndexToDelete, setPageIndexToDelete] = useState<number | null>(null);

  const composerRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const activePage = pages[activePageIndex] || pages[0];

  // Collapse when clicking outside if empty
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (composerRef.current && !composerRef.current.contains(e.target as Node)) {
        // If has content, save and close; if completely blank, just close
        if (isExpanded) {
          handleAutoSaveOrClose();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded, title, pages, tagsInput, color, isPinned]);

  const handleAutoSaveOrClose = () => {
    const hasAnyContent =
      title.trim() ||
      pages.some((p) => p.content.trim() || p.media.length > 0) ||
      tagsInput.trim();

    if (hasAnyContent) {
      handleFinalSave();
    } else {
      resetComposer();
    }
  };

  const resetComposer = () => {
    setTitle('');
    setIsPinned(false);
    setColor('default');
    setTagsInput('');
    setPages([
      {
        id: `p-${Date.now()}`,
        title: 'Page 1',
        content: '',
        media: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]);
    setActivePageIndex(0);
    setIsExpanded(false);
    setShowColorPicker(false);
    setIsVocabDrawerOpen(false);
  };

  const handleFinalSave = () => {
    const hasAnyContent =
      title.trim() ||
      pages.some((p) => p.content.trim() || p.media.length > 0) ||
      tagsInput.trim();

    if (!hasAnyContent) {
      resetComposer();
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));

    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: title.trim(),
      color,
      isPinned,
      isArchived: false,
      isTrashed: false,
      tags,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      activePageIndex: 0,
      pages,
    };

    onSaveNote(newNote);
    resetComposer();
  };

  // Page Operations
  const handleAddPage = () => {
    const newPageNum = pages.length + 1;
    const newPage: NotePage = {
      id: `p-${Date.now()}-${newPageNum}`,
      title: `Page ${newPageNum}`,
      content: '',
      media: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setPages([...pages, newPage]);
    setActivePageIndex(pages.length);
  };

  const handleUpdatePageContent = (newContent: string) => {
    setPages((prev) =>
      prev.map((p, idx) =>
        idx === activePageIndex ? { ...p, content: newContent, updatedAt: Date.now() } : p
      )
    );
  };

  const handleUpdatePageTitle = (newTitle: string) => {
    setPages((prev) =>
      prev.map((p, idx) => (idx === activePageIndex ? { ...p, title: newTitle } : p))
    );
  };

  const requestDeletePage = (pageIdx: number) => {
    if (pages.length <= 1) return;
    setPageIndexToDelete(pageIdx);
  };

  const confirmDeletePage = () => {
    if (pageIndexToDelete === null || pages.length <= 1) return;
    const pageIdx = pageIndexToDelete;
    const updated = pages.filter((_, idx) => idx !== pageIdx);
    setPages(updated);
    setActivePageIndex(Math.max(0, pageIdx - 1));
    setPageIndexToDelete(null);
  };

  // Attachments
  const handleAttachMedia = (mediaItem: MediaItem) => {
    setPages((prev) =>
      prev.map((p, idx) =>
        idx === activePageIndex ? { ...p, media: [...p.media, mediaItem] } : p
      )
    );

    // Optional background sync to Supabase bucket
    const supaType = mediaItem.type === 'drawing' ? 'image' : mediaItem.type;
    uploadMediaToSupabase(mediaItem.url, mediaItem.name || 'Attachment', supaType)
      .then((rec) => {
        if (rec?.public_url) {
          setPages((prev) =>
            prev.map((p) => ({
              ...p,
              media: p.media.map((m) => (m.id === mediaItem.id ? { ...m, url: rec.public_url || m.url } : m)),
            }))
          );
        }
      })
      .catch((err) => console.log('Supabase auto-upload standby:', err.message));
  };

  const handleRemoveMedia = (mediaId: string) => {
    setPages((prev) =>
      prev.map((p, idx) =>
        idx === activePageIndex
          ? { ...p, media: p.media.filter((m) => m.id !== mediaId) }
          : p
      )
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const newMedia: MediaItem = {
        id: `img-${Date.now()}`,
        type: 'image',
        url: reader.result as string,
        name: file.name,
        createdAt: Date.now(),
      };
      handleAttachMedia(newMedia);
    };
    reader.readAsDataURL(file);
  };

  const containerStyle = getCardColorStyle(color, isDark);

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 px-2 md:px-0">
      <div
        ref={composerRef}
        style={containerStyle}
        className={`rounded-2xl border transition-all duration-200 shadow-lg ${
          isExpanded ? 'p-4' : 'p-3 flex items-center justify-between cursor-text'
        }`}
        onClick={() => {
          if (!isExpanded) setIsExpanded(true);
        }}
      >
        {!isExpanded ? (
          /* Collapsed State */
          <>
            <span className="text-sm md:text-base font-medium text-gray-400 pl-2">
              Take a story note or chapter draft...
            </span>
            <div className="flex items-center gap-1 text-gray-400">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(true);
                  setIsDrawingOpen(true);
                }}
                className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 hover:text-amber-400 transition cursor-pointer"
                title="New Drawing / Map Sketch"
              >
                <Edit3 size={18} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(true);
                  setIsAudioOpen(true);
                }}
                className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 hover:text-amber-400 transition cursor-pointer"
                title="Record Audio Memo"
              >
                <Volume2 size={18} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(true);
                  imageInputRef.current?.click();
                }}
                className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 hover:text-amber-400 transition cursor-pointer"
                title="Attach Image"
              >
                <ImageIcon size={18} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(true);
                  setIsVideoOpen(true);
                }}
                className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 hover:text-blue-400 transition cursor-pointer"
                title="Attach Video"
              >
                <Video size={18} />
              </button>
            </div>
          </>
        ) : (
          /* Expanded Multi-Page Composer State */
          <div className="space-y-3 relative">
            {/* Title & Pin Bar */}
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Story Note Title..."
                className={`w-full bg-transparent font-bold text-base md:text-lg focus:outline-hidden placeholder-gray-500 font-writing ${
                  isDark ? 'text-gray-100' : 'text-gray-900'
                }`}
              />
              <button
                type="button"
                onClick={() => setIsPinned(!isPinned)}
                className={`p-1.5 rounded-full transition cursor-pointer shrink-0 ${
                  isPinned
                    ? 'text-amber-400 hover:bg-amber-400/20'
                    : 'text-gray-400 hover:bg-black/10 dark:hover:bg-white/10'
                }`}
                title={isPinned ? 'Unpin' : 'Pin to top'}
              >
                <Pin size={18} className={isPinned ? 'fill-current' : ''} />
              </button>
            </div>

            {/* Multi-Page Tabs Header */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-black/10 dark:border-white/10">
              {pages.map((p, idx) => (
                <div
                  key={p.id}
                  onClick={() => setActivePageIndex(idx)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer transition shrink-0 ${
                    activePageIndex === idx
                      ? 'bg-amber-500 text-black shadow-xs'
                      : 'bg-black/10 dark:bg-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <span>{p.title || `Page ${idx + 1}`}</span>
                  {pages.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        requestDeletePage(idx);
                      }}
                      className="p-0.5 rounded-full hover:bg-black/20 text-gray-500 hover:text-red-500"
                      title="Delete page"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddPage}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-black/5 dark:bg-white/5 hover:bg-amber-500/20 text-amber-400 transition shrink-0 border border-amber-500/30"
              >
                <Plus size={13} />
                <span>Page</span>
              </button>
            </div>

            {/* Active Page Rename Bar */}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <input
                type="text"
                value={activePage.title}
                onChange={(e) => handleUpdatePageTitle(e.target.value)}
                placeholder="Page Title (e.g. Chapter 1 Scene 2, Dialogue, World Map)..."
                className="bg-transparent font-medium text-xs focus:outline-hidden focus:border-b border-amber-500/60 w-64 text-amber-400/90"
              />
              <span className="font-mono text-[11px]">
                {activePage.content.trim() ? activePage.content.trim().split(/\s+/).length : 0} words
              </span>
            </div>

            {/* Media Items Strip for Active Page */}
            {activePage.media.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto py-2">
                {activePage.media.map((m) => (
                  <div
                    key={m.id}
                    className="relative group shrink-0 rounded-xl overflow-hidden border border-black/15 dark:border-white/15 bg-black/30"
                  >
                    {m.type === 'drawing' || m.type === 'image' ? (
                      <img src={m.url} alt={m.name} className="h-20 w-32 object-cover" />
                    ) : m.type === 'audio' ? (
                      <div className="h-20 w-32 flex flex-col items-center justify-center p-2 text-center text-xs">
                        <Volume2 size={24} className="text-amber-400 mb-1" />
                        <span className="truncate w-full text-[10px]">{m.name}</span>
                      </div>
                    ) : (
                      <div className="h-20 w-32 flex flex-col items-center justify-center p-2 text-center text-xs">
                        <Video size={24} className="text-blue-400 mb-1" />
                        <span className="truncate w-full text-[10px]">{m.name}</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(m.id)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Main Creative Writing Content Textarea */}
            <textarea
              value={activePage.content}
              onChange={(e) => handleUpdatePageContent(e.target.value)}
              placeholder="Write story beats, dialogue, lore, or notes (Markdown supported)..."
              rows={4}
              className={`w-full bg-transparent resize-y text-sm md:text-base leading-relaxed focus:outline-hidden placeholder-gray-500 font-writing ${
                isDark ? 'text-gray-100' : 'text-gray-800'
              }`}
            />

            {/* Tags input */}
            <div className="flex items-center gap-2 pt-1 border-t border-black/5 dark:border-white/5">
              <Tag size={14} className="text-gray-400 shrink-0" />
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Tags (e.g. #fantasy, #chapter-1, #dialogue)..."
                className="w-full bg-transparent text-xs text-gray-300 focus:outline-hidden placeholder-gray-500"
              />
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1">
                {/* Keep Color Picker Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer"
                    title="Background color"
                  >
                    <Palette size={16} />
                  </button>

                  {showColorPicker && (
                    <div className="absolute bottom-8 left-0 z-50 bg-[#292a2d] p-2 rounded-xl shadow-2xl border border-gray-700 flex flex-wrap gap-1.5 w-44">
                      {Object.values(KEEP_COLORS).map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setColor(c.id);
                            setShowColorPicker(false);
                          }}
                          className={`w-6 h-6 rounded-full border transition hover:scale-110 ${
                            color === c.id ? 'ring-2 ring-amber-400' : 'border-gray-600'
                          }`}
                          style={{ backgroundColor: isDark ? c.darkBg : c.lightBg }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Drawing */}
                <button
                  type="button"
                  onClick={() => setIsDrawingOpen(true)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer"
                  title="Draw / Sketch Map or Sigil"
                >
                  <Edit3 size={16} />
                </button>

                {/* Image upload */}
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer"
                  title="Attach Image from Gallery"
                >
                  <ImageIcon size={16} />
                </button>

                {/* Audio */}
                <button
                  type="button"
                  onClick={() => setIsAudioOpen(true)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer"
                  title="Record / Attach Audio"
                >
                  <Volume2 size={16} />
                </button>

                {/* Video */}
                <button
                  type="button"
                  onClick={() => setIsVideoOpen(true)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer"
                  title="Attach Video"
                >
                  <Video size={16} />
                </button>

                {/* Vocabulary Codex Drawer */}
                <button
                  type="button"
                  onClick={() => setIsVocabDrawerOpen(!isVocabDrawerOpen)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    isVocabDrawerOpen
                      ? 'bg-amber-500 text-black'
                      : 'text-amber-400 hover:bg-amber-500/20'
                  }`}
                  title="Open Vocabulary Lexicon to insert words"
                >
                  <BookOpen size={14} />
                  <span>Vocab</span>
                </button>
              </div>

              {/* Save & Close Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoSaveOrClose}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
                >
                  Save Note
                </button>
              </div>
            </div>

            {/* Hidden image file input */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {/* Vocabulary Slide-out Drawer */}
            {isVocabDrawerOpen && (
              <VocabularyDrawer
                isOpen={isVocabDrawerOpen}
                onClose={() => setIsVocabDrawerOpen(false)}
                vocabulary={vocabulary}
                onInsertWord={(text) => {
                  handleUpdatePageContent(
                    activePage.content ? `${activePage.content} ${text}` : text
                  );
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <DrawingModal
        isOpen={isDrawingOpen}
        onClose={() => setIsDrawingOpen(false)}
        onSave={(dataUrl, name) => {
          handleAttachMedia({
            id: `draw-${Date.now()}`,
            type: 'drawing',
            url: dataUrl,
            name,
            createdAt: Date.now(),
          });
        }}
      />

      <AudioRecorderModal
        isOpen={isAudioOpen}
        onClose={() => setIsAudioOpen(false)}
        onSave={(audioUrl, name, duration) => {
          handleAttachMedia({
            id: `audio-${Date.now()}`,
            type: 'audio',
            url: audioUrl,
            name,
            duration,
            createdAt: Date.now(),
          });
        }}
      />

      <VideoModal
        isOpen={isVideoOpen}
        onClose={() => setIsVideoOpen(false)}
        onSave={(videoUrl, name, caption) => {
          handleAttachMedia({
            id: `video-${Date.now()}`,
            type: 'video',
            url: videoUrl,
            name,
            caption,
            createdAt: Date.now(),
          });
        }}
      />

      {pageIndexToDelete !== null && (
        <ConfirmModal
          isOpen={pageIndexToDelete !== null}
          title="Delete Page"
          message={`Are you sure you want to delete "${pages[pageIndexToDelete]?.title || `Page ${pageIndexToDelete + 1}`}"? Any text or sketches on this page will be removed.`}
          confirmLabel="Delete Page"
          isDestructive={true}
          onConfirm={confirmDeletePage}
          onCancel={() => setPageIndexToDelete(null)}
        />
      )}
    </div>
  );
};
