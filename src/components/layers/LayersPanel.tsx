import React from 'react';
import { Eye, EyeOff, Lock, Unlock, Layers, Trash2, ChevronUp, ChevronDown, Tag } from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import { BoardElement } from '../../types';

interface LayersPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({ isOpen, onClose }) => {
  const { elements, selectedElementIds, selectElements, updateElement, bringForward, sendBackward, deleteSelectedElements } = useCanvasStore();

  if (!isOpen) return null;

  // Display elements top-to-bottom (z-index order inverted for UI list view)
  const layerList = [...elements].reverse();

  return (
    <div className="fixed right-6 top-20 bottom-24 w-80 glass-panel rounded-2xl p-4 shadow-2xl flex flex-col z-40 border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-right-4 duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Layers & Objects</h3>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-semibold px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">✕ Close</button>
      </div>

      {/* Layer action bar */}
      <div className="flex items-center justify-between py-2 px-1 border-b border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center space-x-1">
          <button onClick={bringForward} title="Move Up" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
            <ChevronUp className="w-4 h-4" />
          </button>
          <button onClick={sendBackward} title="Move Down" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        <button onClick={deleteSelectedElements} title="Delete Selected" className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* List items */}
      <div className="flex-1 overflow-y-auto py-2 space-y-1">
        {layerList.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">No elements on canvas</div>
        ) : (
          layerList.map((el) => {
            const isSelected = selectedElementIds.includes(el.id);
            const label = el.name || el.text?.slice(0, 20) || `${el.type.toUpperCase()} #${el.id.slice(0, 4)}`;

            return (
              <div
                key={el.id}
                onClick={(e) => {
                  if (e.shiftKey) {
                    selectElements([...selectedElementIds, el.id]);
                  } else {
                    selectElements([el.id]);
                  }
                }}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 text-blue-900 dark:text-blue-100 font-medium shadow-sm'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2 overflow-hidden mr-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: el.colorTag || el.color || '#2563EB' }} />
                  <span className="truncate">{label}</span>
                </div>

                <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                  {/* Visibility Toggle */}
                  <button
                    onClick={() => updateElement(el.id, { visible: el.visible === false ? true : false })}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400"
                  >
                    {el.visible === false ? <EyeOff className="w-3.5 h-3.5 text-red-500" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>

                  {/* Lock Toggle */}
                  <button
                    onClick={() => updateElement(el.id, { locked: !el.locked })}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400"
                  >
                    {el.locked ? <Lock className="w-3.5 h-3.5 text-amber-500" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
