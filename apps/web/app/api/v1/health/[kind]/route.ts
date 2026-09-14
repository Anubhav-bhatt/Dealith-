import { healthResponse, errorResponse } from '@dealith/contracts';
export const dynamic = 'force-dynamic';
export async function GET(_: Request, context: { params: Promise<{ kind: string }> }) {
  const { kind } = await context.params;
  const headers = { 'Cache-Control': 'private, no-store' };
  const failed = (status: 404 | 503) =>
    Response.json(
      {
        error: {
          code: status === 404 ? 'NOT_FOUND' : 'TEMPORARILY_UNAVAILABLE',
          message:
            status === 404
              ? 'The requested resource was not found.'
              : 'This service is temporarily unavailable. Please try again.',
          requestId: crypto.randomUUID(),
          fieldErrors: [],
          retryable: status === 503,
        },
      },
      { status, headers },
    );
  if (!['live', 'ready', 'worker'].includes(kind)) return failed(404);
  try {
    const configured =
      kind === 'worker' ? process.env.WORKER_INTERNAL_ORIGIN : process.env.API_INTERNAL_ORIGIN;
    if (!configured) return failed(503);
    const origin = new URL(configured);
    if (
      !['http:', 'https:'].includes(origin.protocol) ||
      origin.username ||
      origin.password ||
      origin.pathname !== '/' ||
      origin.search ||
      origin.hash
    )
      return failed(503);
    const response = await fetch(
      new URL(kind === 'worker' ? '/health/ready' : `/api/v1/health/${kind}`, origin),
      {
        cache: 'no-store',
        signal: AbortSignal.timeout(3000),
        headers: { Accept: 'application/json' },
      },
    );
    const payload: unknown = await response.json();
    if (response.status === 200) return Response.json(healthResponse.parse(payload), { headers });
    if (response.status === 503)
      return Response.json(errorResponse.parse(payload), { status: 503, headers });
    return failed(503);
  } catch {
    return failed(503);
  }
}
