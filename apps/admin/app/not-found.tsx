import { ActionLink, Brand } from '@dealith/ui';
export default function NotFound() {
  return (
    <main id="main" className="container admin-main">
      <section className="admin-panel">
        <Brand />
        <h1>Page not found.</h1>
        <p>The page may have moved or is not available.</p>
        <ActionLink href="/">Return home</ActionLink>
      </section>
    </main>
  );
}
