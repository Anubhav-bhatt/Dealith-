import { healthResponse, type HealthResponse } from '@dealith/contracts';

type HealthPath = '/api/v1/health/ready' | '/api/v1/health/worker';

/** Same-origin, bounded read transport. Raw upstream messages never reach the UI. */
export async function readHealth(path: HealthPath, signal: AbortSignal): Promise<HealthResponse> {
  const response = await fetch(path, {
    cache: 'no-store',
    credentials: 'same-origin',
    redirect: 'error',
    headers: { Accept: 'application/json' },
    signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]),
  });
  if (!response.ok) throw new Error('Service readiness unavailable');
  const result = healthResponse.parse(await response.json());
  const expectedService = path === '/api/v1/health/worker' ? 'worker' : 'api';
  if (result.data.status !== 'ready' || result.data.service !== expectedService)
    throw new Error('Service readiness unavailable');
  if (
    expectedService === 'api' &&
    (result.data.checks?.database !== 'up' || result.data.checks.redis !== 'up')
  )
    throw new Error('Service readiness unavailable');
  return result;
}
