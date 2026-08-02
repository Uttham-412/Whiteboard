import React, { useState } from 'react';
import { 
  MousePointer, Hand, Edit2, Brush, PenTool, Highlighter, Flame, Eraser, 
  Square, Circle, Triangle, Diamond, ArrowRight, Spline, StickyNote, Type, 
  Layout, Table, Code, Binary, Image, Sparkles, Grid, Layers, Sliders, ChevronDown
} from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import { ToolType, ElementType, GridType } from '../../types';
import { COLOR_SWATCHES, FILL_PRESETS } from '../../constants/theme';

interface FloatingToolbarProps {
  onOpenTemplates: () => void;
  onOpenAI: () => void;
  onToggleLayers: () => void;
  onToggleCommandPalette: () => void;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  onOpenTemplates,
  onOpenAI,
  onToggleLayers,
  onToggleCommandPalette
}) => {
  const {
    tool, setTool, brushColor, setBrushColor, fillColor, setFillColor,
    strokeWidth, setStrokeWidth, gridType, setGridType
  } = useCanvasStore();

  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [showGridMenu, setShowGridMenu] = useState(false);

  const mainTools = [
    { id: 'select', name: 'Select (V)', icon: MousePointer },
    { id: 'hand', name: 'Hand / Pan (H)', icon: Hand },
    { id: 'pencil', name: 'Pen (P)', icon: Edit2 },
    { id: 'brush', name: 'Brush', icon: Brush },
    { id: 'highlighter', name: 'Highlighter', icon: Highlighter },
    { id: 'laser', name: 'Laser Pointer (L)', icon: Flame },
    { id: 'eraser', name: 'Eraser (E)', icon: Eraser },
    { id: 'sticky', name: 'Sticky Note (S)', icon: StickyNote },
    { id: 'text', name: 'Text (T)', icon: Type },
    { id: 'orthogonal-connector', name: 'Smart Connector', icon: ArrowRight },
    { id: 'frame', name: 'Frame / Container (F)', icon: Layout },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center space-x-1.5 p-2 glass-panel rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-6 duration-300">
      {/* Primary Tools */}
      {mainTools.map((t) => {
        const Icon = t.icon;
        const isActive = tool === t.id;

        return (
          <button
            key={t.id}
            title={t.name}
            onClick={() => setTool(t.id as ToolType)}
            className={`relative p-2.5 rounded-xl transition-all ${
              isActive
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}

      <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

      {/* Shapes Dropdown Menu */}
      <div className="relative">
        <button
          onClick={() => setShowShapeMenu(!showShapeMenu)}
          title="Shapes & Diagram Nodes"
          className="flex items-center space-x-1 p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          <Square className="w-4 h-4" />
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {showShapeMenu && (
          <div className="absolute bottom-14 left-0 glass-dropdown rounded-2xl p-3 shadow-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-4 gap-2 w-56 animate-in fade-in zoom-in-95 duration-150">
            <button onClick={() => { setTool('rect'); setShowShapeMenu(false); }} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center text-[10px]">
              <Square className="w-4 h-4 mb-1 text-blue-500" /> Rect
            </button>
            <button onClick={() => { setTool('circle'); setShowShapeMenu(false); }} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center text-[10px]">
              <Circle className="w-4 h-4 mb-1 text-purple-500" /> Circle
            </button>
            <button onClick={() => { setTool('triangle'); setShowShapeMenu(false); }} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center text-[10px]">
              <Triangle className="w-4 h-4 mb-1 text-emerald-500" /> Triangle
            </button>
            <button onClick={() => { setTool('diamond'); setShowShapeMenu(false); }} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center text-[10px]">
              <Diamond className="w-4 h-4 mb-1 text-amber-500" /> Diamond
            </button>
            <button onClick={() => { setTool('table'); setShowShapeMenu(false); }} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center text-[10px]">
              <Table className="w-4 h-4 mb-1 text-slate-500" /> Table
            </button>
            <button onClick={() => { setTool('code-block'); setShowShapeMenu(false); }} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center text-[10px]">
              <Code className="w-4 h-4 mb-1 text-slate-500" /> Code
            </button>
            <button onClick={() => { setTool('math-formula'); setShowShapeMenu(false); }} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center text-[10px]">
              <Binary className="w-4 h-4 mb-1 text-slate-500" /> Math
            </button>
            <button onClick={() => { setTool('cloud-node'); setShowShapeMenu(false); }} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center text-[10px]">
              <Layout className="w-4 h-4 mb-1 text-blue-500" /> Cloud
            </button>
          </div>
        )}
      </div>

      <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

      {/* Grid Switcher */}
      <div className="relative">
        <button
          onClick={() => setShowGridMenu(!showGridMenu)}
          title="Grid & Background Mode"
          className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          <Grid className="w-4 h-4" />
        </button>

        {showGridMenu && (
          <div className="absolute bottom-14 right-0 glass-dropdown rounded-2xl p-2 shadow-2xl border border-slate-200 dark:border-slate-800 w-44 space-y-1 animate-in fade-in zoom-in-95 duration-150">
            <button onClick={() => { setGridType('dots'); setShowGridMenu(false); }} className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium">Dot Grid</button>
            <button onClick={() => { setGridType('lines'); setShowGridMenu(false); }} className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium">Engineering Grid</button>
            <button onClick={() => { setGridType('blueprint'); setShowGridMenu(false); }} className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium">Blueprint Mode</button>
            <button onClick={() => { setGridType('graph'); setShowGridMenu(false); }} className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium">Graph Paper</button>
            <button onClick={() => { setGridType('blank'); setShowGridMenu(false); }} className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium">Pure Blank</button>
          </div>
        )}
      </div>

      {/* Layers Panel Toggle */}
      <button
        onClick={onToggleLayers}
        title="Layers Panel"
        className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
      >
        <Layers className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

      {/* AI Assistant Generator */}
      <button
        onClick={onOpenAI}
        title="AI Diagram Generator"
        className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-semibold shadow-lg shadow-purple-500/25 transition-all scale-105"
      >
        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
        <span className="hidden md:inline">AI Studio</span>
      </button>

      {/* Templates Catalog */}
      <button
        onClick={onOpenTemplates}
        title="Templates Catalog"
        className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold transition-all"
      >
        Templates
      </button>
    </div>
  );
};
