import { create } from 'zustand';
import { IS_FIREBASE_CONFIGURED, auth, db } from '../services/firebase';
import { mockStorage, MockUser } from '../services/mockFirebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  updateProfile as fbUpdateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

interface AuthState {
  user: MockUser | null;
  loading: boolean;
  error: string | null;
  rememberMe: boolean;
  
  initAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, displayName: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: () => Promise<void>;
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
    try {
      if (IS_FIREBASE_CONFIGURED && auth) {
        // Wait for Firebase to check local session
        auth.onAuthStateChanged(async (fbUser: import('firebase/auth').User | null) => {
          if (fbUser) {
            // Get extra fields from Firestore
            let jobTitle = 'Product Architect';
            let bio = 'Welcome to CollabCanvas!';
            try {
              const uDoc = await getDoc(doc(db, 'users', fbUser.uid));
              if (uDoc.exists()) {
                const data = uDoc.data();
                jobTitle = data.jobTitle || jobTitle;
                bio = data.bio || bio;
              }
            } catch (e) {
              console.warn("Could not load user extra profile fields", e);
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
      } else {
        // Mock fallback check
        const mockUser = mockStorage.getCurrentUser();
        set({ user: mockUser, loading: false });
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      if (IS_FIREBASE_CONFIGURED && auth) {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = cred.user;
        let jobTitle = 'Developer';
        let bio = '';
        const uDoc = await getDoc(doc(db, 'users', fbUser.uid));
        if (uDoc.exists()) {
          const data = uDoc.data();
          jobTitle = data.jobTitle || jobTitle;
          bio = data.bio || bio;
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
        const user = await mockStorage.login(email, password);
        set({ user, loading: false });
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  register: async (email, displayName, password) => {
    set({ loading: true, error: null });
    try {
      if (IS_FIREBASE_CONFIGURED && auth) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = cred.user;
        
        await fbUpdateProfile(fbUser, { displayName });
        
        // Save profile metadata in Firestore
        const userProfile = {
          uid: fbUser.uid,
          email: email.toLowerCase(),
          displayName,
          jobTitle: 'Developer',
          bio: 'Collaborator on board layout.',
          photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(displayName)}`
        };
        await setDoc(doc(db, 'users', fbUser.uid), userProfile);
        
        set({
          user: userProfile,
          loading: false
        });
      } else {
        const user = await mockStorage.register(email, displayName);
        set({ user, loading: false });
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  loginWithGoogle: async () => {
    set({ loading: true, error: null });
    try {
      if (IS_FIREBASE_CONFIGURED && auth) {
        const provider = new GoogleAuthProvider();
        const cred = await signInWithPopup(auth, provider);
        const fbUser = cred.user;
        
        // Save / check Firestore entry
        const uDocRef = doc(db, 'users', fbUser.uid);
        const uDoc = await getDoc(uDocRef);
        let userProfile;
        if (!uDoc.exists()) {
          userProfile = {
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || 'Google User',
            photoURL: fbUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${fbUser.uid}`,
            jobTitle: 'Creative Contributor',
            bio: 'Board planning enthusiast.'
          };
          await setDoc(uDocRef, userProfile);
        } else {
          const data = uDoc.data();
          userProfile = {
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || data.displayName,
            photoURL: fbUser.photoURL || data.photoURL,
            jobTitle: data.jobTitle || 'Creative Contributor',
            bio: data.bio || ''
          };
        }
        
        set({ user: userProfile, loading: false });
      } else {
        const user = await mockStorage.loginWithGoogle();
        set({ user, loading: false });
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  loginAsGuest: async () => {
    set({ loading: true, error: null });
    try {
      const user = await mockStorage.loginAsGuest();
      set({ user, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      if (IS_FIREBASE_CONFIGURED && auth) {
        await signOut(auth);
      } else {
        await mockStorage.logout();
      }
      set({ user: null, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  updateProfile: async (displayName, jobTitle, bio, photoURL) => {
    const { user } = get();
    if (!user) return;
    
    set({ loading: true });
    try {
      const updates = { displayName, jobTitle, bio, photoURL };
      if (IS_FIREBASE_CONFIGURED && auth && auth.currentUser) {
        await fbUpdateProfile(auth.currentUser, { displayName, photoURL });
        await updateDoc(doc(db, 'users', user.uid), updates);
      } else {
        await mockStorage.updateProfile(updates);
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
