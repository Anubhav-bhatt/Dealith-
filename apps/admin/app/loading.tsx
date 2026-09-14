import { Skeleton } from '@dealith/ui';
export default function Loading() {
  return (
    <main id="main" aria-busy="true">
      <p role="status">Loading foundation…</p>
      <Skeleton />
    </main>
  );
}
