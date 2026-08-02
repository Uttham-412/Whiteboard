import React, { useState } from 'react';
import { 
  MousePointer, Hand, Edit2, Square, Type, StickyNote, ArrowRight, Layout, 
  Sparkles, Grid, Layers, ChevronRight, Cloud, Table
} from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import { ToolType } from '../../types';

interface LeftToolbarProps {
  onOpenAI: () => void;
  onOpenTemplates: () => void;
  onToggleLayers: () => void;
}

export const LeftToolbar: React.FC<LeftToolbarProps> = ({
  onOpenAI,
  onOpenTemplates,
  onToggleLayers
}) => {
  const { tool, setTool } = useCanvasStore();
  const [showShapeFlyout, setShowShapeFlyout] = useState(false);

  const tools = [
    { id: 'select', name: 'Select (V)', icon: MousePointer },
    { id: 'hand', name: 'Hand / Pan (H)', icon: Hand },
    { id: 'pencil', name: 'Pencil / Pen (P)', icon: Edit2 },
    { id: 'sticky', name: 'Sticky Note (S)', icon: StickyNote },
    { id: 'text', name: 'Text (T)', icon: Type },
    { id: 'orthogonal-connector', name: 'Smart Connector (C)', icon: ArrowRight },
    { id: 'frame', name: 'Frame / Container (F)', icon: Layout },
    { id: 'cloud-node', name: 'Cloud & Diagram Node', icon: Cloud },
  ];

  return (
    <aside className="fixed left-4 top-20 bottom-24 z-40 flex flex-col items-center py-3 px-1.5 figma-panel rounded-2xl shadow-sm border border-slate-200 bg-white w-12 justify-between">
      {/* Primary Tool Buttons */}
      <div className="flex flex-col items-center space-y-1.5 w-full">
        {tools.map((t) => {
          const Icon = t.icon;
          const isActive = tool === t.id;

          return (
            <button
              key={t.id}
              title={t.name}
              onClick={() => setTool(t.id as ToolType)}
              className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {isActive && <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-blue-600 rounded-r" />}
            </button>
          );
        })}
      </div>

      {/* Bottom Auxiliary Actions */}
      <div className="flex flex-col items-center space-y-1.5 w-full pt-3 border-t border-slate-200">
        {/* Layers Toggle */}
        <button
          onClick={onToggleLayers}
          title="Layers & Hierarchy"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* Templates */}
        <button
          onClick={onOpenTemplates}
          title="75+ Pre-designed Templates"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <Grid className="w-4 h-4" />
        </button>

        {/* AI Studio */}
        <button
          onClick={onOpenAI}
          title="AI Diagram Generator Studio"
          className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-500/20 transition-all scale-100 hover:scale-105"
        >
          <Sparkles className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
