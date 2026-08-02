import React, { useState } from 'react';
import { 
  ChevronLeft, Cloud, Check, Download, Share2, Users, 
  ZoomIn, ZoomOut, RotateCcw, Undo, Redo, Command, Sparkles
} from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import { useAuthStore } from '../../store/authStore';
import { exportBoardToPNG, exportBoardToSVG, exportBoardToPDF, exportBoardToJSON, exportBoardToDrawIO, exportBoardToPlantUML } from '../../services/exportImport';

interface TopNavProps {
  onBackToDashboard: () => void;
  onOpenCommandPalette: () => void;
  onOpenShareModal: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onBackToDashboard,
  onOpenCommandPalette,
  onOpenShareModal
}) => {
  const { 
    boardTitle, renameBoard, saving, undo, redo, elements, scale, zoom, resetViewport, cursors 
  } = useCanvasStore();
  const { user } = useAuthStore();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(boardTitle);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (titleValue.trim() && titleValue !== boardTitle) {
      renameBoard(titleValue.trim());
    }
  };

  return (
    <header className="fixed top-4 left-4 right-4 z-40 flex items-center justify-between figma-panel rounded-xl px-4 py-2 shadow-sm border border-slate-200 bg-white h-11">
      {/* Left: Back & Board Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onBackToDashboard}
          className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          title="Back to Dashboard"
        >
          <ChevronLeft className="w-4 h-4" />
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
              className="px-2 py-0.5 bg-slate-50 text-slate-900 font-semibold text-xs rounded border border-blue-500 outline-none"
            />
          ) : (
            <h1
              onClick={() => { setTitleValue(boardTitle); setIsEditingTitle(true); }}
              className="text-xs font-semibold text-slate-900 hover:bg-slate-100 px-2 py-0.5 rounded cursor-pointer transition-colors"
            >
              {boardTitle}
            </h1>
          )}

          {/* Autosave status pill */}
          <div className="flex items-center space-x-1 text-[11px] text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-50 border border-slate-200">
            {saving ? <Cloud className="w-3 h-3 text-blue-500 animate-pulse" /> : <Check className="w-3 h-3 text-emerald-600" />}
            <span className="hidden sm:inline">{saving ? 'Saving...' : 'Saved'}</span>
          </div>
        </div>
      </div>

      {/* Center: Zoom Level Controls */}
      <div className="flex items-center space-x-1 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200 text-xs">
        <button onClick={() => zoom(0.9)} title="Zoom Out" className="p-0.5 hover:bg-white rounded text-slate-600"><ZoomOut className="w-3.5 h-3.5" /></button>
        <span onClick={resetViewport} className="font-mono text-[11px] px-1 text-slate-700 cursor-pointer font-semibold" title="Reset Zoom">{Math.round(scale * 100)}%</span>
        <button onClick={() => zoom(1.1)} title="Zoom In" className="p-0.5 hover:bg-white rounded text-slate-600"><ZoomIn className="w-3.5 h-3.5" /></button>
      </div>

      {/* Right: Undo/Redo, Presence, Export, Share */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1 border-r border-slate-200 pr-2">
          <button onClick={undo} title="Undo (Ctrl+Z)" className="p-1 rounded hover:bg-slate-100 text-slate-600"><Undo className="w-3.5 h-3.5" /></button>
          <button onClick={redo} title="Redo (Ctrl+Y)" className="p-1 rounded hover:bg-slate-100 text-slate-600"><Redo className="w-3.5 h-3.5" /></button>
        </div>

        {/* Presence Avatars */}
        <div className="flex items-center -space-x-1.5">
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-white">
            {user?.displayName?.[0] || 'U'}
          </div>
          {Object.values(cursors).map((c, i) => (
            <div key={i} title={c.name} className="w-6 h-6 rounded-full text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-white" style={{ backgroundColor: c.color }}>
              {c.name[0]}
            </div>
          ))}
        </div>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center space-x-1 px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {showExportMenu && (
            <div className="absolute right-0 top-9 figma-dropdown rounded-xl p-1.5 shadow-lg border border-slate-200 w-44 space-y-0.5 text-xs font-medium z-50 bg-white">
              <button onClick={() => { exportBoardToPNG(elements); setShowExportMenu(false); }} className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100">Export PNG</button>
              <button onClick={() => { exportBoardToSVG(elements); setShowExportMenu(false); }} className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100">Export SVG</button>
              <button onClick={() => { exportBoardToPDF(elements); setShowExportMenu(false); }} className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100">Export PDF</button>
              <button onClick={() => { exportBoardToJSON(elements, boardTitle); setShowExportMenu(false); }} className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100">Export JSON</button>
              <button onClick={() => { exportBoardToDrawIO(elements, boardTitle); setShowExportMenu(false); }} className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100 font-semibold text-blue-600">Export Draw.io XML</button>
              <button onClick={() => { exportBoardToPlantUML(elements, boardTitle); setShowExportMenu(false); }} className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100 font-semibold text-purple-600">Export PlantUML</button>
            </div>
          )}
        </div>

        {/* AI Studio Button */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center space-x-1 px-2.5 py-1 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg text-xs font-semibold shadow-2xs transition-all animate-pulse-slow"
          title="Open AI Studio"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-200" />
          <span className="hidden sm:inline">AI Studio</span>
        </button>

        {/* Share Button */}
        <button
          onClick={onOpenShareModal}
          className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </button>
      </div>
    </header>
  );
};
