#!/usr/bin/env node
import { predictTrends } from './trends.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--start') opts.start = args[++i];
    else if (a === '--end') opts.end = args[++i];
    else if (a === '--granularity') opts.granularity = args[++i];
    else if (a === '--horizon') opts.horizon = Number(args[++i]);
    else if (a === '--method') opts.method = args[++i];
    else if (a === '--min-history') opts.minHistory = Number(args[++i]);
    else if (a === '--output') opts.output = args[++i];
    else if (a === '--store-db') opts.storeDb = true;
    else if (a === '--notify') opts.notify = true;
    else if (a.startsWith('--threshold-increase')) opts.thresholds = opts.thresholds || {}, opts.thresholds.increase = Number(args[++i]);
    else if (a.startsWith('--threshold-decrease')) opts.thresholds = opts.thresholds || {}, opts.thresholds.decrease = Number(args[++i]);
  }
  return opts;
}

async function main() {
  const opts = parseArgs();
  const out = await predictTrends(opts);
  if (opts.output) {
    await import('fs/promises').then(m => m.writeFile(opts.output, JSON.stringify(out, null, 2), 'utf8'));
  }
  console.log(JSON.stringify(out, null, 2));
}

main().catch(e => {
  console.error('predict-trends error', e);
  process.exit(1);
});
