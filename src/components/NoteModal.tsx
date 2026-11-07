import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Pin,
  Palette,
  Image as ImageIcon,
  Edit3,
  Volume2,
  Video,
  Plus,
  Trash2,
  Archive,
  Copy,
  BookOpen,
  Tag,
  Download,
  Bold,
  Italic,
  Heading,
  Quote,
  List,
  Eye,
  Play,
  Pause,
  ZoomIn,
} from 'lucide-react';
import { Note, NotePage, MediaItem, KeepColorId, VocabularyItem } from '../types';
import { KEEP_COLORS, getCardColorStyle } from '../utils/colors';
import { DrawingModal } from './DrawingModal';
import { AudioRecorderModal } from './AudioRecorderModal';
import { VideoModal } from './VideoModal';
import { VocabularyDrawer } from './VocabularyDrawer';
import { ConfirmModal } from './ConfirmModal';
import { uploadMediaToSupabase } from '../services/supabase';

interface NoteModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateNote: (updatedNote: Note) => void;
  onArchive: (id: string) => void;
  onTrash: (id: string) => void;
  vocabulary: VocabularyItem[];
  isDark: boolean;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  note,
  isOpen,
  onClose,
  onUpdateNote,
  onArchive,
  onTrash,
  vocabulary,
  isDark,
}) => {
  if (!isOpen || !note) return null;

  const [title, setTitle] = useState(note.title);
  const [pages, setPages] = useState<NotePage[]>(note.pages && note.pages.length > 0 ? note.pages : []);
  const [activePageIndex, setActivePageIndex] = useState(note.activePageIndex || 0);
  const [color, setColor] = useState<KeepColorId>(note.color);
  const [isPinned, setIsPinned] = useState(note.isPinned);
  const [tags, setTags] = useState<string[]>(note.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pageIndexToDelete, setPageIndexToDelete] = useState<number | null>(null);
  const [isConfirmTrashOpen, setIsConfirmTrashOpen] = useState(false);

  // Modals & Drawers
  const [isDrawingOpen, setIsDrawingOpen] = useState(false);
  const [isAudioOpen, setIsAudioOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isVocabDrawerOpen, setIsVocabDrawerOpen] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const safePageIndex = Math.min(Math.max(activePageIndex, 0), Math.max(pages.length - 1, 0));
  const activePage = pages[safePageIndex] || {
    id: 'p-default',
    title: 'Page 1',
    content: '',
    media: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // Sync back to parent when closing or editing
  const handleSaveAndSync = () => {
    const updated: Note = {
      ...note,
      title: title.trim(),
      color,
      isPinned,
      tags,
      pages,
      activePageIndex: safePageIndex,
      updatedAt: Date.now(),
    };
    onUpdateNote(updated);
  };

  const handleClose = () => {
    handleSaveAndSync();
    onClose();
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
    const updatedPages = [...pages, newPage];
    setPages(updatedPages);
    setActivePageIndex(updatedPages.length - 1);
  };

  const handleUpdatePageTitle = (newTitle: string) => {
    setPages((prev) =>
      prev.map((p, idx) => (idx === safePageIndex ? { ...p, title: newTitle } : p))
    );
  };

  const handleUpdatePageContent = (newContent: string) => {
    setPages((prev) =>
      prev.map((p, idx) =>
        idx === safePageIndex ? { ...p, content: newContent, updatedAt: Date.now() } : p
      )
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

  // Media Operations
  const handleAttachMedia = (mediaItem: MediaItem) => {
    setPages((prev) =>
      prev.map((p, idx) =>
        idx === safePageIndex ? { ...p, media: [...p.media, mediaItem] } : p
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
        idx === safePageIndex
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

  // Text formatting helpers (inserts markdown formatting at cursor)
  const applyFormat = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = activePage.content;
    const selected = current.substring(start, end);

    const replacement = `${prefix}${selected || 'text'}${suffix}`;
    const nextContent = current.substring(0, start) + replacement + current.substring(end);
    handleUpdatePageContent(nextContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || 4));
    }, 10);
  };

  // Tag Operations
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const formatted = tagInput.trim().startsWith('#')
        ? tagInput.trim()
        : `#${tagInput.trim()}`;
      if (!tags.includes(formatted)) {
        setTags([...tags, formatted]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Export Note as Markdown file
  const handleExportMarkdown = () => {
    let md = `# ${title || 'Story Note'}\n\n`;
    if (tags.length > 0) {
      md += `Tags: ${tags.join(' ')}\n\n`;
    }
    pages.forEach((p, idx) => {
      md += `## Page ${idx + 1}: ${p.title}\n\n`;
      md += `${p.content}\n\n`;
      if (p.media.length > 0) {
        md += `### Media (${p.media.length} items):\n`;
        p.media.forEach((m) => {
          md += `- [${m.type.toUpperCase()}] ${m.name || 'Attachment'}\n`;
        });
        md += '\n';
      }
      md += '---\n\n';
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(title || 'story-note').toLowerCase().replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const calculatePageWordCount = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  const totalNoteWords = pages.reduce(
    (acc, p) => acc + calculatePageWordCount(p.content),
    0
  );

  const containerStyle = getCardColorStyle(color, isDark);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 md:p-6 animate-in fade-in duration-150">
      <div
        style={containerStyle}
        className="flex flex-col w-full max-w-4xl h-[94vh] rounded-3xl border shadow-2xl overflow-hidden relative"
      >
        {/* Top Header Bar */}
        <div className="p-4 md:px-6 border-b border-black/10 dark:border-white/10 flex items-center justify-between gap-3 shrink-0">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Story Note Title..."
            className={`flex-1 bg-transparent font-bold text-lg md:text-xl focus:outline-hidden placeholder-gray-500 font-writing ${
              isDark ? 'text-gray-100' : 'text-gray-900'
            }`}
          />

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Pin Button */}
            <button
              onClick={() => setIsPinned(!isPinned)}
              className={`p-2 rounded-full transition cursor-pointer ${
                isPinned
                  ? 'text-amber-400 bg-amber-400/20'
                  : 'text-gray-400 hover:bg-black/10 dark:hover:bg-white/10'
              }`}
              title={isPinned ? 'Unpin note' : 'Pin to top'}
            >
              <Pin size={18} className={isPinned ? 'fill-current' : ''} />
            </button>

            {/* Export Markdown */}
            <button
              onClick={handleExportMarkdown}
              className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer"
              title="Export Note as Markdown (.md)"
            >
              <Download size={18} />
            </button>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer"
              title="Close (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Multi-Page Tabs Ribbon */}
        <div className="px-4 md:px-6 py-2.5 bg-black/5 dark:bg-black/20 border-b border-black/10 dark:border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-1">
            {pages.map((p, idx) => (
              <div
                key={p.id}
                onClick={() => setActivePageIndex(idx)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition shrink-0 ${
                  safePageIndex === idx
                    ? 'bg-amber-500 text-black shadow-md'
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
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-black/10 dark:bg-white/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition shrink-0 cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Page</span>
            </button>
          </div>

          {/* Page Word & Character Count stats */}
          <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-gray-400 shrink-0">
            <span>
              Page {safePageIndex + 1}: {calculatePageWordCount(activePage.content)} words
            </span>
            <span>•</span>
            <span className="text-amber-400 font-semibold">Total: {totalNoteWords} words</span>
          </div>
        </div>

        {/* Active Page Header & Formatting Toolbar */}
        <div className="px-4 md:px-6 py-2 border-b border-black/5 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-500/90 uppercase tracking-wider">
              Page Title:
            </span>
            <input
              type="text"
              value={activePage.title}
              onChange={(e) => handleUpdatePageTitle(e.target.value)}
              placeholder="e.g. Chapter 1 Manuscript, Character Arc..."
              className="bg-transparent font-medium text-xs md:text-sm text-gray-200 focus:outline-hidden focus:border-b border-amber-500/80 w-56 md:w-80"
            />
          </div>

          {/* Quick Markdown Formatting Controls */}
          <div className="flex items-center gap-1 bg-black/10 dark:bg-white/5 p-1 rounded-xl text-gray-400">
            <button
              onClick={() => applyFormat('**', '**')}
              className="p-1 rounded-lg hover:text-white hover:bg-black/20 dark:hover:bg-white/10 transition"
              title="Bold (**text**)"
            >
              <Bold size={14} />
            </button>
            <button
              onClick={() => applyFormat('*', '*')}
              className="p-1 rounded-lg hover:text-white hover:bg-black/20 dark:hover:bg-white/10 transition"
              title="Italic (*text*)"
            >
              <Italic size={14} />
            </button>
            <button
              onClick={() => applyFormat('### ')}
              className="p-1 rounded-lg hover:text-white hover:bg-black/20 dark:hover:bg-white/10 transition"
              title="Heading (### Title)"
            >
              <Heading size={14} />
            </button>
            <button
              onClick={() => applyFormat('> ')}
              className="p-1 rounded-lg hover:text-white hover:bg-black/20 dark:hover:bg-white/10 transition"
              title="Quote (> blockquote)"
            >
              <Quote size={14} />
            </button>
            <button
              onClick={() => applyFormat('• ')}
              className="p-1 rounded-lg hover:text-white hover:bg-black/20 dark:hover:bg-white/10 transition"
              title="Bullet list item"
            >
              <List size={14} />
            </button>
          </div>
        </div>

        {/* Media Attachments Section for Current Page */}
        {activePage.media.length > 0 && (
          <div className="px-4 md:px-6 py-3 border-b border-black/10 dark:border-white/10 bg-black/10 dark:bg-black/30 flex items-center gap-3 overflow-x-auto shrink-0">
            {activePage.media.map((m) => (
              <div
                key={m.id}
                className="relative group shrink-0 rounded-2xl overflow-hidden border border-black/20 dark:border-white/20 bg-black/40 shadow-sm"
              >
                {m.type === 'drawing' || m.type === 'image' ? (
                  <div
                    onClick={() => setPreviewMedia(m)}
                    className="cursor-pointer relative group/img"
                  >
                    <img src={m.url} alt={m.name} className="h-28 w-44 object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition">
                      <ZoomIn size={20} className="text-white" />
                    </div>
                    {m.name && (
                      <span className="absolute bottom-1 left-2 text-[10px] bg-black/70 text-white px-2 py-0.5 rounded-md truncate max-w-[80%]">
                        {m.name}
                      </span>
                    )}
                  </div>
                ) : m.type === 'audio' ? (
                  <div className="h-28 w-56 flex flex-col justify-between p-3 bg-gray-900 text-gray-200">
                    <div className="flex items-center gap-2">
                      <Volume2 size={18} className="text-amber-400" />
                      <span className="text-xs font-semibold truncate">{m.name || 'Voice Memo'}</span>
                    </div>
                    <audio src={m.url} controls className="w-full h-8 scale-90 -mx-2" />
                    <span className="text-[10px] text-gray-400">Audio Memo</span>
                  </div>
                ) : (
                  <div className="h-28 w-56 flex flex-col justify-between p-3 bg-gray-900 text-gray-200">
                    <div className="flex items-center gap-2">
                      <Video size={18} className="text-blue-400" />
                      <span className="text-xs font-semibold truncate">{m.name || 'Video'}</span>
                    </div>
                    {m.url.includes('youtube.com/embed') || m.url.includes('vimeo.com') ? (
                      <iframe
                        src={m.url}
                        title={m.name}
                        className="w-full h-14 rounded-md pointer-events-none"
                      />
                    ) : (
                      <video src={m.url} className="w-full h-14 object-cover rounded-md" controls />
                    )}
                    <span className="text-[10px] text-gray-400">{m.caption || 'Video Reference'}</span>
                  </div>
                )}

                {/* Delete Media button */}
                <button
                  type="button"
                  onClick={() => handleRemoveMedia(m.id)}
                  className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/80 text-white hover:text-red-400 transition opacity-80 hover:opacity-100 cursor-pointer"
                  title="Remove attachment"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Writing Canvas / Textarea Body */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          <textarea
            ref={textareaRef}
            value={activePage.content}
            onChange={(e) => handleUpdatePageContent(e.target.value)}
            placeholder="Let your story flow here... (Describe characters, craft dialogue, chronicle lore, or write scene prose)"
            className={`w-full h-full min-h-[320px] bg-transparent resize-none leading-relaxed text-sm md:text-base focus:outline-hidden placeholder-gray-500 font-writing ${
              isDark ? 'text-gray-100' : 'text-gray-900'
            }`}
          />
        </div>

        {/* Tags Section */}
        <div className="px-4 md:px-6 py-2 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center gap-1.5 shrink-0">
          <Tag size={13} className="text-gray-400 shrink-0" />
          {tags.map((t) => (
            <span
              key={t}
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                isDark
                  ? 'bg-black/30 text-amber-300 border border-amber-500/20'
                  : 'bg-black/10 text-amber-900 border border-black/15'
              }`}
            >
              <span>{t}</span>
              <button
                onClick={() => handleRemoveTag(t)}
                className="hover:text-red-400 transition"
              >
                <X size={11} />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="+ Add tag (press Enter)..."
            className="text-xs bg-transparent text-gray-200 placeholder-gray-500 focus:outline-hidden w-40"
          />
        </div>

        {/* Bottom Toolbar & Action Bar */}
        <div className="p-3 md:px-6 border-t border-black/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0 bg-black/5 dark:bg-black/20">
          <div className="flex items-center gap-1">
            {/* Color Palette */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer"
                title="Change note color"
              >
                <Palette size={18} />
              </button>

              {showColorPicker && (
                <div className="absolute bottom-10 left-0 z-50 bg-[#292a2d] p-2 rounded-xl shadow-2xl border border-gray-700 flex flex-wrap gap-1.5 w-44">
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

            {/* Draw Sketch */}
            <button
              type="button"
              onClick={() => setIsDrawingOpen(true)}
              className="p-2 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer"
              title="Draw / Sketch Map, Floorplan or Sigil"
            >
              <Edit3 size={18} />
            </button>

            {/* Gallery Image */}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer"
              title="Attach Image from Gallery"
            >
              <ImageIcon size={18} />
            </button>

            {/* Voice Audio Memo */}
            <button
              type="button"
              onClick={() => setIsAudioOpen(true)}
              className="p-2 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer"
              title="Record or Upload Audio Note"
            >
              <Volume2 size={18} />
            </button>

            {/* Video Attachment */}
            <button
              type="button"
              onClick={() => setIsVideoOpen(true)}
              className="p-2 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer"
              title="Attach Video Scene Reference"
            >
              <Video size={18} />
            </button>

            {/* Vocabulary Codex Drawer Trigger */}
            <button
              type="button"
              onClick={() => setIsVocabDrawerOpen(!isVocabDrawerOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                isVocabDrawerOpen
                  ? 'bg-amber-500 text-black shadow-xs'
                  : 'text-amber-400 hover:bg-amber-500/20'
              }`}
              title="Open Vocabulary Codex to lookup & insert words"
            >
              <BookOpen size={15} />
              <span>Vocab Codex</span>
            </button>
          </div>

          {/* Right actions: Archive, Trash, Close */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onArchive(note.id);
                onClose();
              }}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer"
              title="Archive Note"
            >
              <Archive size={18} />
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmTrashOpen(true)}
              className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition cursor-pointer"
              title="Delete to Trash"
            >
              <Trash2 size={18} />
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
            >
              Close & Save
            </button>
          </div>
        </div>

        {/* Hidden File Input for images */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        {/* Vocabulary Drawer */}
        {isVocabDrawerOpen && (
          <VocabularyDrawer
            isOpen={isVocabDrawerOpen}
            onClose={() => setIsVocabDrawerOpen(false)}
            vocabulary={vocabulary}
            onInsertWord={(text) => {
              applyFormat(text, '');
            }}
          />
        )}
      </div>

      {/* Image Zoom Preview Modal */}
      {previewMedia && (
        <div
          onClick={() => setPreviewMedia(null)}
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <img
              src={previewMedia.url}
              alt={previewMedia.name}
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
            />
            {previewMedia.name && (
              <p className="mt-3 text-sm text-gray-200 font-medium">{previewMedia.name}</p>
            )}
            <button
              onClick={() => setPreviewMedia(null)}
              className="absolute -top-10 right-0 text-gray-300 hover:text-white p-2"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}

      {/* Drawing, Audio, Video Modals */}
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
          message={`Are you sure you want to delete "${pages[pageIndexToDelete]?.title || `Page ${pageIndexToDelete + 1}`}"? Any text or sketches on this page will be permanently removed.`}
          confirmLabel="Delete Page"
          isDestructive={true}
          onConfirm={confirmDeletePage}
          onCancel={() => setPageIndexToDelete(null)}
        />
      )}

      {isConfirmTrashOpen && (
        <ConfirmModal
          isOpen={isConfirmTrashOpen}
          title="Move Note to Trash"
          message={`Are you sure you want to move "${title || 'Untitled Note'}" to Trash? You can restore it anytime from the Trash section.`}
          confirmLabel="Move to Trash"
          isDestructive={true}
          onConfirm={() => {
            onTrash(note.id);
            setIsConfirmTrashOpen(false);
            onClose();
          }}
          onCancel={() => setIsConfirmTrashOpen(false)}
        />
      )}
    </div>
  );
};
