import { Brand, PageContainer } from '@dealith/ui';
import FoundationStatus from './foundation-status';
import { readWebRuntimeConfig } from '@dealith/config/runtime';
export default function Page() {
  const config = readWebRuntimeConfig(process.env);
  return (
    <PageContainer>
      <header className="header">
        <Brand />
        <span className="eyebrow">Phase 1</span>
      </header>
      <main id="main">
        <h1>Dealith Admin</h1>
        <p>Platform Foundation · Environment: {config.APP_ENV}</p>
        <FoundationStatus />
        <p className="mt-6 text-sm">
          Development certification only. Product features and authentication are not enabled.
        </p>
      </main>
      <footer className="footer">Independent admin runtime · Dealith</footer>
    </PageContainer>
  );
}
