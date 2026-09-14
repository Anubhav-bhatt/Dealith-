import { cp, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const name = process.argv[2];
if (!['web', 'admin'].includes(name)) throw new Error('Unknown web application');
const root = resolve(import.meta.dirname, '..');
const app = resolve(root, 'apps', name);
const destination = resolve(app, '.next/standalone/apps', name, '.next/static');
await mkdir(destination, { recursive: true });
await cp(resolve(app, '.next/static'), destination, { recursive: true });
