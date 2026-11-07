import React, { useState } from 'react';
import { X, Tag, Plus, Trash2, Check } from 'lucide-react';

interface EditLabelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tags: string[];
  onAddTag: (tag: string) => void;
  onDeleteTag: (tag: string) => void;
}

export const EditLabelsModal: React.FC<EditLabelsModalProps> = ({
  isOpen,
  onClose,
  tags,
  onAddTag,
  onDeleteTag,
}) => {
  const [newTag, setNewTag] = useState('');

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!newTag.trim()) return;
    const formatted = newTag.trim().startsWith('#') ? newTag.trim() : `#${newTag.trim()}`;
    onAddTag(formatted);
    setNewTag('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="flex flex-col w-full max-w-sm bg-[#292a2d] text-gray-100 rounded-2xl shadow-2xl border border-gray-700/80 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-700/70 bg-[#202124]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Tag size={18} />
            </span>
            <span className="font-semibold text-sm md:text-base">Edit Tags & Labels</span>
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
          {/* Create new tag */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
              }}
              placeholder="Create new label (e.g. #climax, #magic)..."
              className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-100 focus:outline-hidden focus:border-amber-500"
            />
            <button
              onClick={handleAdd}
              disabled={!newTag.trim()}
              className="p-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black transition"
            >
              <Check size={16} />
            </button>
          </div>

          {/* List of existing tags */}
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {tags.map((tag) => (
              <div
                key={tag}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-800/80 border border-gray-700/60 text-xs text-gray-200"
              >
                <div className="flex items-center gap-2">
                  <Tag size={13} className="text-amber-400" />
                  <span>{tag}</span>
                </div>
                <button
                  onClick={() => onDeleteTag(tag)}
                  className="p-1 text-gray-400 hover:text-red-400 transition"
                  title="Delete tag"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {tags.length === 0 && (
              <p className="text-center py-4 text-xs text-gray-500">No labels created yet.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 border-t border-gray-700/70 bg-[#202124]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
