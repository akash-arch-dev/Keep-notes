import React, { useState, useMemo } from 'react';
import { BookOpen, Search, X, Plus, ChevronRight, Tag, SlidersHorizontal } from 'lucide-react';
import { VocabularyItem } from '../types';

interface VocabularyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  vocabulary: VocabularyItem[];
  onInsertWord: (textToInsert: string) => void;
  onAddNewWord?: () => void;
}

export const VocabularyDrawer: React.FC<VocabularyDrawerProps> = ({
  isOpen,
  onClose,
  vocabulary,
  onInsertWord,
  onAddNewWord,
}) => {
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const tags = useMemo(() => {
    const s = new Set<string>();
    vocabulary.forEach((v) => v.tags.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [vocabulary]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vocabulary.filter((v) => {
      if (activeTag && !v.tags.includes(activeTag)) return false;
      if (!q) return true;
      if (v.word.toLowerCase().includes(q)) return true;
      if (v.definition.toLowerCase().includes(q)) return true;
      if (v.tags.some((t) => t.toLowerCase().includes(q))) return true;
      if (v.customFields.some((cf) => cf.key.toLowerCase().includes(q) || cf.value.toLowerCase().includes(q))) {
        return true;
      }
      return false;
    });
  }, [vocabulary, search, activeTag]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-y-0 right-0 w-80 md:w-96 bg-[#202124] border-l border-gray-700/80 shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-3.5 border-b border-gray-700/80 bg-[#292a2d] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
            <BookOpen size={16} />
          </span>
          <span className="text-xs font-bold text-gray-200 uppercase tracking-wider">
            Vocabulary Codex
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onAddNewWord && (
            <button
              onClick={onAddNewWord}
              className="p-1 rounded-md text-amber-400 hover:text-amber-300 hover:bg-gray-800 transition"
              title="Add New Word"
            >
              <Plus size={16} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-gray-800 space-y-2 bg-[#202124]">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search key, value, tag..."
            className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg bg-gray-800/90 border border-gray-700 text-gray-200 placeholder-gray-400 focus:outline-hidden focus:border-amber-500"
          />
        </div>

        {/* Tag pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTag(null)}
            className={`px-2 py-0.5 rounded-full text-[10px] shrink-0 ${
              activeTag === null
                ? 'bg-amber-500 text-black font-bold'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            All
          </button>
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTag(activeTag === t ? null : t)}
              className={`px-2 py-0.5 rounded-full text-[10px] shrink-0 ${
                activeTag === t
                  ? 'bg-amber-500 text-black font-bold'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Word List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-xs text-gray-500">
            No matching words found.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-gray-800/70 border border-gray-700/70 hover:border-amber-500/60 transition group"
            >
              <div className="flex items-baseline justify-between mb-1">
                <span className="font-bold text-sm text-amber-400 font-writing">
                  {item.word}
                </span>
                {item.pronunciation && (
                  <span className="text-[10px] font-mono text-gray-400">
                    {item.pronunciation}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-300 leading-relaxed line-clamp-2 mb-2">
                {item.definition}
              </p>

              {/* Custom KV chips */}
              {item.customFields.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {item.customFields.map((cf) => (
                    <span
                      key={cf.id}
                      className="text-[10px] px-1.5 py-0.2 rounded-sm bg-gray-900/90 text-amber-300 border border-gray-700"
                    >
                      <span className="font-semibold">{cf.key}:</span> {cf.value}
                    </span>
                  ))}
                </div>
              )}

              {/* Action buttons to insert into writing */}
              <div className="flex items-center justify-between gap-1 pt-2 border-t border-gray-700/50">
                <div className="flex gap-1">
                  {item.tags.slice(0, 2).map((t) => (
                    <span key={t} className="text-[9px] text-gray-400">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onInsertWord(item.word)}
                    className="px-2 py-1 text-[11px] font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-md transition"
                    title="Insert word only"
                  >
                    + Insert Word
                  </button>
                  <button
                    onClick={() =>
                      onInsertWord(
                        `**${item.word}** (${item.definition})${
                          item.exampleContext ? ` — *"${item.exampleContext}"*` : ''
                        }`
                      )
                    }
                    className="px-2 py-1 text-[11px] font-semibold bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md transition"
                    title="Insert word with definition"
                  >
                    + With Meaning
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
