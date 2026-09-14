import { readFile, writeFile } from 'node:fs/promises';
import { healthOpenApi } from '@dealith/contracts';
const path = new URL('../docs/contracts/platform.openapi.json', import.meta.url);
const content = JSON.stringify(healthOpenApi, null, 2) + '\n';
if (process.argv.includes('--check')) {
  if ((await readFile(path, 'utf8')) !== content)
    throw new Error('Contract snapshot is stale; run pnpm contracts:generate');
  console.log('Platform OpenAPI snapshot: PASS');
} else await writeFile(path, content);
