import fs from 'fs';

export const handler = async function (event, context) {
  try {
    const commit = process.env.COMMIT_REF || process.env.REPOSITORY_COMMIT || null;
    let trigger = null;
    try {
      trigger = fs.readFileSync('./.netlify-deploy-trigger', 'utf8');
    } catch (e) {
      // ignore
    }
    return { statusCode: 200, body: JSON.stringify({ commit, trigger }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
