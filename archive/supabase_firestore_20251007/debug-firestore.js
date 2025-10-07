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
          // accept either FIREBASE_SERVICE_ACCOUNT (raw JSON) or FIREBASE_SERVICE_ACCOUNT_B64 (base64-encoded JSON)
          const raw = process.env.FIREBASE_SERVICE_ACCOUNT_B64 ? Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8') : process.env.FIREBASE_SERVICE_ACCOUNT;
          if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT not set (or FIREBASE_SERVICE_ACCOUNT_B64)');
          const svc = JSON.parse(raw);
          // capture non-sensitive metadata for debugging
          saMeta = { project_id: svc.project_id || null, client_email: svc.client_email || null };
          admin.initializeApp({ credential: admin.credential.cert(svc) });
        }
        initialized = true;
      } catch (err) {
        initError = String(err && err.message ? err.message : err);
      }
    }

    // optional test write when ?test=1 is provided
    const query = (event && event.queryStringParameters) || {};
    if (query.test === '1' && initialized) {
      try {
        const db = (await import('firebase-admin')).default.firestore();
        const ref = await db.collection('debug_test').add({ ts: new Date().toISOString(), note: 'debug test' });
        return { statusCode: 200, body: JSON.stringify({ ok: true, serviceAccount: saMeta, testDocId: ref.id }) };
      } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ ok: false, error: String(err && err.message ? err.message : err) }) };
      }
    }

    return { statusCode: 200, body: JSON.stringify({ useFirestoreEnv, initialized, initError, serviceAccount: saMeta }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
