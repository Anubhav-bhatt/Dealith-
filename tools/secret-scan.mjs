import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const skip = new Set([
  '.git',
  'node_modules',
  '.pnpm-store',
  '.next',
  'dist',
  'generated',
  'test-results',
  'playwright-report',
  '__pycache__',
  '.local',
  '.DS_Store',
]);
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bAKIA[A-Z0-9]{16}\b/,
  /\bgh[pousr]_[A-Za-z0-9]{36,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{60,}\b/,
  /\bsk_live_[A-Za-z0-9]{20,}\b/,
];
const findings = [];
let checked = 0;
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (skip.has(entry.name) || entry.name.endsWith('.tsbuildinfo')) continue;
    const file = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(file);
      continue;
    }
    if (!entry.isFile() || file === import.meta.filename) continue;
    const body = await readFile(file, 'utf8');
    checked++;
    if (patterns.some((pattern) => pattern.test(body))) findings.push(relative(root, file));
    if (
      /\.(ts|tsx|mjs|json|ya?ml)$/.test(file) &&
      !file.includes('/docs/') &&
      /\/Users\/[^/\s]+\//.test(body)
    )
      findings.push(relative(root, file) + ' (personal absolute path)');
  }
}
await walk(root);
if (findings.length) {
  console.error('Potential credentials or personal machine paths in: ' + findings.join(', '));
  process.exitCode = 1;
} else
  console.log(
    `Secret/path signature scan: PASS (${checked} source/config/document files; synthetic local credentials reviewed separately)`,
  );
