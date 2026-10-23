import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot as mandated by skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'builder';
  createdAt: string;
  updatedAt?: string;
}

export interface ActivityLog {
  logId: string;
  userId: string;
  userEmail: string;
  action: string;
  details?: Record<string, any>;
  createdAt: string;
}

/**
 * Creates or synchronizes user profile in Firestore
 * Enforces anti-privilege escalation by strictly assigning 'builder' role
 */
export async function syncUserProfile(user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null }): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const now = new Date().toISOString();
  
  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      const newUser: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'Vibe Builder',
        photoURL: user.photoURL || '',
        role: 'builder',
        createdAt: now,
      };
      await setDoc(userRef, newUser);
      await logUserActivity('user_signup', { email: user.email, displayName: newUser.displayName });
      return newUser;
    } else {
      const existing = snap.data() as UserProfile;
      const updatedUser: UserProfile = {
        ...existing,
        displayName: user.displayName || existing.displayName,
        photoURL: user.photoURL || existing.photoURL,
        email: user.email || existing.email,
        role: 'builder',
        updatedAt: now,
      };
      await setDoc(userRef, updatedUser, { merge: true });
      await logUserActivity('user_login', { email: user.email });
      return updatedUser;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
  }
}

/**
 * Log user actions for admin monitoring
 */
export async function logUserActivity(action: string, details?: Record<string, any>): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const logRef = doc(db, 'activity_logs', logId);

  const payload: ActivityLog = {
    logId,
    userId: currentUser.uid,
    userEmail: currentUser.email || 'anonymous',
    action,
    details: details || {},
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(logRef, payload);
  } catch (err) {
    console.warn("Failed to write activity log:", err);
  }
}

/**
 * Admin: Fetch user activity stream
 */
export async function fetchActivityLogs(maxCount = 50): Promise<ActivityLog[]> {
  try {
    const logsRef = collection(db, 'activity_logs');
    const q = query(logsRef, orderBy('createdAt', 'desc'), limit(maxCount));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as ActivityLog);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'activity_logs');
  }
}

/**
 * Admin: Fetch registered users directory
 */
export async function fetchAllUsersForAdmin(): Promise<UserProfile[]> {
  try {
    const usersRef = collection(db, 'users');
    const snap = await getDocs(usersRef);
    return snap.docs.map(d => d.data() as UserProfile);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
  }
}

export async function loginWithGoogle(): Promise<UserProfile> {
  const result = await signInWithPopup(auth, googleProvider);
  return await syncUserProfile(result.user);
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}
