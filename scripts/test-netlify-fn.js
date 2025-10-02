const inv = require('../netlify/functions/inventory.js');

async function test() {
  const event = {
    httpMethod: 'POST',
    body: JSON.stringify({ type: 'addition', quantity: 10, location: 'Warehouse A', phone: '1234567890' })
  };
  const res = await inv.handler(event, {});
  console.log('STATUS', res.statusCode);
  console.log('BODY', res.body);
}

test().catch(err => console.error(err));
