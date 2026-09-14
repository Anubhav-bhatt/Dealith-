import { cp, mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { spawn } from 'node:child_process';
const root = resolve(import.meta.dirname, '..');
const destination = await mkdtemp(join(tmpdir(), 'dealith-clean-'));
const excluded = new Set([
  '.git',
  'node_modules',
  '.pnpm-store',
  '.next',
  'dist',
  'test-results',
  'playwright-report',
  '__pycache__',
  '.local',
  '.DS_Store',
]);
const results = [];
async function run(args) {
  console.log(`Clean checkout: pnpm ${args.join(' ')}`);
  const started = Date.now();
  await new Promise((resolveRun, reject) => {
    const child = spawn('pnpm', args, {
      cwd: destination,
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    for (const stream of [child.stdout, child.stderr])
      stream.on('data', (chunk) => {
        output = (output + chunk).slice(-18000);
      });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code !== 0)
        reject(
          new Error(
            output.replace(/(?:postgresql|postgres|rediss?):\/\/\S+/g, '[redacted connection]'),
          ),
        );
      else {
        results.push({
          command: `pnpm ${args.join(' ')}`,
          status: 'PASS',
          durationMs: Date.now() - started,
        });
        resolveRun();
      }
    });
  });
}
try {
  await cp(root, destination, {
    recursive: true,
    filter: (source) => {
      const path = relative(root, source),
        parts = path.split('/');
      if (
        parts.some((part) => excluded.has(part)) ||
        path.includes('packages/backend/src/generated') ||
        path.endsWith('.tsbuildinfo')
      )
        return false;
      return !parts.some((part) => part.startsWith('.env') && part !== '.env.example');
    },
  });
  // Use a fresh package store and metadata cache, so certification does not rely on the developer install.
  await run([
    'install',
    '--frozen-lockfile',
    '--store-dir',
    join(destination, '.pnpm-store'),
    '--cache-dir',
    join(destination, '.pnpm-cache'),
  ]);
  await run(['build']);
  await run(['test']);
  await run(['test:e2e']);
  await run(['test:smoke']);
  console.log(
    'PASS: fresh copied source, clean dependency install, generated client, migrated isolated databases, four-app builds and complete runtime suites',
  );
} finally {
  await mkdir(join(root, 'test-results/foundation'), { recursive: true });
  await writeFile(
    join(root, 'test-results/foundation/clean-install.json'),
    JSON.stringify(
      {
        measuredAt: new Date().toISOString(),
        dependencySource:
          'registry install with fresh package store and metadata cache, frozen lockfile',
        results,
      },
      null,
      2,
    ) + '\n',
  );
  await rm(destination, { recursive: true, force: true });
}
