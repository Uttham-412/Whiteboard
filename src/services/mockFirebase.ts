// Standalone UUID generator — no external dependency needed

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export interface MockUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  jobTitle?: string;
  bio?: string;
  isGuest?: boolean;
}

export interface MockBoard {
  id: string;
  title: string;
  ownerId: string;
  elements: any[];
  scale: number;
  panX: number;
  panY: number;
  starred: boolean;
  trashed: boolean;
  folderId: string | null;
  createdAt: number;
  updatedAt: number;
  lastEditedBy: string;
  templateType?: string;
  backgroundColor?: string;
}

export interface MockFolder {
  id: string;
  name: string;
  ownerId: string;
  createdAt: number;
}

export interface MockVersion {
  id: string;
  boardId: string;
  elements: any[];
  createdAt: number;
  createdBy: string;
  tagName?: string;
}

// Initial default templates/boards
const getInitialBoards = (userId: string): MockBoard[] => [
  {
    id: 'demo-welcome',
    title: '🚀 Welcome to CollabCanvas Pro',
    ownerId: userId,
    elements: [
      {
        id: 'welcome-title',
        type: 'text',
        x: 100,
        y: 100,
        width: 600,
        height: 60,
        rotation: 0,
        text: '🎨 Premium Whiteboard Workspace',
        fontSize: 32,
        fontFamily: 'Outfit',
        fontStyle: { bold: true, italic: false, underline: false, strike: false },
        align: 'left',
        color: '#6366f1'
      },
      {
        id: 'welcome-sticky-1',
        type: 'sticky',
        x: 100,
        y: 200,
        width: 180,
        height: 180,
        rotation: -2,
        text: '✨ Infinite Canvas\nUse Ctrl+Wheel to Zoom\nSpace + Drag to Pan!',
        color: '#854d0e',
        fillColor: '#fef08a'
      },
      {
        id: 'welcome-sticky-2',
        type: 'sticky',
        x: 310,
        y: 195,
        width: 180,
        height: 180,
        rotation: 3,
        text: '👥 Collaboration\nOpen multiple tabs with the Workspace ID to test live synchronization!',
        color: '#1e3a8a',
        fillColor: '#bfdbfe'
      },
      {
        id: 'welcome-sticky-3',
        type: 'sticky',
        x: 520,
        y: 205,
        width: 180,
        height: 180,
        rotation: -1,
        text: '🤖 AI Templates\nGenerate mindmaps, flowcharts and summaries with AI interfaces!',
        color: '#064e3b',
        fillColor: '#a7f3d0'
      },
      {
        id: 'welcome-arrow-1',
        type: 'arrow',
        x: 190,
        y: 400,
        width: 0,
        height: 0,
        rotation: 0,
        points: [{ x: 190, y: 400 }, { x: 380, y: 500 }],
        color: '#10b981',
        strokeWidth: 4,
        strokeStyle: 'dashed'
      },
      {
        id: 'welcome-rect-1',
        type: 'rect',
        x: 350,
        y: 520,
        width: 250,
        height: 100,
        rotation: 0,
        color: '#22d3ee',
        fillColor: 'rgba(34, 211, 238, 0.1)',
        strokeWidth: 3,
        rounded: true
      },
      {
        id: 'welcome-rect-text',
        type: 'text',
        x: 370,
        y: 550,
        width: 210,
        height: 40,
        rotation: 0,
        text: 'Connected Shape Node',
        fontSize: 16,
        fontFamily: 'Outfit',
        fontStyle: { bold: true, italic: false, underline: false, strike: false },
        align: 'center',
        color: '#22d3ee'
      }
    ],
    scale: 1,
    panX: 0,
    panY: 0,
    starred: true,
    trashed: false,
    folderId: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastEditedBy: 'System',
    backgroundColor: '#ffffff'
  }
];

