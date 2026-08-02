import React from 'react';
import { 
  AlignLeft, AlignCenter, AlignRight, AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  Lock, Unlock, Eye, EyeOff, Copy, Trash2, ChevronUp, ChevronDown, Type, ArrowRight, Layers
} from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import { COLOR_SWATCHES, FILL_PRESETS, STROKE_WIDTHS } from '../../constants/theme';
import { BorderStyle } from '../../types';

export const PropertyInspector: React.FC = () => {
  const { 
    elements, selectedElementIds, updateSelectedElements, deleteSelectedElements,
    duplicateSelectedElements, bringForward, sendBackward, bringToFront, sendToBack
  } = useCanvasStore();

  const selectedElements = elements.filter(el => selectedElementIds.includes(el.id));
  const primaryEl = selectedElements[0];

  if (selectedElements.length === 0 || !primaryEl) {
    return (
      <aside className="w-72 figma-panel border-l border-slate-200 p-4 text-slate-400 text-xs flex flex-col items-center justify-center text-center">
        <Layers className="w-8 h-8 mb-2 opacity-40 text-slate-400" />
        <span className="font-medium text-slate-500">No Element Selected</span>
        <span className="text-[11px] text-slate-400 mt-1">Select an object on the canvas to inspect and edit properties</span>
      </aside>
    );
  }

  const isMulti = selectedElements.length > 1;

  return (
    <aside className="w-72 figma-panel border-l border-slate-200 flex flex-col h-full overflow-y-auto text-xs font-medium text-slate-700 bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <span className="font-bold text-slate-900 text-xs tracking-tight">
          {isMulti ? `${selectedElements.length} Elements Selected` : primaryEl.type.toUpperCase()}
        </span>
        <div className="flex items-center space-x-1">
          <button onClick={duplicateSelectedElements} title="Duplicate" className="p-1 rounded hover:bg-slate-100 text-slate-500">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button onClick={deleteSelectedElements} title="Delete" className="p-1 rounded hover:bg-red-50 text-red-600">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Align Tools */}
      <div className="p-4 border-b border-slate-200 space-y-2">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Alignment</span>
        <div className="grid grid-cols-6 gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
          <button onClick={() => updateSelectedElements({ align: 'left' })} className="p-1.5 rounded hover:bg-white text-slate-600 flex justify-center" title="Align Left"><AlignLeft className="w-3.5 h-3.5" /></button>
          <button onClick={() => updateSelectedElements({ align: 'center' })} className="p-1.5 rounded hover:bg-white text-slate-600 flex justify-center" title="Align Horizontal Center"><AlignCenter className="w-3.5 h-3.5" /></button>
          <button onClick={() => updateSelectedElements({ align: 'right' })} className="p-1.5 rounded hover:bg-white text-slate-600 flex justify-center" title="Align Right"><AlignRight className="w-3.5 h-3.5" /></button>
          <button onClick={() => updateSelectedElements({ y: 100 })} className="p-1.5 rounded hover:bg-white text-slate-600 flex justify-center" title="Align Top"><AlignStartVertical className="w-3.5 h-3.5" /></button>
          <button onClick={() => updateSelectedElements({ y: 200 })} className="p-1.5 rounded hover:bg-white text-slate-600 flex justify-center" title="Align Middle"><AlignCenterVertical className="w-3.5 h-3.5" /></button>
          <button onClick={() => updateSelectedElements({ y: 300 })} className="p-1.5 rounded hover:bg-white text-slate-600 flex justify-center" title="Align Bottom"><AlignEndVertical className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* Transform Coordinates */}
      <div className="p-4 border-b border-slate-200 space-y-3">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Transform</span>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
            <span className="text-slate-400 font-mono text-[11px]">X</span>
            <input 
              type="number" 
              value={Math.round(primaryEl.x)} 
              onChange={e => updateSelectedElements({ x: parseFloat(e.target.value) || 0 })} 
              className="w-full bg-transparent outline-none text-slate-900 font-mono text-[11px]" 
            />
          </div>
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
            <span className="text-slate-400 font-mono text-[11px]">Y</span>
            <input 
              type="number" 
              value={Math.round(primaryEl.y)} 
              onChange={e => updateSelectedElements({ y: parseFloat(e.target.value) || 0 })} 
              className="w-full bg-transparent outline-none text-slate-900 font-mono text-[11px]" 
            />
          </div>
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
            <span className="text-slate-400 font-mono text-[11px]">W</span>
            <input 
              type="number" 
              value={Math.round(primaryEl.width)} 
              onChange={e => updateSelectedElements({ width: parseFloat(e.target.value) || 10 })} 
              className="w-full bg-transparent outline-none text-slate-900 font-mono text-[11px]" 
            />
          </div>
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
            <span className="text-slate-400 font-mono text-[11px]">H</span>
            <input 
              type="number" 
              value={Math.round(primaryEl.height)} 
              onChange={e => updateSelectedElements({ height: parseFloat(e.target.value) || 10 })} 
              className="w-full bg-transparent outline-none text-slate-900 font-mono text-[11px]" 
            />
          </div>
        </div>
      </div>

      {/* Stroke & Border */}
      <div className="p-4 border-b border-slate-200 space-y-3">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Stroke & Border</span>
        {/* Stroke Color Swatches */}
        <div className="flex flex-wrap gap-1.5">
          {COLOR_SWATCHES.map(color => (
            <button
              key={color}
              onClick={() => updateSelectedElements({ color })}
              className={`w-5 h-5 rounded-full border border-slate-300 transition-transform ${primaryEl.color === color ? 'scale-125 ring-2 ring-blue-500' : ''}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        {/* Stroke Width */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-slate-500 text-[11px]">Stroke Width</span>
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {STROKE_WIDTHS.map(w => (
              <button
                key={w}
                onClick={() => updateSelectedElements({ strokeWidth: w })}
                className={`px-2 py-0.5 rounded text-[11px] font-mono ${primaryEl.strokeWidth === w ? 'bg-white text-blue-600 font-bold shadow-sm' : 'text-slate-500'}`}
              >
                {w}px
              </button>
            ))}
          </div>
        </div>

        {/* Stroke Style */}
        <div className="flex items-center justify-between">
          <span className="text-slate-500 text-[11px]">Stroke Pattern</span>
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {(['solid', 'dashed', 'dotted'] as BorderStyle[]).map(style => (
              <button
                key={style}
                onClick={() => updateSelectedElements({ strokeStyle: style })}
                className={`px-2 py-0.5 rounded text-[11px] capitalize ${primaryEl.strokeStyle === style ? 'bg-white text-blue-600 font-bold shadow-sm' : 'text-slate-500'}`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fill Color */}
      <div className="p-4 border-b border-slate-200 space-y-3">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Fill Color</span>
        <div className="flex flex-wrap gap-1.5">
          {FILL_PRESETS.map(fill => (
            <button
              key={fill}
              onClick={() => updateSelectedElements({ fillColor: fill })}
              className={`w-5 h-5 rounded-full border border-slate-300 transition-transform ${primaryEl.fillColor === fill ? 'scale-125 ring-2 ring-blue-500' : ''}`}
              style={{ backgroundColor: fill === 'transparent' ? '#FFFFFF' : fill }}
            />
          ))}
        </div>
      </div>

      {/* Layer Depth Actions */}
      <div className="p-4 space-y-2">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Layer Depth</span>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={bringForward} className="flex items-center justify-center space-x-1.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-semibold text-[11px]">
            <ChevronUp className="w-3.5 h-3.5" />
            <span>Forward</span>
          </button>
          <button onClick={sendBackward} className="flex items-center justify-center space-x-1.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-semibold text-[11px]">
            <ChevronDown className="w-3.5 h-3.5" />
            <span>Backward</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
