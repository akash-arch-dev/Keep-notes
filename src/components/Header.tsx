import React from 'react';
import {
  Menu,
  Search,
  X,
  LayoutGrid,
  List,
  Sun,
  Moon,
  Download,
  Upload,
  Sparkles,
  Smartphone,
  HardDrive,
} from 'lucide-react';
import { ViewMode } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderProps {
  onToggleSidebar: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: ViewMode;
  onToggleViewMode: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  onExport: () => void;
  onOpenImport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  searchQuery,
  onSearchChange,
  viewMode,
  onToggleViewMode,
  isDark,
  onToggleDark,
  onExport,
  onOpenImport,
}) => {
  const { isInstallable, isInstalled, install, isIOS, isAndroid, isLinux } = usePWAInstall();

  return (
    <header
      className={`h-16 px-3 md:px-5 border-b flex items-center justify-between gap-2 md:gap-4 select-none shrink-0 sticky top-0 z-40 transition-colors ${
        isDark ? 'bg-[#202124] border-gray-800' : 'bg-white border-gray-200'
      }`}
    >
      {/* Left: Hamburger & Brand */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <button
          onClick={onToggleSidebar}
          className={`p-2 rounded-full transition cursor-pointer ${
            isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
          }`}
          title="Toggle Navigation Menu"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2.5">
          <img src="/icon.svg" alt="KeepScribe" className="w-8 h-8 rounded-lg shadow-xs" />
          <div className="hidden sm:block">
            <span
              className={`font-bold text-base tracking-tight font-writing ${
                isDark ? 'text-amber-400' : 'text-amber-600'
              }`}
            >
              KeepScribe
            </span>
            <span className="block text-[10px] text-gray-400 font-sans uppercase tracking-wider font-semibold">
              Creative Writer's Studio
            </span>
          </div>
        </div>
      </div>

      {/* Middle: Google Keep Search Bar */}
      <div className="flex-1 max-w-2xl mx-1 md:mx-4">
        <div
          className={`relative flex items-center rounded-2xl border transition-all ${
            isDark
              ? 'bg-[#292a2d] border-transparent focus-within:bg-[#303134] focus-within:border-amber-500/50 focus-within:shadow-md'
              : 'bg-[#f1f3f4] border-transparent focus-within:bg-white focus-within:border-amber-500/50 focus-within:shadow-md'
          }`}
        >
          <Search size={18} className="absolute left-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notes, chapters, dialogue, or tags... (Press /)"
            className={`w-full py-2.5 pl-10 pr-9 text-xs md:text-sm bg-transparent rounded-2xl focus:outline-hidden ${
              isDark ? 'text-gray-100 placeholder-gray-400' : 'text-gray-800 placeholder-gray-500'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 text-gray-400 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Right Controls: View Switcher, PWA Install, Backup, Dark Mode */}
      <div className="flex items-center gap-1 md:gap-1.5 shrink-0">
        {/* PWA Install Button (Prompt for Android / Linux / Chrome) */}
        {isInstallable && !isInstalled && (
          <button
            onClick={install}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
            title="Install app to your Linux Arch desktop or Android home screen"
          >
            <Smartphone size={14} />
            <span className="hidden sm:inline">Install PWA</span>
          </button>
        )}

        {/* View Mode Toggle: Grid vs List */}
        <button
          onClick={onToggleViewMode}
          className={`p-2 rounded-full transition cursor-pointer ${
            isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
          }`}
          title={viewMode === 'grid' ? 'Switch to List view' : 'Switch to Grid view'}
        >
          {viewMode === 'grid' ? <List size={19} /> : <LayoutGrid size={19} />}
        </button>

        {/* Backup Export */}
        <button
          onClick={onExport}
          className={`p-2 rounded-full transition cursor-pointer ${
            isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
          }`}
          title="Export JSON Backup (Sync between Linux & Android)"
        >
          <Download size={19} />
        </button>

        {/* Backup Import */}
        <button
          onClick={onOpenImport}
          className={`p-2 rounded-full transition cursor-pointer ${
            isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
          }`}
          title="Import JSON Backup"
        >
          <Upload size={19} />
        </button>

        {/* Theme Dark/Light Toggle */}
        <button
          onClick={onToggleDark}
          className={`p-2 rounded-full transition cursor-pointer ${
            isDark ? 'text-amber-400 hover:bg-gray-800' : 'text-amber-600 hover:bg-gray-100'
          }`}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun size={19} /> : <Moon size={19} />}
        </button>
      </div>
    </header>
  );
};
