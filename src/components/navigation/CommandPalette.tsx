import React, { useState, useEffect } from 'react';
import { Search, Command, Layout, Sparkles, Sliders, Trash2, Copy, Download, Share2, Layers, Grid } from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import { ToolType, GridType } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTemplates: () => void;
  onOpenAI: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onOpenTemplates, onOpenAI }) => {
  const [query, setQuery] = useState('');
  const { setTool, setGridType, clearCanvas, deleteSelectedElements, duplicateSelectedElements, resetViewport } = useCanvasStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open palette
          setQuery('');
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    { id: 'tool-select', label: 'Select Tool (V)', category: 'Tools', icon: Command, action: () => { setTool('select'); onClose(); } },
    { id: 'tool-pen', label: 'Pen Tool (P)', category: 'Tools', icon: Command, action: () => { setTool('pencil'); onClose(); } },
    { id: 'tool-brush', label: 'Brush Tool (B)', category: 'Tools', icon: Command, action: () => { setTool('brush'); onClose(); } },
    { id: 'tool-highlighter', label: 'Highlighter Tool (H)', category: 'Tools', icon: Command, action: () => { setTool('highlighter'); onClose(); } },
    { id: 'tool-laser', label: 'Laser Pointer (L)', category: 'Tools', icon: Command, action: () => { setTool('laser'); onClose(); } },
    { id: 'tool-sticky', label: 'Sticky Note (S)', category: 'Tools', icon: Command, action: () => { setTool('sticky'); onClose(); } },
    { id: 'tool-frame', label: 'Frame / Container (F)', category: 'Tools', icon: Layout, action: () => { setTool('frame'); onClose(); } },
    { id: 'ai-gen', label: 'AI Generator Studio', category: 'AI', icon: Sparkles, action: () => { onClose(); onOpenAI(); } },
    { id: 'templates', label: 'Browse 75+ Templates', category: 'Templates', icon: Layout, action: () => { onClose(); onOpenTemplates(); } },
    { id: 'grid-dots', label: 'Set Grid: Dot Grid', category: 'Canvas', icon: Grid, action: () => { setGridType('dots'); onClose(); } },
    { id: 'grid-lines', label: 'Set Grid: Engineering Grid', category: 'Canvas', icon: Grid, action: () => { setGridType('lines'); onClose(); } },
    { id: 'grid-blueprint', label: 'Set Grid: Blueprint Mode', category: 'Canvas', icon: Grid, action: () => { setGridType('blueprint'); onClose(); } },
    { id: 'grid-graph', label: 'Set Grid: Graph Paper', category: 'Canvas', icon: Grid, action: () => { setGridType('graph'); onClose(); } },
    { id: 'reset-cam', label: 'Reset Camera Viewport (0)', category: 'Canvas', icon: Sliders, action: () => { resetViewport(); onClose(); } },
    { id: 'dup-selected', label: 'Duplicate Selected (Ctrl+D)', category: 'Actions', icon: Copy, action: () => { duplicateSelectedElements(); onClose(); } },
    { id: 'del-selected', label: 'Delete Selected (Del)', category: 'Actions', icon: Trash2, action: () => { deleteSelectedElements(); onClose(); } },
    { id: 'clear-all', label: 'Clear Canvas', category: 'Actions', icon: Trash2, action: () => { clearCanvas(); onClose(); } },
  ];

  const filtered = actions.filter(a => a.label.toLowerCase().includes(query.toLowerCase()) || a.category.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl glass-dropdown rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
        <div className="flex items-center px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command, tool, template, or action... (Esc to close)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none text-base font-medium"
          />
          <kbd className="px-2 py-1 text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">ESC</kbd>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">No matching commands found</div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-800 dark:text-slate-200 transition-colors text-left text-sm font-medium"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span>{item.label}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">{item.category}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
