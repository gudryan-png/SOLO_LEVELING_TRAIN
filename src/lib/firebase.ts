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
        // Use a longer exponential backoff for offline errors
        await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, i)));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
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
