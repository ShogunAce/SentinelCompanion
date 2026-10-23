import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider, syncUserProfile } from './firebase';
import type { UserProfile } from './firebase';
import { AuthModal } from './AuthModal';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  openAuthModal: (mode?: 'signin' | 'signup') => void;
  closeAuthModal: () => void;
  authModalOpen: boolean;
  authModalMode: 'signin' | 'signup';
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  logout: async () => {},
  openAuthModal: () => {},
  closeAuthModal: () => {},
  authModalOpen: false,
  authModalMode: 'signin',
});

// Session TTL Settings:
// Max idle time before auto-signout: 4 hours
const MAX_IDLE_MS = 4 * 60 * 60 * 1000;
// Max total session time before requiring re-authentication: 24 hours
const MAX_SESSION_TOTAL_MS = 24 * 60 * 60 * 1000;

const STORAGE_LAST_ACTIVE = 'sentinel_session_last_active';
const STORAGE_LOGIN_TIME = 'sentinel_session_login_time';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Global AuthModal controls
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  const openAuthModal = useCallback((mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      localStorage.removeItem(STORAGE_LAST_ACTIVE);
      localStorage.removeItem(STORAGE_LOGIN_TIME);
      await signOut(auth);
    } catch (err) {
      console.error("Signout error:", err);
    } finally {
      setUser(null);
      setProfile(null);
    }
  }, []);

  // Update activity timestamp on user interactions
  const recordActivity = useCallback(() => {
    if (!auth.currentUser) return;
    try {
      localStorage.setItem(STORAGE_LAST_ACTIVE, Date.now().toString());
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    let lastRecorded = 0;
    const throttledHandler = () => {
      const now = Date.now();
      if (now - lastRecorded > 15000) {
        lastRecorded = now;
        recordActivity();
      }
    };

    events.forEach((ev) => window.addEventListener(ev, throttledHandler, { passive: true }));
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, throttledHandler));
    };
  }, [recordActivity]);

  // Session TTL validation timer (checks every 30s)
  useEffect(() => {
    if (!user) return;

    const checkSessionTTL = () => {
      try {
        const now = Date.now();
        const lastActiveStr = localStorage.getItem(STORAGE_LAST_ACTIVE);
        const loginTimeStr = localStorage.getItem(STORAGE_LOGIN_TIME);

        const lastActive = lastActiveStr ? parseInt(lastActiveStr, 10) : now;
        const loginTime = loginTimeStr ? parseInt(loginTimeStr, 10) : now;

        const idleExceeded = now - lastActive > MAX_IDLE_MS;
        const totalExceeded = now - loginTime > MAX_SESSION_TOTAL_MS;

        if (idleExceeded || totalExceeded) {
          console.warn("[Sentinel Security] Session token TTL expired due to inactivity. Signing out.");
          handleLogout();
        }
      } catch {
        // ignore
      }
    };

    // Run check immediately and periodically
    checkSessionTTL();
    const interval = setInterval(checkSessionTTL, 30000);
    return () => clearInterval(interval);
  }, [user, handleLogout]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const now = Date.now().toString();
        if (!localStorage.getItem(STORAGE_LOGIN_TIME)) {
          localStorage.setItem(STORAGE_LOGIN_TIME, now);
        }
        localStorage.setItem(STORAGE_LAST_ACTIVE, now);

        try {
          const userProfile = await syncUserProfile(currentUser);
          setProfile(userProfile);
        } catch (err) {
          console.error("Failed to sync profile:", err);
        }
      } else {
        localStorage.removeItem(STORAGE_LAST_ACTIVE);
        localStorage.removeItem(STORAGE_LOGIN_TIME);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    localStorage.setItem(STORAGE_LOGIN_TIME, Date.now().toString());
    localStorage.setItem(STORAGE_LAST_ACTIVE, Date.now().toString());
    await syncUserProfile(result.user);
  };

  const handleEmailSignIn = async (email: string, pass: string) => {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    localStorage.setItem(STORAGE_LOGIN_TIME, Date.now().toString());
    localStorage.setItem(STORAGE_LAST_ACTIVE, Date.now().toString());
    await syncUserProfile(result.user);
  };

  const handleEmailSignUp = async (email: string, pass: string, displayName?: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    localStorage.setItem(STORAGE_LOGIN_TIME, Date.now().toString());
    localStorage.setItem(STORAGE_LAST_ACTIVE, Date.now().toString());
    await syncUserProfile({
      uid: result.user.uid,
      email: result.user.email,
      displayName: displayName || email.split('@')[0],
      photoURL: null,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithGoogle: handleGoogleSignIn,
        signInWithEmail: handleEmailSignIn,
        signUpWithEmail: handleEmailSignUp,
        logout: handleLogout,
        openAuthModal,
        closeAuthModal,
        authModalOpen,
        authModalMode,
      }}
    >
      {children}
      <AuthModal
        isOpen={authModalOpen}
        onClose={closeAuthModal}
        initialMode={authModalMode}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
