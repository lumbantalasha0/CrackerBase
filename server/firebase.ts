import admin from 'firebase-admin';
import fs from 'fs';

let initialized = false;
let db: admin.firestore.Firestore | null = null;

// Try to initialize firebase-admin using either GOOGLE_APPLICATION_CREDENTIALS
// or a FIREBASE_SERVICE_ACCOUNT JSON in environment. This file is intentionally
// permissive: if no credentials are present we won't throw - the server will
// fall back to the existing file-backed MemStorage.
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({ credential: admin.credential.cert(svc) });
    db = admin.firestore();
    initialized = true;
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    // When GOOGLE_APPLICATION_CREDENTIALS is set to a path to a service account JSON
    admin.initializeApp();
    db = admin.firestore();
    initialized = true;
  }
} catch (e) {
  // initialization failed; leave initialized=false and let caller fallback
  // eslint-disable-next-line no-console
  console.error('firebase-admin init failed:', e?.toString?.() || e);
}

export { initialized, db };
