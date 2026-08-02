import React, { useState } from 'react';
import { Star, MoreVertical, Trash2, Edit3, Clock, Sparkles, Folder, ExternalLink, ShieldCheck } from 'lucide-react';

interface BoardCardProps {
  board: {
    id: string;
    title: string;
    updatedAt?: number;
    starred?: boolean;
    elements?: any[];
    ownerId?: string;
  };
  viewMode: 'grid' | 'list';
  onOpen: () => void;
  onToggleStar: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onRename: (e: React.MouseEvent) => void;
}

export const BoardCard: React.FC<BoardCardProps> = ({
  board,
  viewMode,
  onOpen,
  onToggleStar,
  onDelete,
  onRename
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const formattedDate = new Date(board.updatedAt || Date.now()).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const elementsCount = board.elements?.length || 0;
  const boardType = elementsCount > 5 ? 'Architecture' : elementsCount > 2 ? 'Flowchart' : 'Canvas';

  if (viewMode === 'list') {
    return (
      <div 
        onClick={onOpen}
        className="group relative flex items-center justify-between px-5 py-3.5 bg-white hover:bg-[#F8FAFC] border border-[#E5E7EB] hover:border-[#CBD5E1] rounded-[10px] shadow-sm transition-all cursor-pointer select-none"
      >
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-[8px] bg-blue-50 text-[#2563EB] border border-blue-100 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-[14px] font-semibold text-[#111827] group-hover:text-[#2563EB] transition-colors">{board.title}</h3>
              <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">{boardType}</span>
              <span className="text-[10px] font-bold text-[#7C3AED] bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200 flex items-center space-x-1">
                <Sparkles className="w-2.5 h-2.5" />
                <span>AI v2.4</span>
              </span>
            </div>
            <p className="text-[12px] text-[#6B7280] flex items-center space-x-2 mt-0.5">
              <span>Updated {formattedDate}</span>
              <span>•</span>
              <span>{elementsCount} elements</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={onToggleStar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 transition-colors"
          >
            <Star className={`w-4 h-4 ${board.starred ? 'text-amber-500 fill-amber-500' : ''}`} />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 w-40 bg-white border border-[#E5E7EB] rounded-[8px] shadow-lg py-1 z-20">
                <button onClick={onRename} className="w-full px-3 py-2 text-left text-[13px] text-[#374151] hover:bg-slate-50 flex items-center space-x-2">
                  <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Rename</span>
                </button>
                <button onClick={onDelete} className="w-full px-3 py-2 text-left text-[13px] text-red-600 hover:bg-red-50 flex items-center space-x-2">
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  <span>Delete Board</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={onOpen}
      className="group relative flex flex-col justify-between bg-white border border-[#E5E7EB] hover:border-[#2563EB]/40 rounded-[12px] shadow-sm hover:shadow-md transition-all cursor-pointer select-none overflow-hidden h-[240px]"
    >
      {/* Miniature Canvas Diagram Preview Header */}
      <div className="h-[140px] bg-[#F8FAFC] border-b border-[#E5E7EB] relative overflow-hidden flex items-center justify-center p-4">
        {/* Subtle Canvas Dot Grid */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `radial-gradient(#CBD5E1 1px, transparent 1px)`,
            backgroundSize: `16px 16px`
          }}
        />

        {/* Live Vector Preview Elements */}
        {board.elements && board.elements.length > 0 ? (
          <div className="relative w-full h-full flex items-center justify-center scale-90">
            {/* SVG Render Preview of Elements */}
            <svg className="w-full h-full overflow-visible">
              {board.elements.slice(0, 5).map((el, i) => {
                if (el.type === 'rect' || el.type === 'cloud-node') {
                  return (
                    <rect 
                      key={el.id || i}
                      x={20 + (i * 25)}
                      y={20 + (i * 15)}
                      width="70"
                      height="35"
                      rx="6"
                      fill={el.fillColor || '#FFFFFF'}
                      stroke={el.color || '#2563EB'}
                      strokeWidth="1.5"
                    />
                  );
                } else if (el.type === 'sticky') {
                  return (
                    <rect 
                      key={el.id || i}
                      x={100 + (i * 15)}
                      y={25 + (i * 10)}
                      width="45"
                      height="45"
                      rx="4"
                      fill="#FEF9C3"
                      stroke="#FDE047"
                      strokeWidth="1"
                    />
                  );
                }
                return null;
              })}
            </svg>
          </div>
        ) : (
          /* Blank Blueprint Placeholder SVG */
          <div className="flex flex-col items-center justify-center space-y-1.5 text-slate-400">
            <svg className="w-10 h-10 text-slate-300 stroke-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span className="text-[11px] font-medium text-slate-400">Empty Workspace</span>
          </div>
        )}

        {/* Top Badges & Actions Overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10" onClick={(e) => e.stopPropagation()}>
          <span className="text-[10px] font-semibold text-slate-600 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full border border-slate-200 shadow-2xs">
            {boardType}
          </span>
          <button
            onClick={onToggleStar}
            className="p-1 rounded-full bg-white/90 hover:bg-white text-slate-400 hover:text-amber-500 border border-slate-200 shadow-2xs transition-colors"
          >
            <Star className={`w-3.5 h-3.5 ${board.starred ? 'text-amber-500 fill-amber-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Card Info Footer */}
      <div className="p-4 bg-white flex flex-col justify-between flex-1">
        <div>
          <h3 className="text-[14px] font-semibold text-[#111827] group-hover:text-[#2563EB] transition-colors line-clamp-1">
            {board.title}
          </h3>
          <p className="text-[12px] text-[#6B7280] mt-1 flex items-center space-x-1.5">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Updated {formattedDate}</span>
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
          {/* Avatar Stack */}
          <div className="flex -space-x-1.5">
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center border border-white">U</div>
            <div className="w-5 h-5 rounded-full bg-purple-600 text-white text-[9px] font-bold flex items-center justify-center border border-white">A</div>
          </div>

          {/* Context Options */}
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 bottom-6 w-36 bg-white border border-[#E5E7EB] rounded-[8px] shadow-lg py-1 z-20">
                <button onClick={onRename} className="w-full px-3 py-1.5 text-left text-[12px] text-[#374151] hover:bg-slate-50 flex items-center space-x-2">
                  <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Rename</span>
                </button>
                <button onClick={onDelete} className="w-full px-3 py-1.5 text-left text-[12px] text-red-600 hover:bg-red-50 flex items-center space-x-2">
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
