import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  experimentalAutoDetectLongPolling: false,
}, firebaseConfig.firestoreDatabaseId);

/**
 * Robust wrapper for Firestore operations that retries on "offline" errors
 */
export async function withFirestoreRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (err: any) {
      lastError = err;
      const isOfflineError = err.message?.includes('offline') || err.code === 'unavailable';
      if (isOfflineError && i < maxRetries - 1) {
        console.warn(`Firestore offline, retry ${i + 1}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, i)));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error details: ', JSON.stringify(errInfo));
  // Not throwing to avoid breaking entire app if a background listener fails, 
  // but enough for the agent to see in logs.
}

async function testConnection() {
  try {
    // Wait a bit before testing connection to let firestore init
    await new Promise(resolve => setTimeout(resolve, 1000));
    await getDocFromServer(doc(db, 'test', 'connection')).catch(() => {
      // Quietly fail if test fails, just log it
      console.log("Firestore latent connection check failed, will retry on use.");
    });
  } catch (error) {
    // Ignore offline errors during boot
  }
}
testConnection();
