import { create } from 'zustand';
import { BoardElement, ToolType, Point, GridType, BorderStyle, ShadowStyle, TextStyles, CanvasComment, ChatMessage, BoardVersion } from '../types';
import { IS_FIREBASE_CONFIGURED, db } from '../services/firebase';
import { mockStorage } from '../services/mockFirebase';
import { doc, getDoc, updateDoc, setDoc, collection, addDoc, onSnapshot, query, where, getDocs } from 'firebase/firestore';

interface CanvasState {
  elements: BoardElement[];
  selectedElementIds: string[];
  copiedElements: BoardElement[];
  
  // Camera Viewport details
  scale: number;
  panX: number;
  panY: number;

  // Active styles / tools
  tool: ToolType;
  brushColor: string;
  fillColor: string;
  strokeWidth: number;
  strokeStyle: BorderStyle;
  opacity: number;
  shadowStyle: ShadowStyle;
  borderRadius: boolean;
  
  // Active text configurations
  fontFamily: string;
  fontSize: number;
  align: 'left' | 'center' | 'right';
  textStyles: TextStyles;

  // Grid system settings
  gridType: GridType;
  snapToGrid: boolean;
  smartGuides: boolean;
  backgroundColor: string;
  backgroundImage: string | null;

  // Board details
  boardId: string | null;
  boardTitle: string;
  boardOwnerId: string | null;
  starred: boolean;
  folderId: string | null;
  saving: boolean;
  
  // Versions
  versions: BoardVersion[];

  // Undo/Redo stacks
  undoStack: BoardElement[][];
  redoStack: BoardElement[][];

  // Collaboration details
  connectionState: string;
  cursors: Record<string, { name: string; photo?: string; x: number; y: number; color: string }>;
  comments: CanvasComment[];
  chatMessages: ChatMessage[];
  presentationMode: boolean;
  fullscreen: boolean;

  // Actions
  setTool: (tool: ToolType) => void;
  setBrushColor: (color: string) => void;
  setFillColor: (color: string) => void;
  setStrokeWidth: (w: number) => void;
  setStrokeStyle: (style: BorderStyle) => void;
  setOpacity: (o: number) => void;
  setShadowStyle: (style: ShadowStyle) => void;
  setBorderRadius: (rounded: boolean) => void;
  setFontFamily: (font: string) => void;
  setFontSize: (size: number) => void;
  setTextStyle: (style: Partial<TextStyles>) => void;
  setAlign: (align: 'left' | 'center' | 'right') => void;
  setGridType: (type: GridType) => void;
  setSnapToGrid: (snap: boolean) => void;
  setSmartGuides: (guides: boolean) => void;
  setBackgroundColor: (color: string) => void;
  setBackgroundImage: (src: string | null) => void;
  
  setElements: (elements: BoardElement[], recordHistory?: boolean) => void;
  addElement: (element: BoardElement) => void;
  updateElement: (id: string, updates: Partial<BoardElement>) => void;
  updateSelectedElements: (updates: Partial<BoardElement>) => void;
  deleteSelectedElements: () => void;
  duplicateSelectedElements: () => void;
  clearCanvas: () => void;
  selectElements: (ids: string[]) => void;
  clearSelection: () => void;

  // Layer Ordering
  bringForward: () => void;
  sendBackward: () => void;
  bringToFront: () => void;
  sendToBack: () => void;
  
  // Grouping
  groupSelected: () => void;
  ungroupSelected: () => void;
  lockSelected: (locked: boolean) => void;

  // Camera viewport operations
  zoom: (factor: number, centerX?: number, centerY?: number) => void;
  pan: (dx: number, dy: number) => void;
  resetViewport: () => void;

  // Undo & Redo History
  saveHistorySnapshot: () => void;
  undo: () => void;
  redo: () => void;

  // Copy Paste
  copySelected: () => void;
  pasteCopied: () => void;

