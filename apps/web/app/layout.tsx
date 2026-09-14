import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Dealith — Platform Foundation',
  description: 'Development runtime certification. No marketplace features enabled.',
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
