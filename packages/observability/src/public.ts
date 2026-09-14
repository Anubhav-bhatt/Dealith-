export type PublicMetric = { name: 'page.load'; durationMs: number };
export function publicMetric(durationMs: number): PublicMetric | undefined {
  return Number.isFinite(durationMs) && durationMs >= 0
    ? { name: 'page.load', durationMs }
    : undefined;
}
