import React, { useState } from 'react';
import { 
  ChevronLeft, Cloud, Check, Download, Share2, Sun, Moon, 
  Users, Command, Undo, Redo, Sparkles
} from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../ui/Toast';
import { exportBoardToPNG, exportBoardToSVG, exportBoardToPDF, exportBoardToJSON } from '../../services/exportImport';

interface TopBarProps {
  onBackToDashboard: () => void;
  onOpenCommandPalette: () => void;
  onOpenShareModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onBackToDashboard,
  onOpenCommandPalette,
  onOpenShareModal
}) => {
  const { boardTitle, renameBoard, saving, undo, redo, elements, cursors } = useCanvasStore();
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(boardTitle);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  const toggleDarkMode = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (titleValue.trim() && titleValue !== boardTitle) {
      renameBoard(titleValue.trim());
    }
  };

  return (
    <div className="fixed top-4 left-4 right-4 z-40 flex items-center justify-between glass-panel rounded-2xl px-4 py-2.5 shadow-xl border border-slate-200 dark:border-slate-800">
      {/* Left section: Navigation & Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onBackToDashboard}
          className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Back to Dashboard"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2">
          {isEditingTitle ? (
            <input
              type="text"
              autoFocus
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()}
              className="px-2 py-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold text-sm rounded-lg border border-blue-500 outline-none"
            />
          ) : (
            <h1
              onClick={() => { setTitleValue(boardTitle); setIsEditingTitle(true); }}
              className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 px-2 py-1 rounded-lg cursor-pointer transition-colors"
            >
              {boardTitle}
            </h1>
          )}

          {/* Autosave status indicator */}
          <div className="flex items-center space-x-1 text-[11px] text-slate-400 font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
            {saving ? (
              <Cloud className="w-3 h-3 text-blue-500 animate-pulse" />
            ) : (
              <Check className="w-3 h-3 text-emerald-500" />
            )}
            <span className="hidden sm:inline">{saving ? 'Saving...' : 'Saved'}</span>
          </div>
        </div>
      </div>

      {/* Middle section: Command Palette Shortcut */}
      <button
        onClick={onOpenCommandPalette}
        className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 rounded-xl text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50 transition-colors"
      >
        <Command className="w-3.5 h-3.5" />
        <span>Search actions...</span>
        <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 text-slate-400">Ctrl K</kbd>
      </button>

      {/* Right section: Undo/Redo, Presence, Export, Share, Dark Mode */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1 border-r border-slate-200 dark:border-slate-800 pr-2">
          <button onClick={undo} title="Undo (Ctrl+Z)" className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
            <Undo className="w-4 h-4" />
          </button>
          <button onClick={redo} title="Redo (Ctrl+Y)" className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
            <Redo className="w-4 h-4" />
          </button>
        </div>

        {/* Presence Avatars */}
        <div className="flex items-center -space-x-1.5">
          <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold ring-2 ring-white dark:ring-slate-900">
            {user?.displayName?.[0] || 'U'}
          </div>
          {Object.values(cursors).map((c, i) => (
            <div key={i} title={c.name} className="w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold ring-2 ring-white dark:ring-slate-900" style={{ backgroundColor: c.color }}>
              {c.name[0]}
            </div>
          ))}
        </div>

        {/* Export Menu */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {showExportMenu && (
            <div className="absolute right-0 top-10 glass-dropdown rounded-2xl p-2 shadow-2xl border border-slate-200 dark:border-slate-800 w-40 space-y-1 text-xs font-medium z-50">
              <button onClick={() => { exportBoardToPNG(elements); setShowExportMenu(false); }} className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">Export PNG</button>
              <button onClick={() => { exportBoardToSVG(elements); setShowExportMenu(false); }} className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">Export SVG</button>
              <button onClick={() => { exportBoardToPDF(elements); setShowExportMenu(false); }} className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">Export PDF</button>
              <button onClick={() => { exportBoardToJSON(elements, boardTitle); setShowExportMenu(false); }} className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">Export JSON</button>
            </div>
          )}
        </div>

        {/* Share Button */}
        <button
          onClick={onOpenShareModal}
          className="flex items-center space-x-1 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </button>

        {/* Dark Mode Switcher */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Theme"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>
    </div>
  );
};