export const mockStorage = {
  // --- AUTHENTICATION ---
  getCurrentUser: (): MockUser | null => {
    const user = localStorage.getItem('mock_current_user');
    return user ? JSON.parse(user) : null;
  },

  login: async (email: string, _password: string): Promise<MockUser> => {
    // Basic simulate auth (password not validated in mock mode)
    const users: MockUser[] = JSON.parse(localStorage.getItem('mock_users') || '[]');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      throw new Error("User not found. Register an account first.");
    }
    
    localStorage.setItem('mock_current_user', JSON.stringify(user));
    return user;
  },

  register: async (email: string, displayName: string): Promise<MockUser> => {
    const users: MockUser[] = JSON.parse(localStorage.getItem('mock_users') || '[]');
    const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (exists) {
      throw new Error("Account with this email already exists.");
    }

    const newUser: MockUser = {
      uid: generateUUID(),
      email: email.toLowerCase(),
      displayName: displayName || email.split('@')[0],
      photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(displayName)}`,
      jobTitle: 'Product Architect',
      bio: 'Creating premium visual collaborative components.'
    };

    users.push(newUser);
    localStorage.setItem('mock_users', JSON.stringify(users));
    localStorage.setItem('mock_current_user', JSON.stringify(newUser));
    
    // Seed initial demo board
    const boards = JSON.parse(localStorage.getItem('mock_boards') || '[]');
    boards.push(...getInitialBoards(newUser.uid));
    localStorage.setItem('mock_boards', JSON.stringify(boards));

    return newUser;
  },

  loginWithGoogle: async (): Promise<MockUser> => {
    return mockStorage.register('creative.mind@example.com', 'Creative Designer');
  },

  loginAsGuest: async (): Promise<MockUser> => {
    const guestUser: MockUser = {
      uid: 'guest-' + generateUUID().slice(0, 8),
      email: 'guest@collabcanvas.pro',
      displayName: 'Guest Contributor',
      photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=guest-${Math.random()}`,
      jobTitle: 'Guest Developer',
      bio: 'Temporary guest sandbox session.',
      isGuest: true
    };
    
    localStorage.setItem('mock_current_user', JSON.stringify(guestUser));
    
    // Seed initial boards
    const boards = JSON.parse(localStorage.getItem('mock_boards') || '[]');
    const hasBoards = boards.some((b: MockBoard) => b.ownerId === guestUser.uid);
    if (!hasBoards) {
      boards.push(...getInitialBoards(guestUser.uid));
      localStorage.setItem('mock_boards', JSON.stringify(boards));
    }

    return guestUser;
  },

  logout: async (): Promise<void> => {
    const user = mockStorage.getCurrentUser();
    if (user && user.isGuest) {
      // Clean up guest boards
      const boards = JSON.parse(localStorage.getItem('mock_boards') || '[]');
      const filtered = boards.filter((b: MockBoard) => b.ownerId !== user.uid);
      localStorage.setItem('mock_boards', JSON.stringify(filtered));
    }
    localStorage.removeItem('mock_current_user');
  },

  updateProfile: async (updates: Partial<MockUser>): Promise<MockUser> => {
    const currentUser = mockStorage.getCurrentUser();
    if (!currentUser) throw new Error("No active user session.");

    const updatedUser = { ...currentUser, ...updates };
    localStorage.setItem('mock_current_user', JSON.stringify(updatedUser));

    // Update in users table
    const users: MockUser[] = JSON.parse(localStorage.getItem('mock_users') || '[]');
    const idx = users.findIndex(u => u.uid === currentUser.uid);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      localStorage.setItem('mock_users', JSON.stringify(users));
    }
    
    return updatedUser;
  },

  // --- BOARDS MANAGEMENT ---
  getBoards: async (userId: string): Promise<MockBoard[]> => {
    const boards: MockBoard[] = JSON.parse(localStorage.getItem('mock_boards') || '[]');
    return boards.filter(b => b.ownerId === userId && !b.trashed);
  },

  getTrashBoards: async (userId: string): Promise<MockBoard[]> => {
    const boards: MockBoard[] = JSON.parse(localStorage.getItem('mock_boards') || '[]');
    return boards.filter(b => b.ownerId === userId && b.trashed);
  },

  getStarredBoards: async (userId: string): Promise<MockBoard[]> => {
    const boards: MockBoard[] = JSON.parse(localStorage.getItem('mock_boards') || '[]');
    return boards.filter(b => b.ownerId === userId && b.starred && !b.trashed);
  },

  getBoard: async (boardId: string): Promise<MockBoard> => {
    const boards: MockBoard[] = JSON.parse(localStorage.getItem('mock_boards') || '[]');
    const board = boards.find(b => b.id === boardId);
    if (!board) throw new Error("Board not found.");
    return board;
  },

  createBoard: async (userId: string, title: string, templateType = 'empty'): Promise<MockBoard> => {
    const boards: MockBoard[] = JSON.parse(localStorage.getItem('mock_boards') || '[]');
    
    let elements: any[] = [];
    
    // Seed templates
    if (templateType === 'flowchart') {
      elements = [
        { id: 'f-1', type: 'rect', x: 200, y: 150, width: 140, height: 60, color: '#6366f1', fillColor: 'rgba(99, 102, 241, 0.05)', strokeWidth: 3, rounded: true },
        { id: 'f-1-text', type: 'text', x: 210, y: 170, width: 120, height: 20, text: 'Start Process', fontSize: 14, fontFamily: 'Outfit', align: 'center', color: '#6366f1' },
        { id: 'f-arrow-1', type: 'arrow', x: 270, y: 210, width: 0, height: 0, points: [{ x: 270, y: 210 }, { x: 270, y: 290 }], color: '#94a3b8', strokeWidth: 3 },
        { id: 'f-2', type: 'diamond', x: 200, y: 290, width: 140, height: 100, color: '#f43f5e', fillColor: 'rgba(244, 63, 94, 0.05)', strokeWidth: 3 },
        { id: 'f-2-text', type: 'text', x: 220, y: 330, width: 100, height: 20, text: 'Is Approved?', fontSize: 13, fontFamily: 'Outfit', align: 'center', color: '#f43f5e' },
      ];
    } else if (templateType === 'retro') {
      elements = [
        { id: 'r-t', type: 'text', x: 100, y: 80, width: 600, height: 40, text: 'Sprint Retrospective', fontSize: 24, fontFamily: 'Outfit', fontStyle: { bold: true }, color: '#f8fafc' },
        { id: 'r-s1', type: 'sticky', x: 100, y: 160, width: 160, height: 160, rotation: -2, text: 'What Went Well:\n- Shipped design tokens\n- React 19 testing passes', fillColor: '#a7f3d0', color: '#064e3b' },
        { id: 'r-s2', type: 'sticky', x: 300, y: 160, width: 160, height: 160, rotation: 1, text: 'To Improve:\n- WebRTC signaling connection dropouts', fillColor: '#fecaca', color: '#7f1d1d' }
      ];
    } else if (templateType === 'mindmap') {
      elements = [
        { id: 'm-c', type: 'ellipse', x: 300, y: 200, width: 160, height: 80, color: '#3b82f6', fillColor: 'rgba(59, 130, 246, 0.08)', strokeWidth: 3 },
        { id: 'm-c-text', type: 'text', x: 310, y: 230, width: 140, height: 20, text: 'Product Launch', fontSize: 15, fontFamily: 'Outfit', align: 'center', color: '#3b82f6' }
      ];
    }

    const newBoard: MockBoard = {
      id: generateUUID(),
      title: title || 'Untitled Board',
      ownerId: userId,
      elements,
      scale: 1,
      panX: 0,
      panY: 0,
      starred: false,
      trashed: false,
      folderId: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastEditedBy: mockStorage.getCurrentUser()?.displayName || 'Unknown',
      templateType,
      backgroundColor: '#ffffff'
    };

    boards.push(newBoard);
    localStorage.setItem('mock_boards', JSON.stringify(boards));
    return newBoard;
  },

  saveBoardState: async (boardId: string, elements: any[], scale: number, panX: number, panY: number, updates?: Partial<MockBoard>): Promise<void> => {
    const boards: MockBoard[] = JSON.parse(localStorage.getItem('mock_boards') || '[]');
    const idx = boards.findIndex(b => b.id === boardId);
    
    if (idx !== -1) {
      boards[idx] = {
        ...boards[idx],
        elements,
        scale,
        panX,
        panY,
        ...updates,
        updatedAt: Date.now(),
        lastEditedBy: mockStorage.getCurrentUser()?.displayName || 'User'
      };
      localStorage.setItem('mock_boards', JSON.stringify(boards));
    }
  },

  renameBoard: async (boardId: string, newTitle: string): Promise<void> => {
    const boards: MockBoard[] = JSON.parse(localStorage.getItem('mock_boards') || '[]');
    const idx = boards.findIndex(b => b.id === boardId);
    if (idx !== -1) {
      boards[idx].title = newTitle;
      boards[idx].updatedAt = Date.now();
      localStorage.setItem('mock_boards', JSON.stringify(boards));
    }
  },

  duplicateBoard: async (boardId: string): Promise<MockBoard> => {
    const boards: MockBoard[] = JSON.parse(localStorage.getItem('mock_boards') || '[]');
    const board = boards.find(b => b.id === boardId);
    if (!board) throw new Error("Board not found.");

    const duplicated: MockBoard = {
      ...board,
      id: generateUUID(),
      title: `${board.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      starred: false
    };

    boards.push(duplicated);
    localStorage.setItem('mock_boards', JSON.stringify(boards));
    return duplicated;
  },

  deleteBoard: async (boardId: string): Promise<void> => {
    // Permanent delete
    const boards: MockBoard[] = JSON.parse(localStorage.getItem('mock_boards') || '[]');
    const filtered = boards.filter(b => b.id !== boardId);
    localStorage.setItem('mock_boards', JSON.stringify(filtered));
  },

  starBoard: async (boardId: string, starred: boolean): Promise<void> => {
    const boards: MockBoard[] = JSON.parse(localStorage.getItem('mock_boards') || '[]');
    const idx = boards.findIndex(b => b.id === boardId);
    if (idx !== -1) {
      boards[idx].starred = starred;
      localStorage.setItem('mock_boards', JSON.stringify(boards));
    }
  },

  trashBoard: async (boardId: string, trashed: boolean): Promise<void> => {
    const boards: MockBoard[] = JSON.parse(localStorage.getItem('mock_boards') || '[]');
    const idx = boards.findIndex(b => b.id === boardId);
    if (idx !== -1) {
      boards[idx].trashed = trashed;
      localStorage.setItem('mock_boards', JSON.stringify(boards));
    }
  },

  // --- FOLDERS MANAGEMENT ---
  getFolders: async (userId: string): Promise<MockFolder[]> => {
    const folders: MockFolder[] = JSON.parse(localStorage.getItem('mock_folders') || '[]');
    return folders.filter(f => f.ownerId === userId);
  },

  createFolder: async (userId: string, name: string): Promise<MockFolder> => {
    const folders: MockFolder[] = JSON.parse(localStorage.getItem('mock_folders') || '[]');
    const newFolder: MockFolder = {
      id: generateUUID(),
      name,
      ownerId: userId,
      createdAt: Date.now()
    };
    folders.push(newFolder);
    localStorage.setItem('mock_folders', JSON.stringify(folders));
    return newFolder;
  },

  moveBoardToFolder: async (boardId: string, folderId: string | null): Promise<void> => {
    const boards: MockBoard[] = JSON.parse(localStorage.getItem('mock_boards') || '[]');
    const idx = boards.findIndex(b => b.id === boardId);
    if (idx !== -1) {
      boards[idx].folderId = folderId;
      localStorage.setItem('mock_boards', JSON.stringify(boards));
    }
  },

  // --- VERSION HISTORY ---
  saveVersion: async (boardId: string, elements: any[], createdBy: string, tagName?: string): Promise<MockVersion> => {
    const versions: MockVersion[] = JSON.parse(localStorage.getItem('mock_versions') || '[]');
    const newVersion: MockVersion = {
      id: generateUUID(),
      boardId,
      elements: JSON.parse(JSON.stringify(elements)), // Deep copy
      createdAt: Date.now(),
      createdBy,
      tagName: tagName || `Version ${versions.filter(v => v.boardId === boardId).length + 1}`
    };
    versions.push(newVersion);
    localStorage.setItem('mock_versions', JSON.stringify(versions));
    return newVersion;
  },

  getVersions: async (boardId: string): Promise<MockVersion[]> => {
    const versions: MockVersion[] = JSON.parse(localStorage.getItem('mock_versions') || '[]');
    return versions.filter(v => v.boardId === boardId).sort((a,b) => b.createdAt - a.createdAt);
  }
};
