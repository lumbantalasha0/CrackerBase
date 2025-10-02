import { initialized } from '../../server/firebase.js';

export const handler = async function (event, context) {
  try {
    const useFirestoreEnv = process.env.USE_FIRESTORE === '1';
    return { statusCode: 200, body: JSON.stringify({ initialized: Boolean(initialized), useFirestoreEnv }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
