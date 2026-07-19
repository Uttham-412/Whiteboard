import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../ui/Toast';
import { IS_FIREBASE_CONFIGURED, db } from '../../services/firebase';
import { mockStorage, MockBoard, MockFolder } from '../../services/mockFirebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  doc, 
  deleteDoc, 
  updateDoc, 
  getDoc,
  setDoc
} from 'firebase/firestore';
import { 
  Plus, Search, Star, Folder, Trash2, FolderPlus, 
  User, Settings2, LogOut, FileText, Layout,
  MoreVertical, Copy, Edit2, RotateCcw, Share2, Sparkles, Check, CheckSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Dashboard: React.FC<{ onOpenBoard: (boardId: string) => void }> = ({ onOpenBoard }) => {
  const { user, logout, updateProfile } = useAuthStore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'recent' | 'starred' | 'trash' | string>('recent'); // string is folderId
  const [boards, setBoards] = useState<MockBoard[]>([]);
  const [folders, setFolders] = useState<MockFolder[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Settings & Modal States
  const [showSettings, setShowSettings] = useState(false);
  const [setDisplayName, setSetDisplayName] = useState(user?.displayName || '');
  const [setJobTitle, setSetJobTitle] = useState(user?.jobTitle || '');
  const [setBio, setSetBio] = useState(user?.bio || '');
  const [setAvatar, setSetAvatar] = useState(user?.photoURL || '');

  // Folder modal state
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Context menu / edit states
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showFolderDropdownId, setShowFolderDropdownId] = useState<string | null>(null);

  const fetchBoardsAndFolders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (IS_FIREBASE_CONFIGURED) {
        // Query boards from Firestore
        const qBoards = query(collection(db, 'whiteboards'), where('ownerId', '==', user.uid));
        const boardSnap = await getDocs(qBoards);
        const fetchedBoards: MockBoard[] = [];
        boardSnap.forEach((doc) => {
          fetchedBoards.push({ id: doc.id, ...doc.data() } as any);
        });
        setBoards(fetchedBoards);

        // Query folders
        const qFolders = query(collection(db, 'folders'), where('ownerId', '==', user.uid));
        const folderSnap = await getDocs(qFolders);
        const fetchedFolders: MockFolder[] = [];
        folderSnap.forEach((doc) => {
          fetchedFolders.push({ id: doc.id, ...doc.data() } as any);
        });
        setFolders(fetchedFolders);
      } else {
        // Mock Storage Fetch
        const b = await mockStorage.getBoards(user.uid);
        const tr = await mockStorage.getTrashBoards(user.uid);
        setBoards([...b, ...tr]);

        const f = await mockStorage.getFolders(user.uid);
        setFolders(f);
      }
    } catch (err) {
      console.error(err);
      toast("Error Loading Data", "Could not fetch boards and folders.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoardsAndFolders();
  }, [user]);

  // Actions
  const handleCreateBoard = async (templateType = 'empty') => {
    if (!user) return;
    try {
      let newBoard: any;
      if (IS_FIREBASE_CONFIGURED) {
        const boardId = Math.random().toString(36).substring(2, 9).toUpperCase();
        
        let elements: any[] = [];
        if (templateType === 'flowchart') {
          elements = [
            { id: 'f-1', type: 'rect', x: 200, y: 150, width: 140, height: 60, color: '#6366f1', fillColor: 'rgba(99, 102, 241, 0.05)', strokeWidth: 3, rounded: true, createdAt: Date.now(), updatedAt: Date.now() },
            { id: 'f-1-text', type: 'text', x: 210, y: 170, width: 120, height: 20, text: 'Start Process', fontSize: 14, fontFamily: 'Outfit', align: 'center', color: '#6366f1', createdAt: Date.now(), updatedAt: Date.now() },
            { id: 'f-arrow-1', type: 'arrow', x: 270, y: 210, width: 0, height: 0, points: [{ x: 270, y: 210 }, { x: 270, y: 290 }], color: '#94a3b8', strokeWidth: 3, createdAt: Date.now(), updatedAt: Date.now() },
            { id: 'f-2', type: 'diamond', x: 200, y: 290, width: 140, height: 100, color: '#f43f5e', fillColor: 'rgba(244, 63, 94, 0.05)', strokeWidth: 3, createdAt: Date.now(), updatedAt: Date.now() },
            { id: 'f-2-text', type: 'text', x: 220, y: 330, width: 100, height: 20, text: 'Is Approved?', fontSize: 13, fontFamily: 'Outfit', align: 'center', color: '#f43f5e', createdAt: Date.now(), updatedAt: Date.now() },
          ];
        } else if (templateType === 'retro') {
          elements = [
            { id: 'r-t', type: 'text', x: 100, y: 80, width: 600, height: 40, text: 'Sprint Retrospective', fontSize: 24, fontFamily: 'Outfit', fontStyle: { bold: true }, color: '#f8fafc', createdAt: Date.now(), updatedAt: Date.now() },
            { id: 'r-s1', type: 'sticky', x: 100, y: 160, width: 160, height: 160, rotation: -2, text: 'What Went Well:\n- Shipped design tokens\n- React 19 testing passes', fillColor: '#a7f3d0', color: '#064e3b', createdAt: Date.now(), updatedAt: Date.now() },
            { id: 'r-s2', type: 'sticky', x: 300, y: 160, width: 160, height: 160, rotation: 1, text: 'To Improve:\n- WebRTC signaling connection dropouts', fillColor: '#fecaca', color: '#7f1d1d', createdAt: Date.now(), updatedAt: Date.now() }
          ];
        } else if (templateType === 'mindmap') {
          elements = [
            { id: 'm-c', type: 'ellipse', x: 300, y: 200, width: 160, height: 80, color: '#3b82f6', fillColor: 'rgba(59, 130, 246, 0.08)', strokeWidth: 3, createdAt: Date.now(), updatedAt: Date.now() },
            { id: 'm-c-text', type: 'text', x: 310, y: 230, width: 140, height: 20, text: 'Product Launch', fontSize: 15, fontFamily: 'Outfit', align: 'center', color: '#3b82f6', createdAt: Date.now(), updatedAt: Date.now() }
          ];
        }

        const newDoc = {
          title: `My ${templateType.charAt(0).toUpperCase() + templateType.slice(1)} Board`,
          ownerId: user.uid,
          elements,
          scale: 1,
          panX: 0,
          panY: 0,
          starred: false,
          trashed: false,
          folderId: activeTab.startsWith('folder-') ? activeTab.replace('folder-', '') : null,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        await setDoc(doc(db, 'whiteboards', boardId), newDoc);
        newBoard = { id: boardId, ...newDoc };
      } else {
        newBoard = await mockStorage.createBoard(
          user.uid, 
          `My ${templateType.charAt(0).toUpperCase() + templateType.slice(1)} Board`, 
          templateType
        );
        if (activeTab.startsWith('folder-')) {
          await mockStorage.moveBoardToFolder(newBoard.id, activeTab.replace('folder-', ''));
        }
      }
      toast("Board Created", `Board based on template '${templateType}' created.`, "success");
      onOpenBoard(newBoard.id);
    } catch (e) {
      toast("Creation Failed", "Could not create whiteboard.", "error");
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !user) return;
    try {
      if (IS_FIREBASE_CONFIGURED) {
        await addDoc(collection(db, 'folders'), {
          name: newFolderName,
          ownerId: user.uid,
          createdAt: Date.now()
        });
      } else {
        await mockStorage.createFolder(user.uid, newFolderName);
      }
      toast("Folder Created", `Folder '${newFolderName}' created.`, "success");
      setNewFolderName('');
      setShowNewFolderModal(false);
      fetchBoardsAndFolders();
    } catch (e) {
      toast("Error", "Could not create folder.", "error");
    }
  };

  const handleRenameBoard = async (boardId: string) => {
    if (!renameTitle.trim()) return;
    try {
      if (IS_FIREBASE_CONFIGURED) {
        await updateDoc(doc(db, 'whiteboards', boardId), { title: renameTitle, updatedAt: Date.now() });
      } else {
        await mockStorage.renameBoard(boardId, renameTitle);
      }
      toast("Board Renamed", "Title updated.", "success");
      setEditingBoardId(null);
      fetchBoardsAndFolders();
    } catch (e) {
      toast("Error", "Could not rename board.", "error");
    }
  };

  const handleDuplicate = async (boardId: string) => {
    try {
      if (IS_FIREBASE_CONFIGURED) {
        const boardDoc = await getDoc(doc(db, 'whiteboards', boardId));
        if (boardDoc.exists()) {
          const data = boardDoc.data();
          const newId = Math.random().toString(36).substring(2, 9).toUpperCase();
          const dup = {
            ...data,
            title: `${data.title} (Copy)`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            starred: false
          };
          await setDoc(doc(db, 'whiteboards', newId), dup);
        }
      } else {
        await mockStorage.duplicateBoard(boardId);
      }
      toast("Board Duplicated", "Duplicate board generated.", "success");
      fetchBoardsAndFolders();
    } catch (e) {
      toast("Error", "Could not duplicate board.", "error");
    }
  };

  const handleStar = async (boardId: string, starred: boolean) => {
    try {
      if (IS_FIREBASE_CONFIGURED) {
        await updateDoc(doc(db, 'whiteboards', boardId), { starred });
      } else {
        await mockStorage.starBoard(boardId, starred);
      }
      fetchBoardsAndFolders();
    } catch (e) {
      toast("Error", "Could not update status.", "error");
    }
  };

  const handleTrash = async (boardId: string, trashed: boolean) => {
    try {
      if (IS_FIREBASE_CONFIGURED) {
        await updateDoc(doc(db, 'whiteboards', boardId), { trashed });
      } else {
        await mockStorage.trashBoard(boardId, trashed);
      }
      toast(
        trashed ? "Moved to Trash" : "Board Restored", 
        trashed ? "Board is now in the Trash." : "Board restored to dashboard.", 
        "success"
      );
      fetchBoardsAndFolders();
    } catch (e) {
      toast("Error", "Could not complete operation.", "error");
    }
  };

  const handlePermanentDelete = async (boardId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this board? This action cannot be undone.")) return;
    try {
      if (IS_FIREBASE_CONFIGURED) {
        await deleteDoc(doc(db, 'whiteboards', boardId));
      } else {
        await mockStorage.deleteBoard(boardId);
      }
      toast("Board Deleted", "Board permanently erased.", "success");
      fetchBoardsAndFolders();
    } catch (e) {
      toast("Error", "Could not delete board.", "error");
    }
  };

  const handleMoveToFolder = async (boardId: string, folderId: string | null) => {
    try {
      if (IS_FIREBASE_CONFIGURED) {
        await updateDoc(doc(db, 'whiteboards', boardId), { folderId });
      } else {
        await mockStorage.moveBoardToFolder(boardId, folderId);
      }
      toast("Board Moved", "Board moved to target folder.", "success");
      setShowFolderDropdownId(null);
      fetchBoardsAndFolders();
    } catch (e) {
      toast("Error", "Could not move board.", "error");
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      await updateProfile(setDisplayName, setJobTitle, setBio, setAvatar);
      toast("Profile Updated", "Changes saved successfully.", "success");
      setShowSettings(false);
    } catch (e) {
      toast("Update Failed", "Could not save profile updates.", "error");
    }
  };

  // Filter Boards logic
  const filteredBoards = boards.filter((b) => {
    const matchesSearch = b.title.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === 'recent') {
      return !b.trashed;
    }
    if (activeTab === 'starred') {
      return b.starred && !b.trashed;
    }
    if (activeTab === 'trash') {
      return b.trashed;
    }
    // Folder filter
    return b.folderId === activeTab.replace('folder-', '') && !b.trashed;
  });

  return (
    <div className="flex h-screen w-screen bg-[#070b13] text-white overflow-hidden">
      
      {/* Sidebar Navigation */}
      <div className="w-64 glass-panel border-r border-white/5 flex flex-col h-full shrink-0">
        {/* User Card */}
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <img 
            src={user?.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.uid}`} 
            alt="avatar" 
            className="w-10 h-10 rounded-xl bg-slate-800 border border-indigo-500/20"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold truncate">{user?.displayName}</span>
            <span className="text-[10px] text-slate-400 truncate uppercase tracking-wider">{user?.jobTitle || 'Product Architect'}</span>
          </div>
        </div>

        {/* Menu Actions */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1.5">
          <button 
            onClick={() => setActiveTab('recent')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${activeTab === 'recent' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <Layout className="h-4 w-4" /> My Boards
          </button>
          
          <button 
            onClick={() => setActiveTab('starred')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${activeTab === 'starred' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <Star className="h-4 w-4" /> Starred Boards
          </button>

          <button 
            onClick={() => setActiveTab('trash')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${activeTab === 'trash' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <Trash2 className="h-4 w-4" /> Trash Bin
          </button>

          {/* Folders List */}
          <div className="mt-6 flex items-center justify-between px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>Folders</span>
            <button 
              onClick={() => setShowNewFolderModal(true)}
              className="p-1 rounded hover:bg-white/5 text-indigo-400 hover:text-white cursor-pointer transition-colors"
            >
              <FolderPlus className="h-4. w-4" />
            </button>
          </div>

          <div className="flex flex-col gap-0.5 mt-2">
            {folders.map(f => (
              <button
                key={f.id}
                onClick={() => setActiveTab(`folder-${f.id}`)}
                className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm transition-colors text-left cursor-pointer truncate ${activeTab === `folder-${f.id}` ? 'bg-white/10 text-white font-semibold' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <Folder className="h-4 w-4 shrink-0" /> {f.name}
              </button>
            ))}
            {folders.length === 0 && (
              <span className="text-[10px] text-slate-500 italic px-4 mt-1">No folders created yet.</span>
            )}
          </div>
        </div>

        {/* Footer Settings & Logout */}
        <div className="p-4 border-t border-white/5 flex flex-col gap-2">
          <button 
            onClick={() => {
              setSetDisplayName(user?.displayName || '');
              setSetJobTitle(user?.jobTitle || '');
              setSetBio(user?.bio || '');
              setSetAvatar(user?.photoURL || '');
              setShowSettings(true);
            }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <Settings2 className="h-4 w-4" /> Profile Settings
          </button>
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/5 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> Logout Session
          </button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-slate-950/20 shrink-0">
          <div className="flex items-center gap-3 w-72 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search workspaces..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl glass-input text-white"
            />
          </div>
          <button 
            onClick={() => handleCreateBoard('empty')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-lg shadow-indigo-600/10"
          >
            <Plus className="h-4 w-4" /> New Technical Board
          </button>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-8">
          
          {/* Templates Carousel Section */}
          {activeTab === 'recent' && (
            <div className="mb-10">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" /> Kickstart with Templates
              </h2>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { type: 'empty', title: 'Empty Canvas', desc: 'Standard blank coordinate workspace', icon: FileText, color: 'text-indigo-400 bg-indigo-500/5 border-indigo-500/20' },
                  { type: 'flowchart', title: 'Flowchart Schema', desc: 'Pre-designed system nodes and arrows', icon: Layout, color: 'text-rose-400 bg-rose-500/5 border-rose-500/20' },
                  { type: 'mindmap', title: 'Mind Map Diagram', desc: 'Central launch hub with branches', icon: Share2, color: 'text-blue-400 bg-blue-500/5 border-blue-500/20' },
                  { type: 'retro', title: 'Agile Retrospective', desc: 'Organized sprint column sticky board', icon: CheckSquare, color: 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20' }
                ].map((tmpl) => {
                  const Icon = tmpl.icon;
                  return (
                    <button
                      key={tmpl.type}
                      onClick={() => handleCreateBoard(tmpl.type)}
                      className={`flex flex-col items-start p-5 rounded-2xl border text-left cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl ${tmpl.color} bg-slate-900/40`}
                    >
                      <Icon className="h-6 w-6 mb-3" />
                      <span className="font-bold text-sm text-white">{tmpl.title}</span>
                      <span className="text-xs text-slate-400 mt-1 leading-normal">{tmpl.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Boards List Title */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-extrabold text-white">
              {activeTab === 'recent' && 'Recent Workspaces'}
              {activeTab === 'starred' && 'Starred Boards'}
              {activeTab === 'trash' && 'Trash History'}
              {activeTab.startsWith('folder-') && folders.find(f => f.id === activeTab.replace('folder-', ''))?.name}
            </h2>
            <span className="text-xs text-slate-500">{filteredBoards.length} total boards</span>
          </div>

          {/* Board Grid */}
          {loading ? (
            <div className="grid grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-44 rounded-2xl bg-white/5 border border-white/5 animate-pulse flex flex-col p-4 justify-between">
                  <div className="w-1/2 h-4 bg-slate-800 rounded" />
                  <div className="w-3/4 h-3 bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-6">
                {filteredBoards.map((b) => (
                  <motion.div
                    key={b.id}
                    layout
                    className="relative group h-44 rounded-2xl border border-white/5 bg-slate-900/20 hover:bg-slate-900/40 hover:border-white/10 p-5 flex flex-col justify-between transition-all"
                  >
                    {/* Header: Star & Menu */}
                    <div className="flex items-start justify-between">
                      {editingBoardId === b.id ? (
                        <div className="flex items-center gap-1 w-full mr-2">
                          <input
                            type="text"
                            value={renameTitle}
                            onChange={(e) => setRenameTitle(e.target.value)}
                            className="bg-slate-800 text-xs px-2 py-1 rounded w-full border border-indigo-500 outline-none text-white font-semibold"
                            autoFocus
                          />
                          <button 
                            onClick={() => handleRenameBoard(b.id)}
                            className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 cursor-pointer"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <h3 
                          onClick={() => onOpenBoard(b.id)}
                          className="font-bold text-sm truncate pr-2 hover:text-indigo-400 cursor-pointer leading-tight max-w-[80%]"
                        >
                          {b.title}
                        </h3>
                      )}
                      
                      <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
                        {!b.trashed && (
                          <button
                            onClick={() => handleStar(b.id, !b.starred)}
                            className="p-1 rounded hover:bg-white/5 cursor-pointer text-slate-400 hover:text-yellow-400 transition-colors"
                          >
                            <Star className={`h-4. w-4 ${b.starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                          </button>
                        )}
                        
                        {/* Context Menu Button */}
                        <div className="relative">
                          <button
                            onClick={() => {
                              setActiveMenuId(activeMenuId === b.id ? null : b.id);
                              setShowFolderDropdownId(null);
                            }}
                            className="p-1 rounded hover:bg-white/5 cursor-pointer"
                          >
                            <MoreVertical className="h-4 w-4 text-slate-400 hover:text-white" />
                          </button>

                          {/* Context Menu Options */}
                          <AnimatePresence>
                            {activeMenuId === b.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute right-0 mt-1 w-44 rounded-xl border border-white/10 bg-slate-900 shadow-2xl z-20 overflow-hidden"
                              >
                                {b.trashed ? (
                                  <>
                                    <button
                                      onClick={() => {
                                        handleTrash(b.id, false);
                                        setActiveMenuId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-xs flex items-center gap-2 hover:bg-white/5 text-slate-300"
                                    >
                                      <RotateCcw className="h-3 w-3" /> Restore Board
                                    </button>
                                    <button
                                      onClick={() => {
                                        handlePermanentDelete(b.id);
                                        setActiveMenuId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-xs flex items-center gap-2 hover:bg-rose-500/10 text-rose-400"
                                    >
                                      <Trash2 className="h-3 w-3" /> Permanent Delete
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => {
                                        setEditingBoardId(b.id);
                                        setRenameTitle(b.title);
                                        setActiveMenuId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-xs flex items-center gap-2 hover:bg-white/5 text-slate-300"
                                    >
                                      <Edit2 className="h-3 w-3" /> Rename Board
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleDuplicate(b.id);
                                        setActiveMenuId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-xs flex items-center gap-2 hover:bg-white/5 text-slate-300"
                                    >
                                      <Copy className="h-3 w-3" /> Duplicate Board
                                    </button>
                                    <button
                                      onClick={() => {
                                        setShowFolderDropdownId(b.id);
                                        setActiveMenuId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-xs flex items-center gap-2 hover:bg-white/5 text-slate-300"
                                    >
                                      <Folder className="h-3 w-3" /> Move to Folder
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleTrash(b.id, true);
                                        setActiveMenuId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-xs flex items-center gap-2 hover:bg-rose-500/10 text-rose-400"
                                    >
                                      <Trash2 className="h-3 w-3" /> Move to Trash
                                    </button>
                                  </>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>

                    {/* Move to Folder dropdown overlay */}
                    {showFolderDropdownId === b.id && (
                      <div className="absolute inset-0 bg-slate-950/90 rounded-2xl p-4 z-30 flex flex-col justify-between">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Select Target Folder</span>
                        <div className="flex flex-col gap-1 overflow-y-auto max-h-24">
                          <button
                            onClick={() => handleMoveToFolder(b.id, null)}
                            className="text-left text-xs text-indigo-400 hover:text-white py-1 truncate"
                          >
                            - Root (No Folder) -
                          </button>
                          {folders.map(f => (
                            <button
                              key={f.id}
                              onClick={() => handleMoveToFolder(b.id, f.id)}
                              className="text-left text-xs hover:text-white py-1 truncate"
                            >
                              📁 {f.name}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setShowFolderDropdownId(null)}
                          className="text-[10px] text-slate-500 hover:text-white text-center mt-2"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {/* Card Footer */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-500">
                        Last edited by {b.lastEditedBy || 'You'}
                      </span>
                      <div className="flex items-center justify-between text-xs mt-1 text-slate-400">
                        <span className="text-[10px]">
                          {new Date(b.updatedAt).toLocaleDateString()}
                        </span>
                        
                        {b.templateType && b.templateType !== 'empty' && (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-semibold text-slate-400 border border-white/5 capitalize">
                            {b.templateType}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {filteredBoards.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-500 text-3xl mb-4">
                    📁
                  </div>
                  <h3 className="font-bold text-slate-300">No boards found</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Create a new whiteboard using the templates above or adjust your search filter.
                  </p>
                </div>
              )}
            </>
          )}

        </main>
      </div>

      {/* Profile Settings Drawer Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-96 h-full bg-[#0a0f1d] border-l border-white/10 p-8 flex flex-col justify-between shadow-2xl relative"
            >
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <User className="h-5 w-5 text-indigo-400" /> Account Profile
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Configure your personal workspace identity.</p>
                </div>

                <div className="flex flex-col items-center gap-3 mt-4">
                  <img 
                    src={setAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.uid}`} 
                    alt="profile" 
                    className="w-20 h-20 rounded-2xl bg-slate-900 border-2 border-indigo-500 shadow-xl"
                  />
                  <div className="flex flex-col gap-1 w-full">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Avatar Custom Seed</label>
                    <input
                      type="text"
                      placeholder="e.g. creative-seed"
                      onChange={(e) => setSetAvatar(`https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(e.target.value)}`)}
                      className="w-full px-3 py-2 text-xs rounded-xl glass-input text-white"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4 mt-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Full Name</label>
                    <input
                      type="text"
                      value={setDisplayName}
                      onChange={(e) => setSetDisplayName(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl glass-input text-white"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Job Title</label>
                    <input
                      type="text"
                      value={setJobTitle}
                      onChange={(e) => setSetJobTitle(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl glass-input text-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Bio / Description</label>
                    <textarea
                      rows={3}
                      value={setBio}
                      onChange={(e) => setSetBio(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl glass-input text-white resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 py-3 border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.form 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onSubmit={handleCreateFolder}
            className="w-80 p-6 rounded-2xl glass-panel border border-white/10 shadow-2xl flex flex-col gap-4"
          >
            <h3 className="font-bold text-sm flex items-center gap-2">
              <FolderPlus className="h-4 w-4 text-indigo-400" /> Create New Folder
            </h3>
            <input
              type="text"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl glass-input text-white"
              autoFocus
              required
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowNewFolderModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Create
              </button>
            </div>
          </motion.form>
        </div>
      )}

    </div>
  );
};
