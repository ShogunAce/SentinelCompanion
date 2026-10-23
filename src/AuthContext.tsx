import { createContext, useContext, useEffect, useState } from 'react';
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

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userProfile = await syncUserProfile(currentUser);
          setProfile(userProfile);
        } catch (err) {
          console.error("Failed to sync profile:", err);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    await syncUserProfile(result.user);
  };

  const handleEmailSignIn = async (email: string, pass: string) => {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    await syncUserProfile(result.user);
  };

  const handleEmailSignUp = async (email: string, pass: string, displayName?: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    await syncUserProfile({
      uid: result.user.uid,
      email: result.user.email,
      displayName: displayName || email.split('@')[0],
      photoURL: null,
    });
  };

  const handleLogout = async () => {
    await signOut(auth);
    setProfile(null);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
