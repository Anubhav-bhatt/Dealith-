import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from 'react';
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand">
      <span className="brand-mark" aria-hidden="true">
        D
      </span>
      {!compact && (
        <span>
          dealith<span className="brand-dot">.</span>
        </span>
      )}
    </span>
  );
}
export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`button ${props.className ?? ''}`} />;
}
export function ActionLink(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props} className={`button ${props.className ?? ''}`} />;
}
export function StatusNote({ children }: { children: ReactNode }) {
  return (
    <p className="status-note" role="status">
      <span className="status-dot" aria-hidden="true" />
      {children}
    </p>
  );
}
export function Arrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h14m-6-6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`input ${props.className ?? ''}`} />;
}
export function Card({ children, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section {...props} className={`card ${props.className ?? ''}`}>
      {children}
    </section>
  );
}
export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'danger';
}) {
  return (
    <span className="badge" data-tone={tone}>
      {children}
    </span>
  );
}
export function Spinner() {
  return <span className="spinner" role="status" aria-label="Loading" />;
}
export function Skeleton() {
  return <span className="skeleton" aria-hidden="true" />;
}
export function Alert({ children }: { children: ReactNode }) {
  return (
    <p className="alert" role="alert">
      {children}
    </p>
  );
}
export function EmptyState({ children }: { children: ReactNode }) {
  return <p>{children}</p>;
}
export function PageContainer({ children }: { children: ReactNode }) {
  return <div className="container">{children}</div>;
}

export type StatusRow = { label: string; value: string; tone: 'neutral' | 'success' | 'danger' };
export function StatusList({ rows }: { rows: readonly StatusRow[] }) {
  return (
    <dl className="status-list">
      {rows.map((row) => (
        <div key={row.label}>
          <dt>{row.label}</dt>
          <dd>
            <Badge tone={row.tone}>{row.value}</Badge>
          </dd>
        </div>
      ))}
    </dl>
  );
}