  // Board Saving/Loading
  loadBoard: (id: string) => Promise<void>;
  saveBoard: () => Promise<void>;
  renameBoard: (title: string) => Promise<void>;
  setPresentationMode: (active: boolean) => void;
  setFullscreen: (active: boolean) => void;

  // Collaboration triggers
  setConnectionState: (state: string) => void;
  updateCursor: (userId: string, data: any) => void;
  clearCursors: () => void;
  addComment: (text: string, x: number, y: number, user: any) => Promise<void>;
  resolveComment: (commentId: string) => Promise<void>;
  sendChatMessage: (text: string, user: any) => void;
  receiveChatMessage: (msg: ChatMessage) => void;

  // Version management
  createVersion: (createdBy: string, tagName?: string) => Promise<void>;
  loadVersionHistory: () => Promise<void>;
  restoreVersion: (version: BoardVersion) => Promise<void>;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  elements: [],
  selectedElementIds: [],
  copiedElements: [],
  scale: 1.0,
  panX: 0,
  panY: 0,

  // Default values
  tool: 'select',
  brushColor: '#1e293b',
  fillColor: 'transparent',
  strokeWidth: 3,
  strokeStyle: 'solid',
  opacity: 1.0,
  shadowStyle: 'none',
  borderRadius: false,

  fontFamily: 'Outfit',
  fontSize: 16,
  align: 'left',
  textStyles: { bold: false, italic: false, underline: false, strike: false },

  gridType: 'dots',
  snapToGrid: false,
  smartGuides: true,
  backgroundColor: '#ffffff', // Professional pure white paper background
  backgroundImage: null,

  boardId: null,
  boardTitle: 'New Whiteboard',
  boardOwnerId: null,
  starred: false,
  folderId: null,
  saving: false,
  
  versions: [],
  undoStack: [],
  redoStack: [],

  connectionState: 'local',
  cursors: {},
  comments: [],
  chatMessages: [],
  presentationMode: false,
  fullscreen: false,

  // Styles setters
  setTool: (tool) => {
    // Clear selection when switching to drawing tools to avoid confusing UI overlays
    if (tool !== 'select') {
      set({ tool, selectedElementIds: [] });
    } else {
      set({ tool });
    }
  },
  setBrushColor: (brushColor) => set({ brushColor }),
  setFillColor: (fillColor) => set({ fillColor }),
  setStrokeWidth: (strokeWidth) => set({ strokeWidth }),
  setStrokeStyle: (strokeStyle) => set({ strokeStyle }),
  setOpacity: (opacity) => set({ opacity }),
  setShadowStyle: (shadowStyle) => set({ shadowStyle }),
  setBorderRadius: (borderRadius) => set({ borderRadius }),
  setFontFamily: (fontFamily) => set({ fontFamily }),
  setFontSize: (fontSize) => set({ fontSize }),
  setTextStyle: (style) => set({ textStyles: { ...get().textStyles, ...style } }),
  setAlign: (align) => set({ align }),
  setGridType: (gridType) => set({ gridType }),
  setSnapToGrid: (snapToGrid) => set({ snapToGrid }),
  setSmartGuides: (smartGuides) => set({ smartGuides }),
  setBackgroundColor: (backgroundColor) => set({ backgroundColor }),
  setBackgroundImage: (backgroundImage) => set({ backgroundImage }),

  setElements: (elements, recordHistory = true) => {
    if (recordHistory) {
      get().saveHistorySnapshot();
    }
    set({ elements });
  },

  addElement: (element) => {
    get().saveHistorySnapshot();
    set((state) => ({ elements: [...state.elements, element] }));
  },

  updateElement: (id, updates) => {
    set((state) => ({
      elements: state.elements.map((el) => (el.id === id ? { ...el, ...updates, updatedAt: Date.now() } : el))
    }));
  },

