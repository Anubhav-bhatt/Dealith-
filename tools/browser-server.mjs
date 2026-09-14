import { startFoundation } from './runtime-harness.mjs';
const runtime = await startFoundation([3100, 3101, 4100, 4101]);
console.log('Browser certification: real API, worker, PostgreSQL and Redis ready');
let closing = false;
for (const signal of ['SIGTERM', 'SIGINT'])
  process.on(signal, () => {
    if (closing) return;
    closing = true;
    void runtime.close().catch(() => {
      process.exitCode = 1;
    });
  });
