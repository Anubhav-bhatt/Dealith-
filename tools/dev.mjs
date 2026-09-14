import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
const execute = promisify(execFile);
const children = ['api', 'worker', 'web', 'admin'].map((name) =>
  spawn('pnpm', [`dev:${name}`], {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: process.env,
    detached: process.platform !== 'win32',
  }),
);
let stopping = false;
function signal(child, value) {
  if (!child.pid) return;
  if (process.platform === 'win32') child.kill(value);
  else {
    try {
      process.kill(-child.pid, value);
    } catch (error) {
      if (error.code !== 'ESRCH') throw error;
    }
  }
}
async function runningChildren() {
  if (process.platform === 'win32')
    return children.filter(
      (child) => child.pid && child.exitCode === null && child.signalCode === null,
    );
  // Inspect process state as well as group membership: exited descendants may remain
  // as zombies briefly, and probing their group with kill(0) can fail with EPERM.
  const { stdout } = await execute('ps', ['-axo', 'pgid=,stat=']);
  const liveGroups = new Set(
    stdout
      .trim()
      .split('\n')
      .flatMap((line) => {
        const [group, state] = line.trim().split(/\s+/);
        return state && !state.startsWith('Z') ? [Number(group)] : [];
      }),
  );
  return children.filter((child) => liveGroups.has(child.pid));
}
async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  // pnpm and Node watch launch descendants; the wrapper PID is not the app lifetime.
  for (const child of children) signal(child, 'SIGTERM');
  const deadline = Date.now() + 12000;
  let remaining;
  while ((remaining = await runningChildren()).length) {
    if (Date.now() >= deadline) {
      for (const child of remaining) signal(child, 'SIGKILL');
      process.exitCode = code || 1;
      console.error('Development processes exceeded the shutdown deadline');
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}
for (const [index, child] of children.entries()) {
  const name = ['api', 'worker', 'web', 'admin'][index];
  for (const [stream, destination] of [
    [child.stdout, process.stdout],
    [child.stderr, process.stderr],
  ])
    stream.on('data', (chunk) =>
      destination.write(`[${name}] ${String(chunk).replaceAll('\n', `\n[${name}] `).trimEnd()}\n`),
    );
  child.on('error', () => stop(1));
  child.on('exit', (code) => {
    if (!stopping) stop(code || 1);
  });
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
