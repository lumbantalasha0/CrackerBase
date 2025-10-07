#!/usr/bin/env ts-node
import fetch from 'node-fetch';

const base = process.env.BASE_URL || 'http://localhost:5000';

async function run() {
  console.log('Running smoke tests against', base);

  // Create a customer
  const custRes = await fetch(`${base}/api/customers`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'MIGRATION TEST' }) });
  console.log('customers POST', custRes.status);
  const cust = await custRes.json().catch(()=>null);
  console.log('customer', cust);

  // Create an expense
  const expRes = await fetch(`${base}/api/expenses`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ categoryId: 1, amount: 12.5, description: 'smoke test' }) });
  console.log('expenses POST', expRes.status);
  const expense = await expRes.json().catch(()=>null);
  console.log('expense', expense);

  // Create a sale (send required fields: quantity and pricePerUnit)
  const salePayload = {
    customerId: cust?.id ?? undefined,
    customerName: cust?.name ?? 'MIGRATION TEST',
    quantity: 1,
    pricePerUnit: 10,
  };
  const saleRes = await fetch(`${base}/api/sales`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(salePayload) });
  console.log('sales POST', saleRes.status);
  const sale = await saleRes.json().catch(()=>null);
  console.log('sale', sale);
}

run().catch((e)=>{ console.error(e); process.exit(1); });
