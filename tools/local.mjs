import { spawn } from 'node:child_process';
import { createTestEnvironment, command } from './test-environment.mjs';
const base = Number(process.env.LOCAL_PORT_BASE ?? 3000);
if (!Number.isInteger(base) || base < 1024 || base > 64534)
  throw new Error('Invalid local port base');
await command('pnpm', ['db:generate']);
await command('pnpm', ['build:packages']);
const context = await createTestEnvironment();
console.log(
  `Disposable local foundation: web http://localhost:${base}, admin http://localhost:${base + 1}. API ${base + 1000}, worker ${base + 1001}. Data is removed when this session stops. Services: ${context.directory}`,
);
const child = spawn(process.execPath, ['--env-file-if-exists=.env', 'tools/dev.mjs'], {
  env: {
    ...context.environment,
    APP_ENV: 'local',
    WEB_PORT: String(base),
    ADMIN_PORT: String(base + 1),
    API_PORT: String(base + 1000),
    WORKER_PORT: String(base + 1001),
    WEB_ORIGIN: `http://localhost:${base}`,
    ADMIN_ORIGIN: `http://localhost:${base + 1}`,
    WORKER_INTERNAL_ORIGIN: `http://127.0.0.1:${base + 1001}`,
    API_INTERNAL_ORIGIN: `http://127.0.0.1:${base + 1000}`,
  },
  stdio: 'inherit',
  detached: process.platform !== 'win32',
});
let stopping = false;
const stop = () => {
  if (stopping) return;
  stopping = true;
  if (process.platform === 'win32') child.kill('SIGTERM');
  else if (child.pid) {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      /* Already stopped. */
    }
  }
};
// Terminal and package-manager forwarding can deliver the same signal repeatedly.
// Keep the idempotent handlers installed until service cleanup has completed.
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
try {
  process.exitCode = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code) => resolve(code ?? 1));
  });
} finally {
  await context.cleanup();
}
