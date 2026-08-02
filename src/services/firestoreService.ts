import { db } from './firebase';
import { 
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection, 
  addDoc, onSnapshot, query, where, getDocs, orderBy 
} from 'firebase/firestore';
import { BoardElement, CanvasComment, BoardVersion } from '../types';

export class FirestoreService {
  /**
   * Adds a collaborator to boards/{boardId}/collaborators/{uid} in Firestore.
   */
  static async addBoardCollaborator(
    boardId: string,
    user: { uid: string; email: string; displayName?: string | null; photoURL?: string | null },
    role: string = 'editor'
  ): Promise<void> {
    if (!db) return;
    try {
      const colRef = doc(db, 'boards', boardId, 'collaborators', user.uid);
      await setDoc(colRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || '',
        role: role,
        joinedAt: Date.now()
      }, { merge: true });
    } catch (e) {
      console.error(`Error adding collaborator for board ${boardId}:`, e);
    }
  }

  /**
   * Subscribes to real-time updates for a whiteboard document.
   */
  static subscribeToBoard(
    boardId: string,
    onUpdate: (boardData: any) => void
  ): () => void {
    if (!db) return () => {};

    const boardRef = doc(db, 'boards', boardId);
    return onSnapshot(
      boardRef,
      (snapshot) => {
        if (snapshot.exists()) {
          onUpdate(snapshot.data());
        }
      },
      (error) => {
        console.error(`Firestore real-time sync error for board ${boardId}:`, error);
      }
    );
  }

  /**
   * Updates board metadata (title, starred status) in Firestore.
   */
  static async updateBoardMetadata(
    boardId: string,
    metadata: { title?: string; starred?: boolean }
  ): Promise<void> {
    if (!db) return;
    try {
      const boardRef = doc(db, 'boards', boardId);
      await updateDoc(boardRef, {
        ...metadata,
        updatedAt: Date.now()
      });
    } catch (e) {
      console.error(`Error updating metadata for board ${boardId}:`, e);
    }
  }

  /**
   * Saves or updates board state in Firestore.
   */
  static async saveBoard(
    boardId: string,
    elements: BoardElement[],
    metadata: { title?: string; scale?: number; panX?: number; panY?: number; backgroundColor?: string; starred?: boolean } = {}
  ): Promise<void> {
    if (!db) return;

    try {
      const boardRef = doc(db, 'boards', boardId);
      await updateDoc(boardRef, {
        elements,
        ...metadata,
        updatedAt: Date.now()
      });
    } catch (e) {
      console.error(`Error saving board ${boardId} to Firestore:`, e);
    }
  }

  /**
   * Creates a new whiteboard document in Firestore.
   */
  static async createBoard(ownerId: string, title = 'Untitled Whiteboard'): Promise<string> {
    const boardId = 'board-' + Math.random().toString(36).slice(2, 9);
    const now = Date.now();

    const newBoard = {
      id: boardId,
      title,
      ownerId,
      elements: [],
      scale: 1.0,
      panX: 0,
      panY: 0,
      starred: false,
      createdAt: now,
      updatedAt: now
    };

    if (db) {
      await setDoc(doc(db, 'boards', boardId), newBoard);
    }

    return boardId;
  }

  /**
   * Deletes a whiteboard document from Firestore.
   */
  static async deleteBoard(boardId: string): Promise<void> {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'boards', boardId));
    } catch (e) {
      console.error(`Error deleting board ${boardId}:`, e);
    }
  }

  /**
   * Subscribes to real-time comments on a board.
   */
  static subscribeToComments(
    boardId: string,
    onCommentsUpdate: (comments: CanvasComment[]) => void
  ): () => void {
    if (!db) return () => {};

    const q = query(collection(db, 'comments'), where('boardId', '==', boardId));
    return onSnapshot(q, (snapshot) => {
      const list: CanvasComment[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as any);
      });
      onCommentsUpdate(list);
    });
  }

  /**
   * Adds a new comment pin to a board.
   */
  static async addComment(comment: Omit<CanvasComment, 'id'>): Promise<string> {
    if (!db) return 'comment-' + Math.random().toString(36).slice(2, 9);
    const docRef = await addDoc(collection(db, 'comments'), comment);
    return docRef.id;
  }

  /**
   * Saves a historical version snapshot of a board.
   */
  static async saveVersionSnapshot(
    boardId: string,
    elements: BoardElement[],
    createdBy: string,
    tagName?: string
  ): Promise<void> {
    if (!db) return;

    const versionDoc = {
      boardId,
      elements,
      createdBy,
      tagName: tagName || `Version ${new Date().toLocaleTimeString()}`,
      createdAt: Date.now()
    };

    await addDoc(collection(db, 'versions'), versionDoc);
  }

  /**
   * Fetches version history for a board.
   */
  static async getVersions(boardId: string): Promise<BoardVersion[]> {
    if (!db) return [];

    try {
      const q = query(collection(db, 'versions'), where('boardId', '==', boardId));
      const snap = await getDocs(q);
      const list: BoardVersion[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as any));
      return list.sort((a, b) => b.createdAt - a.createdAt);
    } catch (e) {
      console.error(`Error loading versions for board ${boardId}:`, e);
      return [];
    }
  }
}
