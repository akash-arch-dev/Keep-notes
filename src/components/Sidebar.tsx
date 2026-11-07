import React from 'react';
import {
  FileText,
  Pin,
  Map as MapIcon,
  Tag,
  Archive,
  Trash2,
  Terminal,
  Settings,
  Plus,
  BookOpen,
  Cloud,
} from 'lucide-react';
import { NavSection } from '../types';

interface SidebarProps {
  currentSection: NavSection;
  selectedTag: string | null;
  onSelectSection: (section: NavSection, tag?: string | null) => void;
  tags: string[];
  notesCount: number;
  pinnedCount: number;
  vocabularyCount: number;
  archiveCount: number;
  trashCount: number;
  isCollapsed: boolean;
  onOpenShortcuts: () => void;
  onOpenEditLabels: () => void;
  isDark: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  selectedTag,
  onSelectSection,
  tags,
  notesCount,
  pinnedCount,
  vocabularyCount,
  archiveCount,
  trashCount,
  isCollapsed,
  onOpenShortcuts,
  onOpenEditLabels,
  isDark,
}) => {
  const navItems = [
    {
      id: 'notes' as NavSection,
      label: 'Notes',
      icon: FileText,
      count: notesCount,
    },
    {
      id: 'pinned' as NavSection,
      label: 'Pinned',
      icon: Pin,
      count: pinnedCount,
    },
    {
      id: 'vocabulary' as NavSection,
      label: 'Vocabulary Map',
      icon: MapIcon,
      count: vocabularyCount,
      highlight: true,
    },
    {
      id: 'supabase' as NavSection,
      label: 'Cloud & Storage',
      icon: Cloud,
      count: 0,
      highlight: true,
    },
    {
      id: 'archive' as NavSection,
      label: 'Archive',
      icon: Archive,
      count: archiveCount,
    },
    {
      id: 'trash' as NavSection,
      label: 'Trash',
      icon: Trash2,
      count: trashCount,
    },
  ];

  return (
    <aside
      className={`h-[calc(100vh-64px)] transition-all duration-300 ease-in-out shrink-0 flex flex-col justify-between overflow-y-auto select-none border-r ${
        isDark ? 'bg-[#202124] border-gray-800' : 'bg-white border-gray-200'
      } ${isCollapsed ? 'w-16' : 'w-64'}`}
    >
      <div className="py-2 space-y-1">
        {/* Main Navigation Links */}
        {navItems.map((item) => {
          const isActive = currentSection === item.id && !selectedTag;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id, null)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-r-full text-xs md:text-sm font-medium transition cursor-pointer ${
                isActive
                  ? 'bg-amber-500/20 text-amber-400 font-semibold'
                  : isDark
                  ? 'text-gray-300 hover:bg-gray-800/80 hover:text-white'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-black'
              }`}
              title={item.label}
            >
              <div className="flex items-center gap-4">
                <Icon
                  size={19}
                  className={`shrink-0 ${
                    isActive
                      ? 'text-amber-400'
                      : item.highlight
                      ? 'text-amber-400/80'
                      : 'text-gray-400'
                  }`}
                />
                {!isCollapsed && <span>{item.label}</span>}
              </div>

              {!isCollapsed && item.count > 0 && (
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-amber-500/30 text-amber-300'
                      : isDark
                      ? 'bg-gray-800 text-gray-400'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}

        {/* Labels / Tags Section */}
        <div className="pt-3 pb-1">
          {!isCollapsed && (
            <div className="px-5 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
              <span>Tags & Labels</span>
              <button
                onClick={onOpenEditLabels}
                className="hover:text-amber-400 transition"
                title="Edit Labels"
              >
                Edit
              </button>
            </div>
          )}

          {tags.map((tag) => {
            const isTagActive = currentSection === 'tag' && selectedTag === tag;
            return (
              <button
                key={tag}
                onClick={() => onSelectSection('tag', tag)}
                className={`w-full flex items-center gap-4 px-4 py-2 rounded-r-full text-xs md:text-sm transition cursor-pointer truncate ${
                  isTagActive
                    ? 'bg-amber-500/20 text-amber-400 font-semibold'
                    : isDark
                    ? 'text-gray-300 hover:bg-gray-800/80 hover:text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-black'
                }`}
                title={tag}
              >
                <Tag size={17} className="shrink-0 text-gray-400" />
                {!isCollapsed && <span className="truncate">{tag}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Area: Arch Linux / Android Shortcuts Button */}
      <div className="p-3 border-t border-gray-800 space-y-1">
        <button
          onClick={onOpenShortcuts}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
            isDark
              ? 'text-gray-400 hover:text-white hover:bg-gray-800'
              : 'text-gray-600 hover:text-black hover:bg-gray-100'
          }`}
          title="Linux (Arch) & Android Shortcuts"
        >
          <Terminal size={17} className="text-amber-400 shrink-0" />
          {!isCollapsed && <span>Linux & Android Keys</span>}
        </button>

        {!isCollapsed && (
          <div className="px-3 pt-1 text-[10px] text-gray-500 font-mono flex items-center justify-between">
            <span>KeepScribe v2.0</span>
            <span className="text-emerald-400">● Local/Offline</span>
          </div>
        )}
      </div>
    </aside>
  );
};
