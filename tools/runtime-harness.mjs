import { spawn } from 'node:child_process';
import { availablePort, createTestEnvironment } from './test-environment.mjs';
export async function startFoundation(fixedPorts) {
  const context = await createTestEnvironment();
  const children = [];
  let closed = false;
  const close = async () => {
    if (closed) return;
    closed = true;
    const results = await Promise.allSettled(
      children.map(async (child) => {
        if (child.exitCode !== null || child.signalCode !== null) return;
        const ended = new Promise((resolve) => child.once('exit', resolve));
        child.kill('SIGTERM');
        let timer;
        try {
          await Promise.race([
            ended,
            new Promise((_, reject) => {
              timer = setTimeout(() => {
                child.kill('SIGKILL');
                reject(new Error('Runtime did not stop gracefully'));
              }, 12000);
            }),
          ]);
        } finally {
          clearTimeout(timer);
        }
      }),
    );
    await context.cleanup();
    if (results.some((result) => result.status === 'rejected'))
      throw new Error('Runtime cleanup failed');
  };
  try {
    const ports = fixedPorts ?? [];
    while (ports.length < 4) {
      const port = await availablePort();
      if (!ports.includes(port)) ports.push(port);
    }
    const [webPort, adminPort, apiPort, workerPort] = ports;
    const web = `http://127.0.0.1:${webPort}`,
      admin = `http://127.0.0.1:${adminPort}`;
    const api = `http://127.0.0.1:${apiPort}`,
      worker = `http://127.0.0.1:${workerPort}`;
    const environment = {
      ...context.environment,
      WEB_PORT: String(webPort),
      ADMIN_PORT: String(adminPort),
      API_PORT: String(apiPort),
      WORKER_PORT: String(workerPort),
      WEB_ORIGIN: web,
      ADMIN_ORIGIN: admin,
      API_INTERNAL_ORIGIN: api,
      WORKER_INTERNAL_ORIGIN: worker,
    };
    let failed = false;
    for (const [name, args] of [
      ['api', ['apps/api/dist/main.js']],
      ['worker', ['apps/worker/dist/main.js']],
      ['web', ['tools/start-next.mjs', 'web', String(webPort)]],
      ['admin', ['tools/start-next.mjs', 'admin', String(adminPort)]],
    ]) {
      const child = spawn(process.execPath, args, {
        env: environment,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      child.output = '';
      for (const stream of [child.stdout, child.stderr])
        stream.on('data', (chunk) => {
          child.output = (child.output + chunk).slice(-10000);
        });
      child.on('error', () => {
        failed = true;
      });
      child.on('exit', () => {
        if (!closed) failed = true;
      });
      child.runtimeName = name;
      children.push(child);
    }
    for (const url of [api + '/api/v1/readiness', worker + '/health/ready', web, admin]) {
      const deadline = Date.now() + 30000;
      let ready = false;
      while (!ready && Date.now() < deadline && !failed) {
        try {
          ready = (await fetch(url, { signal: AbortSignal.timeout(1000) })).ok;
        } catch {
          /* Probe retries have a fixed deadline. */
        }
        if (!ready) await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (!ready) throw new Error('Foundation startup failed; verify ports and build artifacts');
    }
    return { close, web, admin, api, worker, environment, children, context };
  } catch (error) {
    for (const child of children)
      process.stderr.write(
        `${child.runtimeName}: ${child.output.replace(/(?:postgresql|postgres|rediss?):\/\/\S+/g, '[redacted connection]')}\n`,
      );
    await close();
    throw error;
  }
}
