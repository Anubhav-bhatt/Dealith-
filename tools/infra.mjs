import { spawn } from 'node:child_process';
const operation = process.argv[2];
if (!['up', 'down'].includes(operation)) throw new Error('Use infra:up or infra:down');
const args =
  operation === 'up' ? ['compose', 'up', '-d', '--wait', 'postgres', 'redis'] : ['compose', 'down'];
const child = spawn('docker', args, { stdio: 'inherit' });
child.on('error', () => {
  console.error(
    'Docker with Compose is required. Install/start it, or use the documented native pnpm dev:local workflow.',
  );
  process.exitCode = 1;
});
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
// No -v: stopping infrastructure preserves persistent volumes.
