import type { ReactNode } from 'react';

export function PageHeader({ title, subtitle, actions, eyebrow }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <header className="page-head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {subtitle && <p className="subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function Section({ title, count, tone, children, aside }: { title: ReactNode; count?: number; tone?: 'late'; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className={`section ${tone ?? ''}`}>
      <h2 className="section-title">
        <span>{title}</span>
        {count !== undefined && <span className="count">{count}</span>}
        {aside && <span className="section-aside">{aside}</span>}
      </h2>
      {children}
    </section>
  );
}
