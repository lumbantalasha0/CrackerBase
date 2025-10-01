#!/usr/bin/env ts-node
import fs from 'fs';
import path from 'path';
import { db, initialized } from '../firebase';

if (!initialized || !db) {
  console.error('Firestore is not initialized. Set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS and restart.');
  process.exit(2);
}

// db is guaranteed to be non-null here because of the guard above
const firestore = db!;

const STORAGE_PATH = path.resolve(process.cwd(), 'data', 'storage.json');

type StorageFile = Record<string, any>;

function usage() {
  console.log('Usage: migrate-to-firestore.ts [--dry-run] [--confirm]');
}

async function importCollection(col: string, items: any[], dryRun: boolean, continueOnError: boolean, failures: Array<{ collection: string; id?: string; error: any }>) {
  if (!items || items.length === 0) return;
  console.log(`Importing ${items.length} items to ${col}`);
  for (const item of items) {
  const id = item.id ? String(item.id) : undefined;
  const docRef = id ? firestore.collection(col).doc(id) : firestore.collection(col).doc();
    const payload = { ...item };
    delete payload.id;
    payload._migratedAt = new Date().toISOString();

    try {
      if (dryRun) {
        console.log('[dry-run] would write', col, docRef.id, payload);
      } else {
        await docRef.set(payload, { merge: true });
        console.log('wrote', col, docRef.id);
      }
    } catch (err: any) {
      console.error(`Error writing ${col} ${docRef.id}:`, err && err.message ? err.message : err);
      failures.push({ collection: col, id: docRef.id, error: err });
      if (!continueOnError) throw err;
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-n');
  const confirm = args.includes('--confirm');
  const continueOnError = args.includes('--continue-on-error') || args.includes('-k');

  const failures: Array<{ collection: string; id?: string; error: any }> = [];

  if (!fs.existsSync(STORAGE_PATH)) {
    console.error('No storage.json found at', STORAGE_PATH);
    process.exit(1);
  }

  const raw = fs.readFileSync(STORAGE_PATH, 'utf8');
  const data: StorageFile = JSON.parse(raw || '{}');

  console.log('storage.json keys:', Object.keys(data));

  if (dryRun) console.log('Running in dry-run mode (no writes).');
  if (!dryRun && !confirm) {
    console.error('Not confirmed. Re-run with --confirm to perform writes (or use --dry-run).');
    process.exit(3);
  }

  // Map keys to collections
  await importCollection('customers', data.customers || [], dryRun, continueOnError, failures);
  await importCollection('sales', data.sales || [], dryRun, continueOnError, failures);
  await importCollection('expenses', data.expenses || [], dryRun, continueOnError, failures);
  await importCollection('inventoryMovements', data.inventoryMovements || [], dryRun, continueOnError, failures);
  await importCollection('ingredients', data.ingredients || [], dryRun, continueOnError, failures);
  await importCollection('expenseCategories', data.expenseCategories || [], dryRun, continueOnError, failures);

  // settings are an object of key => value
  if (data.settings) {
    const entries = Object.entries(data.settings);
    console.log(`Importing ${entries.length} settings`);
    for (const [k, v] of entries) {
      try {
        if (dryRun) console.log('[dry-run] would write settings', k, v);
  else await firestore.collection('settings').doc(k).set({ value: String(v) }, { merge: true });
      } catch (err: any) {
        console.error('Error writing settings', k, err && err.message ? err.message : err);
        if (!continueOnError) throw err;
        failures.push({ collection: 'settings', id: k, error: err });
      }
    }
  }

  if (failures.length > 0) {
    console.error('Migration completed with failures:', failures.map((f) => ({ collection: f.collection, id: f.id, error: f.error && f.error.message ? f.error.message : f.error })));
    process.exit(4);
  }

  console.log('Migration finished.');
}

main().catch((err) => { console.error(err); process.exit(1); });
