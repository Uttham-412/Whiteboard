import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Grid, List, Folder, Star, Clock, 
  User, LogOut, Sun, Moon, Sparkles, Layout, Layers, 
  Settings, Users, Trash2, HelpCircle, Bell, ArrowRight
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCanvasStore } from '../../store/canvasStore';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { FirestoreService } from '../../services/firestoreService';
import { BoardCard } from './BoardCard';
import { CommandPaletteModal } from './CommandPaletteModal';
import { ConstellationLogo } from '../ui/ConstellationLogo';
import { AiStudioModal } from '../ai/AiStudioModal';
import { useToast } from '../ui/Toast';

interface DashboardProps {
  onOpenBoard: (boardId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenBoard }) => {
  const { user, logout } = useAuthStore();
  const { loadBoard } = useCanvasStore();
  const { toast } = useToast();

  const [boards, setBoards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'starred' | 'shared' | 'templates' | 'trash'>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isAiStudioOpen, setIsAiStudioOpen] = useState(false);

  const fetchBoards = async () => {
    setLoading(true);
    try {
      if (db && user) {
        const q = query(collection(db, 'boards'), where('ownerId', '==', user.uid));
        const snap = await getDocs(q);
        const list: any[] = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        setBoards(list);
      }
    } catch (e) {
      console.error("Fetch boards error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, [user]);

  const handleCreateBoard = async (title?: string) => {
    if (!user) return;
    try {
      const boardTitle = title || 'Untitled Architecture';
      const newBoardId = await FirestoreService.createBoard(user.uid, boardTitle);
      await loadBoard(newBoardId);
      toast("Board Created", `Created "${boardTitle}".`, "success");
      onOpenBoard(newBoardId);
    } catch (err: any) {
      toast("Error", "Could not create new board.", "error");
    }
  };

  const handleToggleStar = async (boardId: string, currentStarred: boolean) => {
    try {
      const updated = boards.map(b => b.id === boardId ? { ...b, starred: !currentStarred } : b);
      setBoards(updated);
      await FirestoreService.updateBoardMetadata(boardId, { starred: !currentStarred });
    } catch (err) {
      toast("Error", "Failed to update star state.", "error");
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    try {
      await FirestoreService.deleteBoard(boardId);
      setBoards(boards.filter(b => b.id !== boardId));
      toast("Board Deleted", "Board moved to trash.", "success");
    } catch (err) {
      toast("Error", "Failed to delete board.", "error");
    }
  };

  const handleRenameBoard = async (boardId: string, currentTitle: string) => {
    const newTitle = prompt("Enter new board title:", currentTitle);
    if (newTitle && newTitle.trim()) {
      try {
        await FirestoreService.updateBoardMetadata(boardId, { title: newTitle.trim() });
        setBoards(boards.map(b => b.id === boardId ? { ...b, title: newTitle.trim() } : b));
        toast("Board Renamed", `Renamed to "${newTitle.trim()}".`, "success");
      } catch (err) {
        toast("Error", "Failed to rename board.", "error");
      }
    }
  };

  const filteredBoards = boards.filter(b => {
    const matchesTab = 
      activeTab === 'all' ? true :
      activeTab === 'starred' ? b.starred :
      activeTab === 'recent' ? (Date.now() - (b.updatedAt || 0) < 86400000 * 7) : true;
    const matchesSearch = b.title.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] flex flex-col select-none font-sans">
      {/* Global Command Palette Modal (Ctrl+K) */}
      <CommandPaletteModal
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        boards={boards}
        onOpenBoard={onOpenBoard}
      />

      {/* AI Studio Modal */}
      <AiStudioModal
        isOpen={isAiStudioOpen}
        onClose={() => setIsAiStudioOpen(false)}
      />

      {/* TOP HEADER NAVIGATION */}
      <header className="h-14 px-6 bg-white border-b border-[#E5E7EB] flex items-center justify-between shadow-2xs z-10 sticky top-0">
        <div className="flex items-center space-x-4">
          {/* CC Constellation Logo */}
          <div className="flex items-center space-x-2.5">
            <ConstellationLogo size={32} />
            <span className="text-[16px] font-bold text-[#111827] tracking-tight">CollabCanvas Pro</span>
          </div>

          <div className="h-4 w-px bg-[#E5E7EB]" />
          <span className="text-[12px] font-medium text-[#7C3AED] bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200 font-bold flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-[#7C3AED]" />
            <span>AI Workspace</span>
          </span>
        </div>

        {/* Global Search Bar Trigger (Ctrl+K) */}
        <div 
          onClick={() => setIsCommandOpen(true)}
          className="relative w-96 h-9 px-3 bg-[#F8FAFC] border border-[#E5E7EB] hover:border-[#CBD5E1] rounded-[8px] flex items-center justify-between cursor-pointer transition-colors"
        >
          <div className="flex items-center space-x-2 text-slate-400 text-[13px]">
            <Search className="w-4 h-4" />
            <span>Search diagrams, templates, teams...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white rounded border border-slate-200 shadow-2xs">Ctrl+K</kbd>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsAiStudioOpen(true)}
            className="h-9 px-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[13px] font-semibold rounded-[8px] flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs group"
          >
            <Sparkles className="w-4 h-4 text-purple-200 group-hover:rotate-12 transition-transform" />
            <span>AI Studio</span>
          </button>

          <button 
            onClick={() => handleCreateBoard()}
            className="h-9 px-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-semibold rounded-[8px] flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Board</span>
          </button>

          <div className="h-4 w-px bg-[#E5E7EB]" />

          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <img
              src={user?.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.uid}`}
              alt="Avatar"
              className="w-7 h-7 rounded-full border border-slate-200 bg-white"
            />
            <div className="text-left hidden sm:block">
              <div className="text-[13px] font-semibold text-[#111827] leading-none">{user?.displayName || 'Developer'}</div>
              <div className="text-[11px] text-[#6B7280] leading-none mt-1 truncate max-w-[120px]">{user?.email}</div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex max-w-[1400px] w-full mx-auto p-6 gap-8">
        {/* LEFT SIDEBAR PANEL */}
        <div className="w-56 flex-shrink-0 space-y-6">
          <div className="space-y-1 text-[13px] font-medium text-[#374151]">
            <button
              onClick={() => setActiveTab('all')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-[8px] transition-colors cursor-pointer ${activeTab === 'all' ? 'bg-[#2563EB]/10 text-[#2563EB] font-bold' : 'hover:bg-white'}`}
            >
              <Grid className="w-4 h-4" />
              <span>All Workspaces</span>
            </button>
            <button
              onClick={() => setActiveTab('recent')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-[8px] transition-colors cursor-pointer ${activeTab === 'recent' ? 'bg-[#2563EB]/10 text-[#2563EB] font-bold' : 'hover:bg-white'}`}
            >
              <Clock className="w-4 h-4" />
              <span>Recent Diagrams</span>
            </button>
            <button
              onClick={() => setActiveTab('starred')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-[8px] transition-colors cursor-pointer ${activeTab === 'starred' ? 'bg-[#2563EB]/10 text-[#2563EB] font-bold' : 'hover:bg-white'}`}
            >
              <Star className="w-4 h-4" />
              <span>Starred</span>
            </button>
            <button
              onClick={() => setActiveTab('shared')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-[8px] transition-colors cursor-pointer ${activeTab === 'shared' ? 'bg-[#2563EB]/10 text-[#2563EB] font-bold' : 'hover:bg-white'}`}
            >
              <Users className="w-4 h-4" />
              <span>Shared with me</span>
            </button>
          </div>

          <div className="pt-4 border-t border-[#E5E7EB]">
            <div className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Team Spaces
            </div>
            <div className="space-y-1 text-[13px] font-medium text-[#374151]">
              <div className="px-3 py-1.5 rounded-[8px] hover:bg-white flex items-center justify-between text-slate-600 cursor-pointer">
                <span className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Product Architecture</span>
                </span>
                <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">4</span>
              </div>
              <div className="px-3 py-1.5 rounded-[8px] hover:bg-white flex items-center justify-between text-slate-600 cursor-pointer">
                <span className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>Security & Audits</span>
                </span>
                <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">2</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT MAIN CONTENT AREA */}
        <div className="flex-1 space-y-6">
          {/* Quick Action Starter Templates Row */}
          <div className="space-y-3">
            <h2 className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
              Start a New Architecture Diagram
            </h2>
            <div className="grid grid-cols-4 gap-4">
              <button 
                onClick={() => handleCreateBoard('Blank Canvas')}
                className="p-4 bg-white border border-[#E5E7EB] hover:border-[#2563EB] rounded-[12px] shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between h-28 text-left cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-[#111827] group-hover:text-[#2563EB]">Blank Board</div>
                  <div className="text-[11px] text-[#6B7280]">Infinite canvas</div>
                </div>
              </button>

              <button 
                onClick={() => handleCreateBoard('Cloud Infrastructure Topology')}
                className="p-4 bg-white border border-[#E5E7EB] hover:border-[#2563EB] rounded-[12px] shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between h-28 text-left cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Layout className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-[#111827] group-hover:text-[#2563EB]">Cloud Topology</div>
                  <div className="text-[11px] text-[#6B7280]">AWS & Microservices</div>
                </div>
              </button>

              <button 
                onClick={() => handleCreateBoard('UX Flowchart & User Journey')}
                className="p-4 bg-white border border-[#E5E7EB] hover:border-[#2563EB] rounded-[12px] shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between h-28 text-left cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-[#111827] group-hover:text-[#2563EB]">UX Flowchart</div>
                  <div className="text-[11px] text-[#6B7280]">Decision nodes</div>
                </div>
              </button>

              <button 
                onClick={() => handleCreateBoard('Mind Map & Brainstorm')}
                className="p-4 bg-white border border-[#E5E7EB] hover:border-[#2563EB] rounded-[12px] shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between h-28 text-left cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-[#111827] group-hover:text-[#2563EB]">Mind Map</div>
                  <div className="text-[11px] text-[#6B7280]">Brainstorm tree</div>
                </div>
              </button>
            </div>
          </div>

          {/* Boards List Section Header */}
          <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
            <div className="flex items-center space-x-3">
              <h2 className="text-[15px] font-bold text-[#111827]">
                {activeTab === 'all' && 'All Workspaces'}
                {activeTab === 'recent' && 'Recent Diagrams'}
                {activeTab === 'starred' && 'Starred Workspaces'}
                {activeTab === 'shared' && 'Shared Workspaces'}
              </h2>
              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {filteredBoards.length} boards
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-[6px] border transition-colors ${viewMode === 'grid' ? 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/30' : 'border-[#E5E7EB] text-slate-400 bg-white'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-[6px] border transition-colors ${viewMode === 'list' ? 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/30' : 'border-[#E5E7EB] text-slate-400 bg-white'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Boards Grid / List */}
          {loading ? (
            <div className="grid grid-cols-3 gap-4 pt-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-56 bg-slate-200/60 rounded-[12px] animate-pulse" />
              ))}
            </div>
          ) : filteredBoards.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-[12px] border border-[#E5E7EB]">
              <Folder className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-[14px] font-semibold text-[#111827]">No architecture boards found</p>
              <p className="text-[12px] text-[#6B7280] mt-1">Create your first collaborative board to get started.</p>
              <button
                onClick={() => handleCreateBoard()}
                className="mt-4 px-4 py-2 bg-[#2563EB] text-white text-[13px] font-semibold rounded-[8px] shadow-2xs hover:bg-[#1D4ED8] transition-colors"
              >
                Create First Board
              </button>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-3 gap-4' : 'space-y-2'}>
              {filteredBoards.map((board) => (
                <BoardCard
                  key={board.id}
                  board={board}
                  viewMode={viewMode}
                  onOpen={() => onOpenBoard(board.id)}
                  onToggleStar={(e) => {
                    e.stopPropagation();
                    handleToggleStar(board.id, !!board.starred);
                  }}
                  onDelete={(e) => {
                    e.stopPropagation();
                    handleDeleteBoard(board.id);
                  }}
                  onRename={(e) => {
                    e.stopPropagation();
                    handleRenameBoard(board.id, board.title);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
