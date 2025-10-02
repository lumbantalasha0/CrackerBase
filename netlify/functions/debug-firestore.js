export const handler = async function (event, context) {
  try {
    const useFirestoreEnv = process.env.USE_FIRESTORE === '1';
    let initialized = false;
    let initError = null;
    let saMeta = null;
    if (useFirestoreEnv) {
      try {
        const adminMod = await import('firebase-admin');
        const admin = adminMod.default || adminMod;
        if (!admin.apps || admin.apps.length === 0) {
          if (!process.env.FIREBASE_SERVICE_ACCOUNT) throw new Error('FIREBASE_SERVICE_ACCOUNT not set');
          const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
          // capture non-sensitive metadata for debugging
          saMeta = { project_id: svc.project_id || null, client_email: svc.client_email || null };
          admin.initializeApp({ credential: admin.credential.cert(svc) });
        }
        initialized = true;
      } catch (err) {
        initError = String(err && err.message ? err.message : err);
      }
    }

  return { statusCode: 200, body: JSON.stringify({ useFirestoreEnv, initialized, initError, serviceAccount: saMeta }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
