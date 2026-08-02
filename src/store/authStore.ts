import { create } from 'zustand';
import { auth, db, firebaseInitError } from '../services/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  sendPasswordResetEmail,
  updateProfile as fbUpdateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  jobTitle?: string;
  bio?: string;
}

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  rememberMe: boolean;
  
  initAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, displayName: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (displayName: string, jobTitle: string, bio: string, photoURL?: string) => Promise<void>;
  setRememberMe: (val: boolean) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  error: null,
  rememberMe: localStorage.getItem('remember_me') === 'true',

  initAuth: async () => {
    set({ loading: true });
    if (firebaseInitError || !auth) {
      set({ 
        error: firebaseInitError || "Firebase Auth is not initialized. Please verify your VITE_FIREBASE_* keys in .env", 
        loading: false 
      });
      return;
    }

    onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        let jobTitle = 'Product Architect';
        let bio = 'Welcome to CollabCanvas!';
        try {
          if (db) {
            const uDoc = await getDoc(doc(db, 'users', fbUser.uid));
            if (uDoc.exists()) {
              const data = uDoc.data();
              jobTitle = data.jobTitle || jobTitle;
              bio = data.bio || bio;
            }
          }
        } catch (e) {
          console.warn("Could not load user profile from Firestore:", e);
        }
        
        set({
          user: {
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || 'Developer',
            photoURL: fbUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${fbUser.uid}`,
            jobTitle,
            bio
          },
          loading: false
        });
      } else {
        set({ user: null, loading: false });
      }
    });
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      if (!auth) throw new Error("Firebase Auth is not configured");
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = cred.user;
      let jobTitle = 'Developer';
      let bio = '';
      if (db) {
        const uDoc = await getDoc(doc(db, 'users', fbUser.uid));
        if (uDoc.exists()) {
          const data = uDoc.data();
          jobTitle = data.jobTitle || jobTitle;
          bio = data.bio || bio;
        }
      }
      set({
        user: {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || 'Developer',
          photoURL: fbUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${fbUser.uid}`,
          jobTitle,
          bio
        },
        loading: false
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  register: async (email, displayName, password) => {
    set({ loading: true, error: null });
    try {
      if (!auth) throw new Error("Firebase Auth is not configured");
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = cred.user;
      
      await fbUpdateProfile(fbUser, { displayName });
      
      const userProfile: UserProfile = {
        uid: fbUser.uid,
        email: email.toLowerCase(),
        displayName,
        jobTitle: 'Developer',
        bio: 'Collaborating on visual architecture.',
        photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(displayName)}`
      };

      if (db) {
        await setDoc(doc(db, 'users', fbUser.uid), {
          ...userProfile,
          createdAt: Date.now()
        });
      }
      
      set({ user: userProfile, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  loginWithGoogle: async () => {
    set({ loading: true, error: null });
    try {
      if (!auth) throw new Error("Firebase Auth is not configured");
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const fbUser = cred.user;
      
      let userProfile: UserProfile = {
        uid: fbUser.uid,
        email: fbUser.email || '',
        displayName: fbUser.displayName || 'Google User',
        photoURL: fbUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${fbUser.uid}`,
        jobTitle: 'Creative Contributor',
        bio: 'Board planning enthusiast.'
      };

      if (db) {
        const uDocRef = doc(db, 'users', fbUser.uid);
        const uDoc = await getDoc(uDocRef);
        if (!uDoc.exists()) {
          await setDoc(uDocRef, {
            ...userProfile,
            createdAt: Date.now()
          });
        } else {
          const data = uDoc.data();
          userProfile = {
            ...userProfile,
            displayName: data.displayName || userProfile.displayName,
            photoURL: data.photoURL || userProfile.photoURL,
            jobTitle: data.jobTitle || userProfile.jobTitle,
            bio: data.bio || userProfile.bio
          };
        }
      }
      
      set({ user: userProfile, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  resetPassword: async (email) => {
    set({ loading: true, error: null });
    try {
      if (!auth) throw new Error("Firebase Auth is not configured");
      await sendPasswordResetEmail(auth, email);
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      if (auth) {
        await signOut(auth);
      }
      set({ user: null, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  updateProfile: async (displayName, jobTitle, bio, photoURL) => {
    const { user } = get();
    if (!user || !auth) return;
    
    set({ loading: true });
    try {
      const updates = { displayName, jobTitle, bio, photoURL };
      if (auth.currentUser) {
        await fbUpdateProfile(auth.currentUser, { displayName, photoURL });
      }
      if (db) {
        await updateDoc(doc(db, 'users', user.uid), updates);
      }
      
      set({
        user: { ...user, ...updates },
        loading: false
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  setRememberMe: (val) => {
    localStorage.setItem('remember_me', String(val));
    set({ rememberMe: val });
  },

  clearError: () => set({ error: null })
}));
