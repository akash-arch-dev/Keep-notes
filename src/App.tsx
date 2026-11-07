import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Note,
  VocabularyItem,
  NavSection,
  ViewMode,
  KeepColorId,
} from './types';
import {
  loadNotes,
  saveNotes,
  loadVocabulary,
  saveVocabulary,
  exportAllData,
} from './services/storage';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { NoteComposer } from './components/NoteComposer';
import { NoteCard } from './components/NoteCard';
import { NoteModal } from './components/NoteModal';
import { VocabularySection } from './components/VocabularySection';
import { SupabaseManagerSection } from './components/SupabaseManagerSection';
import { ConfirmModal } from './components/ConfirmModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { EditLabelsModal } from './components/EditLabelsModal';
import { ImportModal } from './components/ImportModal';
import {
  Pin,
  Trash2,
  Archive,
  BookOpen,
  FileText,
  Tag,
  Sparkles,
  RotateCcw,
  Plus,
} from 'lucide-react';

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Navigation & Filtering
  const [currentSection, setCurrentSection] = useState<NavSection>('notes');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Dark mode & UI
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('keepscribe_dark');
    return saved !== null ? saved === 'true' : true;
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Modals
  const [activeEditingNote, setActiveEditingNote] = useState<Note | null>(null);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isEditLabelsOpen, setIsEditLabelsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isConfirmEmptyTrashOpen, setIsConfirmEmptyTrashOpen] = useState(false);

  // MongoDB Cloud Sync State
  const [mongoStatus, setMongoStatus] = useState<{
    connected: boolean;
    database?: string;
    notesCount?: number;
    vocabCount?: number;
    lastSync?: number | null;
    error?: string;
  }>({ connected: false });
  const [isMongoSyncing, setIsMongoSyncing] = useState(false);

  const checkMongoStatus = async () => {
    try {
      const res = await fetch('/api/mongodb/status');
      if (res.ok) {
        const data = await res.json();
        setMongoStatus(data);
      }
    } catch {
      // offline fallback
    }
  };

  // Load from IndexedDB on mount & check cloud status
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      const [loadedNotes, loadedVocab] = await Promise.all([
        loadNotes(),
        loadVocabulary(),
      ]);
      setNotes(loadedNotes);
      setVocabulary(loadedVocab);
      setIsLoading(false);
      checkMongoStatus();
    }
    init();
  }, []);

  const handleSyncMongoDB = async () => {
    setIsMongoSyncing(true);
    try {
      const res = await fetch('/api/mongodb/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes,
          vocabulary,
          clientTimestamp: Date.now(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.notes && data.notes.length > 0) {
          updateNotesState(data.notes);
        }
        if (data.vocabulary && data.vocabulary.length > 0) {
          updateVocabularyState(data.vocabulary);
        }
        setMongoStatus({
          connected: true,
          database: 'keepscribe_db',
          notesCount: data.notesCount,
          vocabCount: data.vocabCount,
          lastSync: data.timestamp,
        });
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setMongoStatus((prev) => ({ ...prev, error: err.message || 'Sync failed' }));
    } finally {
      setIsMongoSyncing(false);
    }
  };

  const handlePullMongoDB = async () => {
    setIsMongoSyncing(true);
    try {
      const res = await fetch('/api/mongodb/pull');
      const data = await res.json();
      if (data.success) {
        if (data.notes) updateNotesState(data.notes);
        if (data.vocabulary) updateVocabularyState(data.vocabulary);
        setMongoStatus((prev) => ({
          ...prev,
          connected: true,
          notesCount: data.notesCount,
          vocabCount: data.vocabCount,
          lastSync: Date.now(),
        }));
      }
    } catch (err: any) {
      alert(`Pull failed: ${err.message}`);
    } finally {
      setIsMongoSyncing(false);
    }
  };

  // Sync theme
  useEffect(() => {
    localStorage.setItem('keepscribe_dark', isDark.toString());
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#202124';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#f8fafc';
    }
  }, [isDark]);

  // Global Keyboard Shortcuts (Linux / Arch & Desktop)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in input or textarea
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (e.key === 'Escape') {
        if (activeEditingNote) setActiveEditingNote(null);
        if (isShortcutsOpen) setIsShortcutsOpen(false);
        if (isEditLabelsOpen) setIsEditLabelsOpen(false);
        if (isImportOpen) setIsImportOpen(false);
        return;
      }

      if (isInput) return;

      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector('header input') as HTMLInputElement;
        searchInput?.focus();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (e.altKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        setCurrentSection('vocabulary');
        setSelectedTag(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeEditingNote, isShortcutsOpen, isEditLabelsOpen, isImportOpen]);

  // Save Notes helper
  const updateNotesState = (newNotes: Note[]) => {
    setNotes(newNotes);
    saveNotes(newNotes);
  };

  // Save Vocabulary helper
  const updateVocabularyState = (newVocab: VocabularyItem[]) => {
    setVocabulary(newVocab);
    saveVocabulary(newVocab);
  };

  // Note Handlers
  const handleSaveNewNote = (newNote: Note) => {
    const updated = [newNote, ...notes];
    updateNotesState(updated);
  };

  const handleUpdateNote = (updatedNote: Note) => {
    const updated = notes.map((n) => (n.id === updatedNote.id ? updatedNote : n));
    updateNotesState(updated);
  };

  const handleTogglePin = (id: string) => {
    const updated = notes.map((n) =>
      n.id === id ? { ...n, isPinned: !n.isPinned, updatedAt: Date.now() } : n
    );
    updateNotesState(updated);
  };

  const handleUpdateColor = (id: string, color: KeepColorId) => {
    const updated = notes.map((n) =>
      n.id === id ? { ...n, color, updatedAt: Date.now() } : n
    );
    updateNotesState(updated);
  };

  const handleArchive = (id: string) => {
    const updated = notes.map((n) =>
      n.id === id ? { ...n, isArchived: true, isPinned: false, updatedAt: Date.now() } : n
    );
    updateNotesState(updated);
  };

  const handleUnarchive = (id: string) => {
    const updated = notes.map((n) =>
      n.id === id ? { ...n, isArchived: false, updatedAt: Date.now() } : n
    );
    updateNotesState(updated);
  };

  const handleTrash = (id: string) => {
    const updated = notes.map((n) =>
      n.id === id ? { ...n, isTrashed: true, isPinned: false, updatedAt: Date.now() } : n
    );
    updateNotesState(updated);
  };

  const handleRestore = (id: string) => {
    const updated = notes.map((n) =>
      n.id === id ? { ...n, isTrashed: false, updatedAt: Date.now() } : n
    );
    updateNotesState(updated);
  };

  const handleDeletePermanent = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    updateNotesState(updated);
  };

  const handleEmptyTrash = () => {
    const updated = notes.filter((n) => !n.isTrashed);
    updateNotesState(updated);
  };

  const handleDuplicate = (noteToDup: Note) => {
    const dup: Note = {
      ...noteToDup,
      id: `note-${Date.now()}`,
      title: `${noteToDup.title || 'Note'} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pages: noteToDup.pages.map((p, idx) => ({
        ...p,
        id: `p-${Date.now()}-${idx}`,
        media: p.media.map((m) => ({ ...m, id: `m-${Date.now()}-${Math.random()}` })),
      })),
    };
    updateNotesState([dup, ...notes]);
  };

  // Vocabulary Handlers
  const handleAddWord = (word: VocabularyItem) => {
    const updated = [word, ...vocabulary];
    updateVocabularyState(updated);
  };

  const handleUpdateWord = (updatedWord: VocabularyItem) => {
    const updated = vocabulary.map((v) => (v.id === updatedWord.id ? updatedWord : v));
    updateVocabularyState(updated);
  };

  const handleDeleteWord = (id: string) => {
    const updated = vocabulary.filter((v) => v.id !== id);
    updateVocabularyState(updated);
  };

  // Tags collection
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach((n) => n.tags?.forEach((t) => tagSet.add(t)));
    vocabulary.forEach((v) => v.tags?.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [notes, vocabulary]);

  const handleAddCustomTag = (newTag: string) => {
    // Add tag to selected active note or just register in list
    if (activeEditingNote) {
      const updated = {
        ...activeEditingNote,
        tags: [...new Set([...activeEditingNote.tags, newTag])],
      };
      handleUpdateNote(updated);
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
    const updatedNotes = notes.map((n) => ({
      ...n,
      tags: n.tags.filter((t) => t !== tagToDelete),
    }));
    const updatedVocab = vocabulary.map((v) => ({
      ...v,
      tags: v.tags.filter((t) => t !== tagToDelete),
    }));
    updateNotesState(updatedNotes);
    updateVocabularyState(updatedVocab);
    if (selectedTag === tagToDelete) {
      setSelectedTag(null);
      setCurrentSection('notes');
    }
  };

  // Notes filtering based on Section and Search
  const filteredNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return notes.filter((note) => {
      // 1. Navigation section filter
      if (currentSection === 'trash') {
        if (!note.isTrashed) return false;
      } else {
        if (note.isTrashed) return false;
        if (currentSection === 'archive') {
          if (!note.isArchived) return false;
        } else {
          // 'notes', 'pinned', or 'tag' require unarchived notes
          if (note.isArchived) return false;
          if (currentSection === 'pinned' && !note.isPinned) return false;
          if (currentSection === 'tag' && selectedTag && !note.tags.includes(selectedTag)) {
            return false;
          }
        }
      }

      // 2. Search query filter
      if (!query) return true;

      if (note.title.toLowerCase().includes(query)) return true;
      if (note.tags.some((t) => t.toLowerCase().includes(query))) return true;
      if (
        note.pages.some(
          (p) =>
            p.title.toLowerCase().includes(query) ||
            p.content.toLowerCase().includes(query) ||
            p.media.some((m) => m.name?.toLowerCase().includes(query))
        )
      ) {
        return true;
      }

      return false;
    });
  }, [notes, currentSection, selectedTag, searchQuery]);

  // Split into Pinned and Others when in main Notes view
  const pinnedNotes = useMemo(() => {
    if (currentSection !== 'notes' || selectedTag) return [];
    return filteredNotes.filter((n) => n.isPinned);
  }, [filteredNotes, currentSection, selectedTag]);

  const otherNotes = useMemo(() => {
    if (currentSection !== 'notes' || selectedTag) return filteredNotes;
    return filteredNotes.filter((n) => !n.isPinned);
  }, [filteredNotes, currentSection, selectedTag]);

  // Sidebar Counts
  const counts = useMemo(() => {
    const active = notes.filter((n) => !n.isTrashed && !n.isArchived);
    return {
      notes: active.length,
      pinned: active.filter((n) => n.isPinned).length,
      vocabulary: vocabulary.length,
      archive: notes.filter((n) => n.isArchived && !n.isTrashed).length,
      trash: notes.filter((n) => n.isTrashed).length,
    };
  }, [notes, vocabulary]);

  const refreshAfterImport = async () => {
    const [loadedNotes, loadedVocab] = await Promise.all([
      loadNotes(),
      loadVocabulary(),
    ]);
    setNotes(loadedNotes);
    setVocabulary(loadedVocab);
  };

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 ${
        isDark ? 'bg-[#202124] text-gray-100' : 'bg-[#ffffff] text-gray-900'
      }`}
    >
      {/* Google Keep Header */}
      <Header
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
        isDark={isDark}
        onToggleDark={() => setIsDark(!isDark)}
        onExport={exportAllData}
        onOpenImport={() => setIsImportOpen(true)}
      />

      {/* Main Container: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          currentSection={currentSection}
          selectedTag={selectedTag}
          onSelectSection={(sec, tag) => {
            setCurrentSection(sec);
            setSelectedTag(tag || null);
          }}
          tags={allTags}
          notesCount={counts.notes}
          pinnedCount={counts.pinned}
          vocabularyCount={counts.vocabulary}
          archiveCount={counts.archive}
          trashCount={counts.trash}
          isCollapsed={isSidebarCollapsed}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onOpenEditLabels={() => setIsEditLabelsOpen(true)}
          isDark={isDark}
        />

        {/* Dynamic Section Content */}
        <main className="flex-1 h-[calc(100vh-64px)] overflow-y-auto flex flex-col">
          {currentSection === 'supabase' ? (
            /* Dedicated Supabase & MongoDB Cloud Manager Section */
            <SupabaseManagerSection
              notes={notes}
              vocabulary={vocabulary}
              onSyncMongoDB={handleSyncMongoDB}
              onPullMongoDB={handlePullMongoDB}
              isMongoSyncing={isMongoSyncing}
              mongoStatus={mongoStatus}
              isDark={isDark}
            />
          ) : currentSection === 'vocabulary' ? (
            /* Dedicated Vocabulary Map & Codex Section */
            <VocabularySection
              vocabulary={vocabulary}
              onAddWord={handleAddWord}
              onUpdateWord={handleUpdateWord}
              onDeleteWord={handleDeleteWord}
              isDark={isDark}
            />
          ) : (
            /* Notes & Story Drafts Section */
            <div className="p-4 md:p-6 max-w-7xl mx-auto w-full flex-1">
              {/* Only show Note Composer in active Notes section */}
              {currentSection === 'notes' && !selectedTag && (
                <NoteComposer
                  onSaveNote={handleSaveNewNote}
                  vocabulary={vocabulary}
                  isDark={isDark}
                />
              )}

              {/* Section Header if in Trash / Archive / Tag */}
              {currentSection === 'trash' && (
                <div className="mb-6 p-4 rounded-2xl bg-red-950/30 border border-red-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-300 text-xs md:text-sm">
                    <Trash2 size={18} />
                    <span>Notes in Trash are kept locally until emptied.</span>
                  </div>
                  {counts.trash > 0 && (
                    <button
                      onClick={() => setIsConfirmEmptyTrashOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-red-800 hover:bg-red-700 text-white font-semibold text-xs transition cursor-pointer"
                    >
                      Empty Trash
                    </button>
                  )}
                </div>
              )}

              {currentSection === 'archive' && (
                <div className="mb-6 flex items-center gap-2 text-sm text-gray-400">
                  <Archive size={18} className="text-amber-400" />
                  <span className="font-semibold">Archived Story Notes</span>
                </div>
              )}

              {currentSection === 'tag' && selectedTag && (
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag size={18} className="text-amber-400" />
                    <span className="font-bold text-base text-amber-400 font-writing">
                      Notes tagged with {selectedTag}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTag(null);
                      setCurrentSection('notes');
                    }}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Clear Filter
                  </button>
                </div>
              )}

              {/* PINNED NOTES SECTION */}
              {pinnedNotes.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-3 px-1 flex items-center gap-1.5">
                    <Pin size={13} className="text-amber-400" />
                    <span>PINNED</span>
                  </h4>
                  <div
                    className={
                      viewMode === 'grid'
                        ? 'masonry-grid'
                        : 'flex flex-col gap-3 max-w-2xl mx-auto'
                    }
                  >
                    {pinnedNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onOpen={setActiveEditingNote}
                        onTogglePin={handleTogglePin}
                        onUpdateColor={handleUpdateColor}
                        onArchive={handleArchive}
                        onUnarchive={handleUnarchive}
                        onTrash={handleTrash}
                        onRestore={handleRestore}
                        onDeletePermanent={handleDeletePermanent}
                        onDuplicate={handleDuplicate}
                        isDark={isDark}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* OTHERS / UNPINNED NOTES SECTION */}
              {pinnedNotes.length > 0 && otherNotes.length > 0 && (
                <h4 className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-3 px-1">
                  OTHERS
                </h4>
              )}

              {otherNotes.length > 0 ? (
                <div
                  className={
                    viewMode === 'grid'
                      ? 'masonry-grid'
                      : 'flex flex-col gap-3 max-w-2xl mx-auto'
                  }
                >
                  {otherNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onOpen={setActiveEditingNote}
                      onTogglePin={handleTogglePin}
                      onUpdateColor={handleUpdateColor}
                      onArchive={handleArchive}
                      onUnarchive={handleUnarchive}
                      onTrash={handleTrash}
                      onRestore={handleRestore}
                      onDeletePermanent={handleDeletePermanent}
                      onDuplicate={handleDuplicate}
                      isDark={isDark}
                    />
                  ))}
                </div>
              ) : (
                /* Empty State */
                pinnedNotes.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400 select-none">
                    <div className="p-4 rounded-3xl bg-amber-500/10 text-amber-400 mb-4 border border-amber-500/20 shadow-inner">
                      {currentSection === 'trash' ? (
                        <Trash2 size={42} />
                      ) : currentSection === 'archive' ? (
                        <Archive size={42} />
                      ) : (
                        <FileText size={42} />
                      )}
                    </div>
                    <h3 className="text-lg font-bold font-writing text-gray-200">
                      {currentSection === 'trash'
                        ? 'Trash is empty'
                        : currentSection === 'archive'
                        ? 'No archived story notes'
                        : searchQuery
                        ? 'No notes match your search'
                        : 'Your creative writing canvas is open'}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1.5 max-w-sm leading-relaxed">
                      {currentSection === 'trash'
                        ? 'Items deleted will appear here before permanent removal.'
                        : currentSection === 'archive'
                        ? 'Archived manuscripts and drafts reside here safely.'
                        : searchQuery
                        ? 'Try searching for other chapter titles, characters, or tags.'
                        : 'Capture scene beats, dialogue rhythms, multi-page chapter drafts, worldbuilding sketches, or audio memos.'}
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </main>
      </div>

      {/* Note Editing Modal */}
      {activeEditingNote && (
        <NoteModal
          note={activeEditingNote}
          isOpen={!!activeEditingNote}
          onClose={() => setActiveEditingNote(null)}
          onUpdateNote={(updated) => {
            handleUpdateNote(updated);
            setActiveEditingNote(updated);
          }}
          onArchive={handleArchive}
          onTrash={handleTrash}
          vocabulary={vocabulary}
          isDark={isDark}
        />
      )}

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Edit Labels Modal */}
      <EditLabelsModal
        isOpen={isEditLabelsOpen}
        onClose={() => setIsEditLabelsOpen(false)}
        tags={allTags}
        onAddTag={handleAddCustomTag}
        onDeleteTag={handleDeleteTag}
      />

      {/* Import Backup Modal */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={refreshAfterImport}
      />

      {/* Confirmation Dialog before Emptying Trash */}
      {isConfirmEmptyTrashOpen && (
        <ConfirmModal
          isOpen={isConfirmEmptyTrashOpen}
          title="Empty Trash"
          message={`Are you sure you want to permanently delete all ${counts.trash} notes currently in the Trash? This cannot be undone.`}
          confirmLabel="Empty Trash Forever"
          isDestructive={true}
          onConfirm={() => {
            handleEmptyTrash();
            setIsConfirmEmptyTrashOpen(false);
          }}
          onCancel={() => setIsConfirmEmptyTrashOpen(false)}
        />
      )}
    </div>
  );
}
