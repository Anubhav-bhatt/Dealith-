'use client';
import { Button } from '@dealith/ui';
export default function ErrorBoundary({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main id="main">
      <h1>Unable to load the foundation</h1>
      <p role="alert">Please try again.</p>
      <Button onClick={retry}>Try again</Button>
    </main>
  );
}
