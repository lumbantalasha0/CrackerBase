import { handler } from '../netlify/functions/customers.js';

async function test() {
  const event = {
    httpMethod: 'POST',
    body: JSON.stringify({ name: 'Acme Corp', phone: '555-1212', location: 'Warehouse B' })
  };
  const res = await handler(event, {});
  console.log('STATUS', res.statusCode);
  console.log('BODY', res.body);
}

test().catch(err => console.error(err));