  updateSelectedElements: (updates) => {
    const { selectedElementIds, elements } = get();
    if (selectedElementIds.length === 0) return;
    
    // Save state before update for undo support
    get().saveHistorySnapshot();
    
    set({
      elements: elements.map((el) => 
        selectedElementIds.includes(el.id) && !el.locked 
          ? { ...el, ...updates, updatedAt: Date.now() } 
          : el
      )
    });
  },

  deleteSelectedElements: () => {
    const { selectedElementIds, elements } = get();
    const activeDeletes = selectedElementIds.filter(id => {
      const el = elements.find(e => e.id === id);
      return el && !el.locked;
    });
    if (activeDeletes.length === 0) return;

    get().saveHistorySnapshot();

    set((state) => ({
      elements: state.elements.filter((el) => !activeDeletes.includes(el.id)),
      selectedElementIds: state.selectedElementIds.filter((id) => !activeDeletes.includes(id))
    }));
  },

  duplicateSelectedElements: () => {
    const { selectedElementIds, elements } = get();
    if (selectedElementIds.length === 0) return;

    get().saveHistorySnapshot();

    const duplicated: BoardElement[] = [];
    const idMap: Record<string, string> = {};

    // Generate new unique ids first for connector logic
    selectedElementIds.forEach(id => {
      idMap[id] = 'dup-' + Math.random().toString(36).slice(2, 9);
    });

    elements.forEach((el) => {
      if (selectedElementIds.includes(el.id)) {
        const newEl: BoardElement = {
          ...el,
          id: idMap[el.id],
          x: el.x + 30, // Offset duplicate slightly
          y: el.y + 30,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        
        // Offset points for pencils and lines
        if (el.points) {
          newEl.points = el.points.map(p => ({ x: p.x + 30, y: p.y + 30 }));
        }

        duplicated.push(newEl);
      }
    });

    set((state) => ({
      elements: [...state.elements, ...duplicated],
      selectedElementIds: duplicated.map((el) => el.id)
    }));
  },

  clearCanvas: () => {
    get().saveHistorySnapshot();
    set({ elements: [], selectedElementIds: [] });
  },

  selectElements: (selectedElementIds) => set({ selectedElementIds }),
  clearSelection: () => set({ selectedElementIds: [] }),

  // Layer Ordering
  bringForward: () => {
    const { selectedElementIds, elements } = get();
    if (selectedElementIds.length === 0) return;
    
    get().saveHistorySnapshot();
    
    const newElements = [...elements];
    for (let i = newElements.length - 2; i >= 0; i--) {
      if (selectedElementIds.includes(newElements[i].id) && !selectedElementIds.includes(newElements[i+1].id)) {
        // Swap layers
        const temp = newElements[i];
        newElements[i] = newElements[i+1];
        newElements[i+1] = temp;
      }
    }
    set({ elements: newElements });
  },

  sendBackward: () => {
    const { selectedElementIds, elements } = get();
    if (selectedElementIds.length === 0) return;
    
    get().saveHistorySnapshot();
    
    const newElements = [...elements];
    for (let i = 1; i < newElements.length; i++) {
      if (selectedElementIds.includes(newElements[i].id) && !selectedElementIds.includes(newElements[i-1].id)) {
        // Swap layers
        const temp = newElements[i];
        newElements[i] = newElements[i-1];
        newElements[i-1] = temp;
      }
    }
    set({ elements: newElements });
  },

  bringToFront: () => {
    const { selectedElementIds, elements } = get();
    if (selectedElementIds.length === 0) return;
    
    get().saveHistorySnapshot();
    
    const selected = elements.filter(el => selectedElementIds.includes(el.id));
    const unselected = elements.filter(el => !selectedElementIds.includes(el.id));
    set({ elements: [...unselected, ...selected] });
  },

  sendToBack: () => {
    const { selectedElementIds, elements } = get();
    if (selectedElementIds.length === 0) return;
    
    get().saveHistorySnapshot();
    
    const selected = elements.filter(el => selectedElementIds.includes(el.id));
    const unselected = elements.filter(el => !selectedElementIds.includes(el.id));
    set({ elements: [...selected, ...unselected] });
  },

  // Grouping
  groupSelected: () => {
    const { selectedElementIds, elements } = get();
    if (selectedElementIds.length < 2) return;
    
    get().saveHistorySnapshot();
    
    const groupId = 'group-' + Math.random().toString(36).slice(2, 9);
    set({
      elements: elements.map(el => 
        selectedElementIds.includes(el.id) ? { ...el, groupId } : el
      )
    });
  },

  ungroupSelected: () => {
    const { selectedElementIds, elements } = get();
    if (selectedElementIds.length === 0) return;
    
    get().saveHistorySnapshot();
    
    // Find all groupIds associated with selection
    const targetGroupIds = elements
      .filter(el => selectedElementIds.includes(el.id) && el.groupId)
      .map(el => el.groupId as string);
      
    if (targetGroupIds.length === 0) return;

    set({
      elements: elements.map(el => 
        el.groupId && targetGroupIds.includes(el.groupId) ? { ...el, groupId: undefined } : el
      )
    });
  },

  lockSelected: (locked) => {
    const { selectedElementIds, elements } = get();
    if (selectedElementIds.length === 0) return;
    
    get().saveHistorySnapshot();
    
    set({
      elements: elements.map(el => 
        selectedElementIds.includes(el.id) ? { ...el, locked } : el
      )
    });
  },

  // Camera settings
  zoom: (factor, centerX, centerY) => {
    const { scale, panX, panY } = get();
    const newScale = Math.min(Math.max(scale * factor, 0.15), 6.0);
    
    if (centerX !== undefined && centerY !== undefined) {
      // Zoom centered on coordinates
      const worldX = (centerX - panX) / scale;
      const worldY = (centerY - panY) / scale;
      
      set({
        scale: newScale,
        panX: centerX - worldX * newScale,
        panY: centerY - worldY * newScale
      });
    } else {
      // Zoom centered on screen middle
      set({ scale: newScale });
    }
  },

  pan: (dx, dy) => {
    set((state) => ({
      panX: state.panX + dx,
      panY: state.panY + dy
    }));
  },

  resetViewport: () => set({ scale: 1.0, panX: 0, panY: 0 }),

  // History system
  saveHistorySnapshot: () => {
    const { elements, undoStack } = get();
    // Cap history limit to 50 items for speed
    const newUndo = [...undoStack, JSON.parse(JSON.stringify(elements))].slice(-50);
    set({
      undoStack: newUndo,
      redoStack: [] // Reset redo stack on new operation
    });
  },

  undo: () => {
    const { undoStack, redoStack, elements } = get();
    if (undoStack.length === 0) return;
    
    const previous = undoStack[undoStack.length - 1];
    const newUndo = undoStack.slice(0, -1);
    
    set({
      undoStack: newUndo,
      redoStack: [...redoStack, JSON.parse(JSON.stringify(elements))],
      elements: previous,
      selectedElementIds: []
    });
  },

  redo: () => {
    const { undoStack, redoStack, elements } = get();
    if (redoStack.length === 0) return;
    
    const next = redoStack[redoStack.length - 1];
    const newRedo = redoStack.slice(0, -1);
    
    set({
      undoStack: [...undoStack, JSON.parse(JSON.stringify(elements))],
      redoStack: newRedo,
      elements: next,
      selectedElementIds: []
    });
  },

  // Clipboard operations
  copySelected: () => {
    const { selectedElementIds, elements } = get();
    if (selectedElementIds.length === 0) return;
    const copied = elements.filter(el => selectedElementIds.includes(el.id));
    set({ copiedElements: copied });
  },

  pasteCopied: () => {
    const { copiedElements, elements } = get();
    if (copiedElements.length === 0) return;
    
    get().saveHistorySnapshot();
    
    const pasted = copiedElements.map((el) => {
      const newId = 'pasted-' + Math.random().toString(36).slice(2, 9);
      const newEl: BoardElement = {
        ...el,
        id: newId,
        x: el.x + 40,
        y: el.y + 40,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      if (el.points) {
        newEl.points = el.points.map(p => ({ x: p.x + 40, y: p.y + 40 }));
      }
      return newEl;
    });

    set({
      elements: [...elements, ...pasted],
      selectedElementIds: pasted.map(el => el.id)
    });
  },

  // Save/Load
  loadBoard: async (id) => {
    set({ saving: true });
    try {
      if (IS_FIREBASE_CONFIGURED) {
        const boardDoc = await getDoc(doc(db, 'whiteboards', id));
        if (boardDoc.exists()) {
          const data = boardDoc.data();
          set({
            boardId: id,
            boardTitle: data.title || 'Untitled Board',
            boardOwnerId: data.ownerId,
            elements: data.elements || [],
            scale: data.scale || 1.0,
            panX: data.panX || 0,
            panY: data.panY || 0,
            starred: data.starred || false,
            folderId: data.folderId || null,
            backgroundColor: data.backgroundColor || '#ffffff'
          });
          // Setup real-time listener for board elements
          onSnapshot(doc(db, 'whiteboards', id), (docSnapshot) => {
            if (docSnapshot.exists()) {
              const activeData = docSnapshot.data();
              // Don't overwrite if we are currently drawing/dragging to prevent stutter
              if (get().tool === 'select' && document.activeElement?.tagName !== 'INPUT') {
                // Simple version sync
                if (activeData.updatedAt > (get().elements[0]?.updatedAt || 0)) {
                  set({ elements: activeData.elements || [] });
                }
              }
            }
          });
        }
      } else {
        const board = await mockStorage.getBoard(id);
        set({
          boardId: board.id,
          boardTitle: board.title,
          boardOwnerId: board.ownerId,
          elements: board.elements,
          scale: board.scale,
          panX: board.panX,
          panY: board.panY,
          starred: board.starred,
          folderId: board.folderId,
          backgroundColor: board.backgroundColor || '#ffffff'
        });
      }
      
      // Load comments
      if (IS_FIREBASE_CONFIGURED) {
        const q = query(collection(db, 'comments'), where('boardId', '==', id));
        onSnapshot(q, (snapshot) => {
          const comments: CanvasComment[] = [];
          snapshot.forEach(doc => comments.push({ id: doc.id, ...doc.data() } as any));
          set({ comments });
        });
      } else {
        // Mock comments
        const mockComm = JSON.parse(localStorage.getItem(`mock_comments_${id}`) || '[]');
        set({ comments: mockComm });
      }

      await get().loadVersionHistory();

    } catch (error) {
      console.error("Load board failure:", error);
    } finally {
      set({ saving: false });
    }
  },

  saveBoard: async () => {
    const { boardId, elements, scale, panX, panY, boardTitle, starred, folderId, backgroundColor } = get();
    if (!boardId) return;
    set({ saving: true });
    try {
      if (IS_FIREBASE_CONFIGURED) {
        await updateDoc(doc(db, 'whiteboards', boardId), {
          elements,
          scale,
          panX,
          panY,
          title: boardTitle,
          starred,
          folderId,
          backgroundColor,
          updatedAt: Date.now()
        });
      } else {
        await mockStorage.saveBoardState(boardId, elements, scale, panX, panY, {
          title: boardTitle,
          starred,
          folderId,
          backgroundColor
        });
      }
    } catch (error) {
      console.error("Auto save error:", error);
    } finally {
      set({ saving: false });
    }
  },

  renameBoard: async (title) => {
    const { boardId } = get();
    if (!boardId) return;
    set({ boardTitle: title });
    if (IS_FIREBASE_CONFIGURED) {
      await updateDoc(doc(db, 'whiteboards', boardId), { title, updatedAt: Date.now() });
    } else {
      await mockStorage.renameBoard(boardId, title);
    }
  },

  setPresentationMode: (presentationMode) => set({ presentationMode }),
  setFullscreen: (fullscreen) => set({ fullscreen }),

  // Cursors & Presence
  setConnectionState: (connectionState) => set({ connectionState }),
  updateCursor: (userId, cursor) => {
    set((state) => ({
      cursors: {
        ...state.cursors,
        [userId]: cursor
      }
    }));
  },
  clearCursors: () => set({ cursors: {} }),

  // Comments
  addComment: async (text, x, y, user) => {
    const { boardId, comments } = get();
    if (!boardId || !user) return;
    
    const newComment: Omit<CanvasComment, 'id'> = {
      boardId,
      x,
      y,
      text,
      userId: user.uid,
      userName: user.displayName,
      userPhoto: user.photoURL,
      createdAt: Date.now(),
      resolved: false
    };

    if (IS_FIREBASE_CONFIGURED) {
      await addDoc(collection(db, 'comments'), newComment);
    } else {
      const fullComment: CanvasComment = { ...newComment, id: 'comment-' + Math.random().toString(36).slice(2, 9) };
      const updated = [...comments, fullComment];
      localStorage.setItem(`mock_comments_${boardId}`, JSON.stringify(updated));
      set({ comments: updated });
    }
  },

  resolveComment: async (commentId) => {
    const { boardId, comments } = get();
    if (IS_FIREBASE_CONFIGURED) {
      await updateDoc(doc(db, 'comments', commentId), { resolved: true });
    } else {
      const updated = comments.map(c => c.id === commentId ? { ...c, resolved: true } : c);
      localStorage.setItem(`mock_comments_${boardId}`, JSON.stringify(updated));
      set({ comments: updated });
    }
  },

  // Chat
  sendChatMessage: (text, user) => {
    if (!user) return;
    const msg: ChatMessage = {
      id: 'chat-' + Date.now(),
      userId: user.uid,
      userName: user.displayName,
      text,
      timestamp: Date.now()
    };
    set((state) => ({ chatMessages: [...state.chatMessages, msg] }));
  },

  receiveChatMessage: (msg) => {
    set((state) => ({ chatMessages: [...state.chatMessages, msg] }));
  },

  // Version management
  createVersion: async (createdBy, tagName) => {
    const { boardId, elements } = get();
    if (!boardId) return;
    try {
      if (IS_FIREBASE_CONFIGURED) {
        const vRef = doc(collection(db, 'versions'));
        await setDoc(vRef, {
          boardId,
          elements,
          createdAt: Date.now(),
          createdBy,
          tagName: tagName || `Tag Version ${Date.now()}`
        });
      } else {
        await mockStorage.saveVersion(boardId, elements, createdBy, tagName);
      }
      await get().loadVersionHistory();
    } catch (e) {
      console.error(e);
    }
  },

  loadVersionHistory: async () => {
    const { boardId } = get();
    if (!boardId) return;
    try {
      if (IS_FIREBASE_CONFIGURED) {
        const q = query(collection(db, 'versions'), where('boardId', '==', boardId));
        const snap = await getDocs(q);
        const versions: BoardVersion[] = [];
        snap.forEach(d => versions.push({ id: d.id, ...d.data() } as any));
        set({ versions: versions.sort((a,b) => b.createdAt - a.createdAt) });
      } else {
        const list = await mockStorage.getVersions(boardId);
        set({ versions: list as any[] });
      }
    } catch (e) {
      console.error(e);
    }
  },

  restoreVersion: async (version) => {
    get().saveHistorySnapshot();
    set({ elements: version.elements });
    await get().saveBoard();
  }
}));
