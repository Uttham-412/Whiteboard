import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Folder, ArrowRight, X } from 'lucide-react';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  boards: any[];
  onOpenBoard: (boardId: string) => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  boards,
  onOpenBoard
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredBoards = boards.filter(b => 
    b.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-start justify-center pt-24 select-none">
      <div className="w-full max-w-xl bg-white border border-[#E5E7EB] rounded-[12px] shadow-2xl overflow-hidden flex flex-col mx-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Search Header */}
        <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center space-x-3">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Type a command or search boards..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-[14px] text-[#111827] bg-transparent outline-none placeholder:text-slate-400"
            autoFocus
          />
          <kbd className="px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 rounded border border-slate-200">ESC</kbd>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filteredBoards.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 font-medium">
              No matching boards found for "{query}"
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Workspaces ({filteredBoards.length})
              </div>
              {filteredBoards.map(b => (
                <button
                  key={b.id}
                  onClick={() => {
                    onOpenBoard(b.id);
                    onClose();
                  }}
                  className="w-full px-3 py-2.5 rounded-[8px] hover:bg-[#F8FAFC] flex items-center justify-between group text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-7 h-7 rounded-md bg-blue-50 text-[#2563EB] flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-[#111827] group-hover:text-[#2563EB]">{b.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono">Updated {new Date(b.updatedAt || Date.now()).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#2563EB] transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
