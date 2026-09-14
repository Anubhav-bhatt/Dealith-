import { performance } from 'node:perf_hooks';
import { mkdir, writeFile } from 'node:fs/promises';
import { startFoundation } from './runtime-harness.mjs';
const runtime = await startFoundation();
try {
  const results = [];
  for (const path of ['/api/v1/health', '/api/v1/readiness']) {
    for (let i = 0; i < 20; i++) await (await fetch(runtime.api + path)).arrayBuffer();
    const samples = [];
    let failures = 0;
    await Promise.all(
      Array.from({ length: 5 }, async () => {
        for (let i = 0; i < 40; i++) {
          const started = performance.now();
          const response = await fetch(runtime.api + path, { signal: AbortSignal.timeout(10000) });
          await response.arrayBuffer();
          if (!response.ok) failures++;
          samples.push(performance.now() - started);
        }
      }),
    );
    samples.sort((a, b) => a - b);
    results.push({
      path,
      samples: samples.length,
      concurrency: 5,
      p50Ms: samples[Math.ceil(samples.length * 0.5) - 1],
      p95Ms: samples[Math.ceil(samples.length * 0.95) - 1],
      failures,
    });
  }
  await mkdir('test-results/foundation', { recursive: true });
  const report = {
    measuredAt: new Date().toISOString(),
    node: process.version,
    platform: `${process.platform}/${process.arch}`,
    scope: 'Loopback baseline only; not production performance certification',
    results,
  };
  await writeFile('test-results/foundation/benchmark.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
  if (results.some((result) => result.failures)) process.exitCode = 1;
} finally {
  await runtime.close();
}
