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
  accountStatus?: 'active' | 'pending_deletion';
  deletionRequestedAt?: string | null;
  gracePeriodEndsAt?: string | null;
  scheduledHardDeleteAt?: string | null;
  cookieConsent?: any;
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

/**
 * GDPR Data Portability & Access (Article 15/20):
 * Securely exports all user scans, action items, and account profile
 */
export async function exportUserData(userId: string): Promise<Record<string, any>> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    throw new Error('IDOR Protection: Cannot export data belonging to another user.');
  }

  try {
    const userSnap = await getDoc(doc(db, 'users', userId));
    const scansSnap = await getDocs(collection(db, 'users', userId, 'scans'));
    const actionsSnap = await getDocs(collection(db, 'users', userId, 'actionItems'));

    const exportBundle = {
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        userId,
        standard: 'GDPR Article 15/20 & CCPA Data Portability Export',
        legalRetentionPolicy: 'Data retention active up to 45 days after verified deletion request fulfillment.',
      },
      profile: userSnap.data() || null,
      scans: scansSnap.docs.map((d) => d.data()),
      actions: actionsSnap.docs.map((d) => d.data()),
    };

    await logUserActivity('gdpr_data_exported', { scanCount: exportBundle.scans.length });
    return exportBundle;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${userId}`);
  }
}

/**
 * GDPR Right to Erasure / Deletion Request (Article 17):
 * Initiates deletion with a 15-day change-of-mind grace period and 45-day hard purge retention schedule.
 */
export async function requestAccountDeletion(userId: string): Promise<{ gracePeriodEndsAt: string; scheduledHardDeleteAt: string }> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    throw new Error('IDOR Protection: Unauthorized deletion request.');
  }

  const now = new Date();
  const gracePeriod = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days
  const scheduledHardDelete = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000); // 45 days

  const userRef = doc(db, 'users', userId);
  try {
    await setDoc(userRef, {
      accountStatus: 'pending_deletion',
      deletionRequestedAt: now.toISOString(),
      gracePeriodEndsAt: gracePeriod.toISOString(),
      scheduledHardDeleteAt: scheduledHardDelete.toISOString(),
      updatedAt: now.toISOString(),
    }, { merge: true });

    await logUserActivity('account_deletion_requested', {
      gracePeriodEndsAt: gracePeriod.toISOString(),
      scheduledHardDeleteAt: scheduledHardDelete.toISOString(),
    });

    return {
      gracePeriodEndsAt: gracePeriod.toISOString(),
      scheduledHardDeleteAt: scheduledHardDelete.toISOString(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
}

/**
 * Cancel Account Deletion within the 15-day grace period
 */
export async function cancelAccountDeletion(userId: string): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    throw new Error('IDOR Protection: Unauthorized deletion cancellation.');
  }

  const userRef = doc(db, 'users', userId);
  try {
    await setDoc(userRef, {
      accountStatus: 'active',
      deletionRequestedAt: null,
      gracePeriodEndsAt: null,
      scheduledHardDeleteAt: null,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    await logUserActivity('account_deletion_cancelled', {});
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
}

/**
 * Delete User Scan History directly
 */
export async function deleteUserScans(userId: string): Promise<number> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    throw new Error('IDOR Protection: Unauthorized scan deletion.');
  }

  const scansRef = collection(db, 'users', userId, 'scans');
  try {
    const snap = await getDocs(scansRef);
    let count = 0;
    const { deleteDoc } = await import('firebase/firestore');
    await Promise.all(
      snap.docs.map(async (docSnap) => {
        await deleteDoc(docSnap.ref);
        count++;
      })
    );

    await logUserActivity('user_scans_deleted', { deletedCount: count });
    return count;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/scans`);
  }
}

/**
 * Admin: Update user profile (tier, prompt limits, status)
 */
export async function adminUpdateUserProfile(userId: string, updates: Record<string, any>): Promise<void> {
  const userRef = doc(db, 'users', userId);
  try {
    await setDoc(userRef, { ...updates, updatedAt: new Date().toISOString() }, { merge: true });
    await logUserActivity('admin_updated_user', { targetUserId: userId, updates });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
}

