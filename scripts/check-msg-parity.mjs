// Message parity checker: key sets of en.json vs ar.json must match exactly.
import { readFileSync } from 'node:fs';

function keyPaths(obj, prefix = '') {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) out.push(...keyPaths(v, p));
    else out.push(p);
  }
  return out;
}

const en = new Set(keyPaths(JSON.parse(readFileSync('messages/en.json', 'utf8'))));
const ar = new Set(keyPaths(JSON.parse(readFileSync('messages/ar.json', 'utf8'))));

const missingInAr = [...en].filter((k) => !ar.has(k));
const missingInEn = [...ar].filter((k) => !en.has(k));

console.log(`en keys: ${en.size}, ar keys: ${ar.size}`);
console.log(`missing in ar.json: ${missingInAr.length}`);
missingInAr.forEach((k) => console.log('  -', k));
console.log(`missing in en.json: ${missingInEn.length}`);
missingInEn.forEach((k) => console.log('  -', k));

if (missingInAr.length || missingInEn.length) process.exit(1);
console.log('PARITY OK');
