import { createTestEnvironment, command } from './test-environment.mjs';
const context = await createTestEnvironment();
try {
  console.log('Isolated PostgreSQL migration and restricted runtime role: ready');
  console.log(
    await command(
      'pnpm',
      ['exec', 'vitest', 'run', '--project', 'integration'],
      context.environment,
    ),
  );
} finally {
  await context.cleanup();
}
