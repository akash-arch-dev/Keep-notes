import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Tag,
  Map as MapIcon,
  List,
  Edit2,
  Trash2,
  X,
  PlusCircle,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import { VocabularyItem, KeyValuePair } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface VocabularySectionProps {
  vocabulary: VocabularyItem[];
  onAddWord: (word: VocabularyItem) => void;
  onUpdateWord: (word: VocabularyItem) => void;
  onDeleteWord: (id: string) => void;
  isDark: boolean;
  onSelectWordToNote?: (word: VocabularyItem) => void;
}

export const VocabularySection: React.FC<VocabularySectionProps> = ({
  vocabulary,
  onAddWord,
  onUpdateWord,
  onDeleteWord,
  isDark,
  onSelectWordToNote,
}) => {
  const [viewMode, setViewMode] = useState<'map' | 'codex'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<VocabularyItem | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VocabularyItem | null>(null);
  const [wordToDelete, setWordToDelete] = useState<VocabularyItem | null>(null);

  // Map canvas interaction state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  // Collect all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    vocabulary.forEach((v) => {
      v.tags.forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  }, [vocabulary]);

  // Filtered vocabulary based on search & active tag
  const filteredVocabulary = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return vocabulary.filter((item) => {
      // Tag filter
      if (selectedTag && !item.tags.includes(selectedTag)) {
        return false;
      }
      if (!query) return true;

      // Match word
      if (item.word.toLowerCase().includes(query)) return true;
      // Match definition
      if (item.definition.toLowerCase().includes(query)) return true;
      // Match pronunciation / etymology / example
      if (item.pronunciation?.toLowerCase().includes(query)) return true;
      if (item.etymology?.toLowerCase().includes(query)) return true;
      if (item.exampleContext?.toLowerCase().includes(query)) return true;
      // Match tags
      if (item.tags.some((t) => t.toLowerCase().includes(query))) return true;
      // Match custom key-value pairs (both key and value!)
      if (
        item.customFields.some(
          (cf) => cf.key.toLowerCase().includes(query) || cf.value.toLowerCase().includes(query)
        )
      ) {
        return true;
      }
      return false;
    });
  }, [vocabulary, searchQuery, selectedTag]);

  // Auto assign coordinates to nodes if not present
  const mappedNodes = useMemo(() => {
    return filteredVocabulary.map((item, index) => {
      if (item.mapX !== undefined && item.mapY !== undefined) {
        return item;
      }
      // Circular / spiral scatter layout
      const angle = index * 0.8;
      const radius = 100 + index * 45;
      return {
        ...item,
        mapX: 450 + Math.cos(angle) * radius,
        mapY: 300 + Math.sin(angle) * radius,
      };
    });
  }, [filteredVocabulary]);

  // Compute edges between nodes that share tags
  const edges = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; sharedTag: string }[] = [];
    for (let i = 0; i < mappedNodes.length; i++) {
      for (let j = i + 1; j < mappedNodes.length; j++) {
        const a = mappedNodes[i];
        const b = mappedNodes[j];
        const shared = a.tags.find((t) => b.tags.includes(t));
        if (shared && a.mapX !== undefined && a.mapY !== undefined && b.mapX !== undefined && b.mapY !== undefined) {
          lines.push({
            x1: a.mapX,
            y1: a.mapY,
            x2: b.mapX,
            y2: b.mapY,
            sharedTag: shared,
          });
        }
      }
    }
    return lines;
  }, [mappedNodes]);

  // Open editor for new or existing
  const handleOpenAdd = () => {
    setEditingItem({
      id: `vocab-${Date.now()}`,
      word: '',
      definition: '',
      pronunciation: '',
      etymology: '',
      exampleContext: '',
      tags: selectedTag ? [selectedTag] : ['#creative'],
      customFields: [{ id: 'f1', key: 'Tone', value: '' }],
      mapX: 450 + (Math.random() * 200 - 100),
      mapY: 300 + (Math.random() * 200 - 100),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (item: VocabularyItem) => {
    setEditingItem({ ...item, customFields: [...item.customFields] });
    setIsEditorOpen(true);
  };

  // Canvas Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (draggedNodeId) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedNodeId) {
      const node = vocabulary.find((v) => v.id === draggedNodeId);
      if (node) {
        // Adjust for zoom and pan
        const newX = (e.clientX - pan.x) / zoom;
        const newY = (e.clientY - pan.y) / zoom;
        onUpdateWord({
          ...node,
          mapX: Math.round(newX),
          mapY: Math.round(newY),
          updatedAt: Date.now(),
        });
      }
      return;
    }
    if (!isPanning) return;
    setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedNodeId(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#18191c] text-gray-100 overflow-hidden">
      {/* Top Bar for Vocabulary Section */}
      <div className="px-4 py-3 bg-[#202124] border-b border-gray-700/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
            <BookOpen size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-gray-100">Vocabulary Codex & Map</h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {filteredVocabulary.length} words
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Key-value lexicon with interactive relationship graph & tag filtering
            </p>
          </div>
        </div>

        {/* View switcher & Add button */}
        <div className="flex items-center gap-2">
          {/* Dual View Toggle */}
          <div className="flex items-center bg-gray-800 p-1 rounded-xl border border-gray-700">
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'map' ? 'bg-amber-500 text-black shadow-xs' : 'text-gray-400 hover:text-white'
              }`}
              title="Interactive Visual Map"
            >
              <MapIcon size={14} />
              Visual Map
            </button>
            <button
              onClick={() => setViewMode('codex')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'codex' ? 'bg-amber-500 text-black shadow-xs' : 'text-gray-400 hover:text-white'
              }`}
              title="Codex / Lexicon List"
            >
              <List size={14} />
              Codex List
            </button>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition shadow-md active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Word / Key-Value</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="px-4 py-2.5 bg-[#202124]/90 border-b border-gray-800 flex flex-wrap items-center gap-3">
        {/* Search input with key-value indication */}
        <div className="flex-1 min-w-[240px] max-w-md relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search words, definitions, custom keys, or values..."
            className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-gray-800/80 border border-gray-700/80 text-xs text-gray-100 placeholder-gray-400 focus:outline-hidden focus:border-amber-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Tag chips scroll container */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none max-w-full">
          <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1 shrink-0">
            <Tag size={12} />
            Tags:
          </span>
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-2.5 py-0.5 rounded-full text-xs transition shrink-0 cursor-pointer ${
              selectedTag === null
                ? 'bg-amber-500 text-black font-semibold'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-2.5 py-0.5 rounded-full text-xs transition shrink-0 cursor-pointer ${
                selectedTag === tag
                  ? 'bg-amber-500 text-black font-semibold shadow-xs'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Map or Codex */}
      <div className="flex-1 relative overflow-hidden flex">
        {viewMode === 'map' ? (
          /* Interactive 2D Map Canvas */
          <div
            className="flex-1 h-full relative cursor-grab active:cursor-grabbing bg-[#141517] select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {/* Grid background texture */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, #f59e0b 1px, transparent 0)',
                backgroundSize: '36px 36px',
              }}
            />

            {/* Map Controls */}
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 bg-gray-900/90 p-1.5 rounded-xl border border-gray-700 backdrop-blur-md shadow-lg">
              <button
                onClick={() => setZoom((z) => Math.min(z + 0.2, 2.5))}
                className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition"
                title="Zoom in"
              >
                <ZoomIn size={16} />
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(z - 0.2, 0.4))}
                className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition"
                title="Zoom out"
              >
                <ZoomOut size={16} />
              </button>
              <button
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition"
                title="Reset view"
              >
                <RotateCcw size={16} />
              </button>
            </div>

            {/* Instruction tooltip */}
            <div className="absolute bottom-4 left-4 z-20 bg-gray-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-gray-800 text-[11px] text-gray-400 pointer-events-none flex items-center gap-2">
              <Sparkles size={13} className="text-amber-400" />
              <span>Drag nodes to reposition. Connected lines indicate shared tags. Click to inspect key-value details.</span>
            </div>

            {/* SVG Relationship Lines */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: '0 0',
              }}
            >
              {edges.map((e, idx) => (
                <g key={idx}>
                  <line
                    x1={e.x1}
                    y1={e.y1}
                    x2={e.x2}
                    y2={e.y2}
                    stroke="#f59e0b"
                    strokeOpacity={0.25}
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                  />
                </g>
              ))}
            </svg>

            {/* Draggable Vocabulary Nodes */}
            <div
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: '0 0',
              }}
            >
              {mappedNodes.map((item) => {
                const isSelected = selectedWord?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDraggedNodeId(item.id);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedWord(item);
                    }}
                    className={`absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-shadow rounded-2xl group ${
                      isSelected
                        ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#141517] z-30 shadow-xl shadow-amber-500/20'
                        : 'hover:scale-105 z-10'
                    }`}
                    style={{
                      left: `${item.mapX}px`,
                      top: `${item.mapY}px`,
                    }}
                  >
                    <div className="bg-[#24262b] border border-gray-700 hover:border-amber-500/60 p-3 rounded-2xl w-48 shadow-lg transition">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-amber-400 group-hover:text-amber-300 truncate">
                          {item.word}
                        </span>
                        {item.customFields.length > 0 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-sm bg-gray-800 text-gray-400">
                            {item.customFields.length} KV
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-300 line-clamp-2 leading-relaxed">
                        {item.definition}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.tags.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20"
                          >
                            {t}
                          </span>
                        ))}
                        {item.tags.length > 2 && (
                          <span className="text-[9px] text-gray-500">+{item.tags.length - 2}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Codex Card / Table View */
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#18191c]">
            {filteredVocabulary.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                <BookOpen size={48} className="mb-3 text-gray-600" />
                <h3 className="text-base font-semibold text-gray-300">No vocabulary items match</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm">
                  Try clearing your search query or add a new word with key-value properties.
                </p>
                <button
                  onClick={handleOpenAdd}
                  className="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-black font-semibold text-xs hover:bg-amber-400 transition"
                >
                  Add First Word
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVocabulary.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedWord(item)}
                    className="p-4 rounded-2xl bg-[#24262b] border border-gray-700/80 hover:border-amber-500/60 shadow-md transition hover:-translate-y-0.5 flex flex-col justify-between cursor-pointer group"
                  >
                    <div>
                      {/* Top line: Word & phonetic */}
                      <div className="flex items-baseline justify-between gap-2 mb-1.5">
                        <h3 className="text-base font-bold text-amber-400 group-hover:text-amber-300 font-writing">
                          {item.word}
                        </h3>
                        {item.pronunciation && (
                          <span className="text-xs font-mono text-gray-400 italic">
                            {item.pronunciation}
                          </span>
                        )}
                      </div>

                      {/* Definition */}
                      <p className="text-xs text-gray-200 leading-relaxed mb-3">
                        {item.definition}
                      </p>

                      {/* Example sentence */}
                      {item.exampleContext && (
                        <div className="p-2.5 rounded-xl bg-gray-800/80 border-l-2 border-amber-500 text-[11px] text-gray-300 italic mb-3 font-writing">
                          "{item.exampleContext}"
                        </div>
                      )}

                      {/* Key-Value Pairs List */}
                      {item.customFields.length > 0 && (
                        <div className="space-y-1 mb-3 pt-2 border-t border-gray-700/60">
                          {item.customFields.map((cf) => (
                            <div
                              key={cf.id}
                              className="flex items-baseline justify-between text-[11px]"
                            >
                              <span className="font-semibold text-amber-500/90">{cf.key}:</span>
                              <span className="text-gray-300 text-right truncate max-w-[65%]">
                                {cf.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom: Tags & Actions */}
                    <div className="pt-3 border-t border-gray-700/60 flex items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/20"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(item);
                          }}
                          className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition"
                          title="Edit Word"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setWordToDelete(item);
                          }}
                          className="p-1 rounded-md text-gray-400 hover:text-red-400 hover:bg-red-900/30 transition"
                          title="Delete Word"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selected Word Details Drawer / Inspector Panel */}
        {selectedWord && (
          <div className="w-80 md:w-96 bg-[#202124] border-l border-gray-700/80 shadow-2xl flex flex-col h-full z-30 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-700/80 flex items-center justify-between bg-[#292a2d]">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                  <BookOpen size={16} />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Vocabulary Inspector
                </span>
              </div>
              <button
                onClick={() => setSelectedWord(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-amber-400 font-writing">
                  {selectedWord.word}
                </h2>
                {selectedWord.pronunciation && (
                  <p className="text-xs font-mono text-gray-400 mt-0.5">
                    {selectedWord.pronunciation}
                  </p>
                )}
              </div>

              <div>
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Definition
                </h4>
                <p className="text-sm text-gray-100 leading-relaxed font-writing">
                  {selectedWord.definition}
                </p>
              </div>

              {selectedWord.etymology && (
                <div>
                  <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Etymology & Origin
                  </h4>
                  <p className="text-xs text-gray-300 bg-gray-800/80 p-2.5 rounded-xl border border-gray-700">
                    {selectedWord.etymology}
                  </p>
                </div>
              )}

              {selectedWord.exampleContext && (
                <div>
                  <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Story Context / Sentence
                  </h4>
                  <p className="text-xs text-gray-200 italic bg-amber-500/10 border-l-2 border-amber-500 p-3 rounded-r-xl font-writing leading-relaxed">
                    "{selectedWord.exampleContext}"
                  </p>
                </div>
              )}

              {/* Key-Value Attributes Table */}
              <div>
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Key - Value Store</span>
                  <span className="text-[10px] text-amber-400 lowercase">
                    {selectedWord.customFields.length} attributes
                  </span>
                </h4>
                <div className="bg-gray-800/70 rounded-xl border border-gray-700 divide-y divide-gray-700/60 overflow-hidden">
                  {selectedWord.customFields.map((cf) => (
                    <div key={cf.id} className="p-2.5 flex items-baseline justify-between text-xs">
                      <span className="font-semibold text-amber-400">{cf.key}</span>
                      <span className="text-gray-200 text-right font-medium">{cf.value}</span>
                    </div>
                  ))}
                  {selectedWord.customFields.length === 0 && (
                    <div className="p-3 text-center text-xs text-gray-500">
                      No custom key-value pairs added.
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div>
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Tags
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedWord.tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="p-4 border-t border-gray-700/80 bg-[#292a2d] flex items-center justify-between gap-2">
              <button
                onClick={() => handleOpenEdit(selectedWord)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-200 transition"
              >
                <Edit2 size={13} />
                Edit Word
              </button>
              <button
                onClick={() => setWordToDelete(selectedWord)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-300 text-xs font-semibold transition"
              >
                <Trash2 size={13} />
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Word Modal */}
      {isEditorOpen && editingItem && (
        <VocabularyEditorModal
          item={editingItem}
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          onSave={(itemToSave) => {
            if (vocabulary.some((v) => v.id === itemToSave.id)) {
              onUpdateWord(itemToSave);
            } else {
              onAddWord(itemToSave);
            }
            if (selectedWord?.id === itemToSave.id) {
              setSelectedWord(itemToSave);
            }
            setIsEditorOpen(false);
          }}
        />
      )}

      {/* Confirmation Dialog before deleting vocabulary word */}
      {wordToDelete && (
        <ConfirmModal
          isOpen={!!wordToDelete}
          title="Delete Vocabulary Term"
          message={`Are you sure you want to delete "${wordToDelete.word}" and its ${wordToDelete.customFields.length} key-value attributes from your lexicon? This action cannot be undone.`}
          confirmLabel="Delete Word"
          isDestructive={true}
          onConfirm={() => {
            onDeleteWord(wordToDelete.id);
            if (selectedWord?.id === wordToDelete.id) setSelectedWord(null);
            setWordToDelete(null);
          }}
          onCancel={() => setWordToDelete(null)}
        />
      )}
    </div>
  );
};

// Modal for editing words with dynamic key-value pairs and tags
interface VocabularyEditorModalProps {
  item: VocabularyItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (saved: VocabularyItem) => void;
}

const VocabularyEditorModal: React.FC<VocabularyEditorModalProps> = ({
  item,
  isOpen,
  onClose,
  onSave,
}) => {
  const [word, setWord] = useState(item.word);
  const [definition, setDefinition] = useState(item.definition);
  const [pronunciation, setPronunciation] = useState(item.pronunciation || '');
  const [etymology, setEtymology] = useState(item.etymology || '');
  const [exampleContext, setExampleContext] = useState(item.exampleContext || '');
  const [tagsInput, setTagsInput] = useState(item.tags.join(', '));
  const [customFields, setCustomFields] = useState<KeyValuePair[]>(item.customFields || []);

  const handleAddField = () => {
    setCustomFields([
      ...customFields,
      { id: `cf-${Date.now()}`, key: '', value: '' },
    ]);
  };

  const handleUpdateField = (id: string, key: string, value: string) => {
    setCustomFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, key, value } : f))
    );
  };

  const handleRemoveField = (id: string) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSave = () => {
    if (!word.trim() || !definition.trim()) return;

    // Parse tags cleanly (ensure they start with # if user didn't type it)
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));

    const updatedItem: VocabularyItem = {
      ...item,
      word: word.trim(),
      definition: definition.trim(),
      pronunciation: pronunciation.trim() || undefined,
      etymology: etymology.trim() || undefined,
      exampleContext: exampleContext.trim() || undefined,
      tags: tags.length > 0 ? tags : ['#vocabulary'],
      customFields: customFields.filter((cf) => cf.key.trim() && cf.value.trim()),
      updatedAt: Date.now(),
    };

    onSave(updatedItem);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="flex flex-col w-full max-w-xl max-h-[90vh] bg-[#292a2d] text-gray-100 rounded-2xl shadow-2xl border border-gray-700/80 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-700/70 bg-[#202124]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <BookOpen size={18} />
            </span>
            <span className="font-semibold text-sm md:text-base">
              {item.word ? `Edit Word: ${item.word}` : 'Add Vocabulary & Key-Value'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/60 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Word / Term <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="e.g. Petrichor, Sonder, Astral..."
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm font-semibold text-gray-100 focus:outline-hidden focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Pronunciation / Phonetic
              </label>
              <input
                type="text"
                value={pronunciation}
                onChange={(e) => setPronunciation(e.target.value)}
                placeholder="e.g. /ˈpɛtrɪkɔːr/"
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm font-mono text-gray-100 focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Definition / Meaning <span className="text-amber-400">*</span>
            </label>
            <textarea
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              rows={2}
              placeholder="The precise literary definition or meaning..."
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-100 focus:outline-hidden focus:border-amber-500 resize-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Etymology / Linguistic Origin
              </label>
              <input
                type="text"
                value={etymology}
                onChange={(e) => setEtymology(e.target.value)}
                placeholder="e.g. Greek petra (stone) + ichor"
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-100 focus:outline-hidden focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="#sensory, #atmosphere, #archaic"
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-100 focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Story Context / Usage Example
            </label>
            <textarea
              value={exampleContext}
              onChange={(e) => setExampleContext(e.target.value)}
              rows={2}
              placeholder="Sentence from your story manuscript featuring this word..."
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-100 focus:outline-hidden focus:border-amber-500 resize-none italic font-writing leading-relaxed"
            />
          </div>

          {/* Key - Value Store Section */}
          <div className="pt-2 border-t border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <SlidersHorizontal size={14} />
                Key - Value Attributes
              </label>
              <button
                type="button"
                onClick={handleAddField}
                className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
              >
                <Plus size={14} />
                Add Key-Value
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mb-3">
              Store custom attributes for searching (e.g. Tone: Melancholic, Chapter: 4, Dialect: Elvish, Rank: Archmage).
            </p>

            <div className="space-y-2">
              {customFields.map((field) => (
                <div key={field.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={field.key}
                    onChange={(e) => handleUpdateField(field.id, e.target.value, field.value)}
                    placeholder="Key (e.g. Tone)"
                    className="w-1/3 px-2.5 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-xs text-amber-300 font-medium focus:outline-hidden focus:border-amber-500"
                  />
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => handleUpdateField(field.id, field.key, e.target.value)}
                    placeholder="Value (e.g. Somber / Dark)"
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-100 focus:outline-hidden focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveField(field.id)}
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {customFields.length === 0 && (
                <button
                  type="button"
                  onClick={handleAddField}
                  className="w-full py-2.5 rounded-xl border border-dashed border-gray-700 hover:border-amber-500/60 text-xs text-gray-400 hover:text-amber-400 transition"
                >
                  + Add first custom key-value pair
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-700/70 bg-[#202124]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-gray-300 hover:bg-gray-800 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!word.trim() || !definition.trim()}
            className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:hover:bg-amber-500 text-black text-xs font-semibold transition active:scale-95 cursor-pointer"
          >
            Save Word & Codex
          </button>
        </div>
      </div>
    </div>
  );
};
