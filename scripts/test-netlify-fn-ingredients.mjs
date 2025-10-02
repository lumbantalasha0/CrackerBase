import { handler } from '../netlify/functions/ingredients.js';

async function test() {
  console.log('Testing POST /api/ingredients');
  const postEvent = { httpMethod: 'POST', body: JSON.stringify({ name: 'Sugar', multiplier: 0.5 }) };
  const postRes = await handler(postEvent, {});
  console.log('POST STATUS', postRes.statusCode);
  console.log('POST BODY', postRes.body);

  console.log('\nTesting GET /api/ingredients');
  const getRes = await handler({ httpMethod: 'GET' }, {});
  console.log('GET STATUS', getRes.statusCode);
  console.log('GET BODY', getRes.body);
}

test().catch(err => console.error(err));
