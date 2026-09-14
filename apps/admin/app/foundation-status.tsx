'use client';
import { useEffect, useRef, useState } from 'react';
import { Button, Card, StatusList, type StatusRow } from '@dealith/ui';
import { readHealth } from '../lib/api-client';

type ProbeState = 'CHECKING' | 'READY' | 'UNAVAILABLE';
export default function FoundationStatus() {
  const [api, setApi] = useState<ProbeState>('CHECKING');
  const [worker, setWorker] = useState<ProbeState>('CHECKING');
  const [busy, setBusy] = useState(true);
  const pending = useRef<AbortController | null>(null);

  async function check() {
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    setApi('CHECKING');
    setWorker('CHECKING');
    const probe = async (path: Parameters<typeof readHealth>[0]): Promise<ProbeState> => {
      try {
        await readHealth(path, controller.signal);
        return 'READY';
      } catch {
        return 'UNAVAILABLE';
      }
    };
    const [apiResult, workerResult] = await Promise.all([
      probe('/api/v1/health/ready'),
      probe('/api/v1/health/worker'),
    ]);
    if (controller.signal.aborted) return;
    setApi(apiResult);
    setWorker(workerResult);
    setBusy(false);
  }
  useEffect(() => {
    void check();
    return () => pending.current?.abort();
  }, []);

  const rows: StatusRow[] = [
    { label: 'Admin runtime', value: 'READY', tone: 'success' },
    {
      label: 'API',
      value: api,
      tone: api === 'READY' ? 'success' : api === 'UNAVAILABLE' ? 'danger' : 'neutral',
    },
    {
      label: 'Database',
      value: api === 'READY' ? 'READY' : 'UNKNOWN',
      tone: api === 'READY' ? 'success' : 'neutral',
    },
    {
      label: 'Redis',
      value: api === 'READY' ? 'READY' : 'UNKNOWN',
      tone: api === 'READY' ? 'success' : 'neutral',
    },
    {
      label: 'Worker',
      value: worker,
      tone: worker === 'READY' ? 'success' : worker === 'UNAVAILABLE' ? 'danger' : 'neutral',
    },
  ];
  return (
    <Card aria-labelledby="foundation-status-heading">
      <h2 id="foundation-status-heading">Foundation status</h2>
      <StatusList rows={rows} />
      <Button disabled={busy} onClick={() => void check()}>
        {busy ? 'Checking…' : 'Refresh checks'}
      </Button>
      <p role="status" className="status-note">
        {busy
          ? 'Checking service readiness…'
          : api === 'UNAVAILABLE' || worker === 'UNAVAILABLE'
            ? 'A service could not confirm readiness. Check local services and retry.'
            : 'All displayed checks have confirmed readiness.'}
      </p>
      <p className="status-explanation">
        Database and Redis are confirmed by the API readiness check. These checks describe current
        service readiness, not production certification.
      </p>
    </Card>
  );
}
