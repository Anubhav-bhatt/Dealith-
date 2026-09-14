import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join, resolve } from 'node:path';
import test from 'node:test';

const names = ['api', 'worker', 'web', 'admin'];
const root = resolve(import.meta.dirname, '..');
const descendant = `
  const { writeFileSync } = require('node:fs');
  const { join } = require('node:path');
  const directory = process.env.DEALITH_DEV_TEST_DIRECTORY;
  const name = process.env.DEALITH_DEV_TEST_NAME;
  process.on('SIGTERM', () => setTimeout(() => {
    writeFileSync(join(directory, name + '.stopped'), 'stopped');
    process.exit(0);
  }, 150));
  setInterval(() => {}, 1000);
  writeFileSync(join(directory, name + '.ready'), String(process.pid));
`;
const wrapper = `#!/usr/bin/env node
const { spawn } = require('node:child_process');
const { existsSync, readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const directory = process.env.DEALITH_DEV_TEST_DIRECTORY;
const name = process.argv[2].replace('dev:', '');
const child = spawn(process.execPath, ['-e', ${JSON.stringify(descendant)}], {
  env: { ...process.env, DEALITH_DEV_TEST_NAME: name }, stdio: 'ignore'
});
writeFileSync(join(directory, name + '.json'), JSON.stringify([process.pid, child.pid]));
setInterval(() => {
  const trigger = join(directory, 'exit-' + name);
  if (existsSync(trigger)) process.exit(Number(readFileSync(trigger, 'utf8')));
}, 20);
`;

async function until(check, label) {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(`Timed out: ${label}`);
}

async function fixture(run) {
  const directory = await mkdtemp(join(tmpdir(), 'dealith-dev-test-'));
  await writeFile(join(directory, 'pnpm'), wrapper, { mode: 0o755 });
  const child = spawn(process.execPath, ['tools/dev.mjs'], {
    cwd: root,
    env: {
      ...process.env,
      PATH: directory + delimiter + process.env.PATH,
      DEALITH_DEV_TEST_DIRECTORY: directory,
    },
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  for (const stream of [child.stdout, child.stderr])
    stream.on('data', (chunk) => {
      output = (output + chunk).slice(-10000);
    });
  const exited = new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve({ code, signal }));
  });
  try {
    await until(async () => {
      const files = await readdir(directory);
      return names.every((name) => files.includes(name + '.ready'));
    }, 'all simulated app descendants start');
    try {
      await run({ child, directory, exited });
    } catch (error) {
      throw new Error('Supervisor output: ' + output, { cause: error });
    }
    const files = await readdir(directory);
    assert.ok(
      names.every((name) => files.includes(name + '.stopped')),
      'the supervisor waits for every app descendant to handle shutdown',
    );
  } finally {
    try {
      process.kill(-child.pid, 'SIGKILL');
    } catch {
      /* The supervisor process group has already stopped. */
    }
    for (const file of (await readdir(directory)).filter((name) => name.endsWith('.json'))) {
      for (const pid of JSON.parse(await readFile(join(directory, file), 'utf8'))) {
        try {
          process.kill(pid, 'SIGKILL');
        } catch {
          /* The app process has already stopped. */
        }
      }
    }
    await exited;
    await rm(directory, { recursive: true, force: true });
  }
}

for (const code of [0, 23]) {
  test(
    `unexpected app exit ${code} fails and stops sibling process trees`,
    { skip: process.platform === 'win32', timeout: 10000 },
    () =>
      fixture(async ({ directory, exited }) => {
        await writeFile(join(directory, 'exit-api'), String(code));
        assert.deepEqual(await exited, { code: code || 1, signal: null });
      }),
  );
}

test(
  'repeated Ctrl-C waits for every app process tree and exits successfully',
  { skip: process.platform === 'win32', timeout: 10000 },
  () =>
    fixture(async ({ child, exited }) => {
      child.kill('SIGINT');
      await new Promise((resolve) => setTimeout(resolve, 50));
      child.kill('SIGINT');
      assert.deepEqual(await exited, { code: 0, signal: null });
    }),
);
