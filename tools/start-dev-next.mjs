import { readWebRuntimeConfig } from '@dealith/config/runtime';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
if (existsSync('.env')) process.loadEnvFile('.env');
readWebRuntimeConfig(process.env);
const name = process.argv[2];
if (!['web', 'admin'].includes(name)) throw new Error('Unknown web application');
const port = Number(
  process.env[name === 'web' ? 'WEB_PORT' : 'ADMIN_PORT'] ?? (name === 'web' ? 3000 : 3001),
);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error('Invalid application port');
const app = resolve(import.meta.dirname, '../apps', name);
const cli = resolve(app, 'node_modules/next/dist/bin/next');
process.argv = [
  process.execPath,
  cli,
  'dev',
  app,
  '--hostname',
  '127.0.0.1',
  '--port',
  String(port),
];
await import(pathToFileURL(cli).href);
