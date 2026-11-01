import type { Status } from '../domain/types';

/** Petits pictogrammes de statut, dessinés à la main (cercle vide, demi-plein, pause, coché). */
export function StatusIcon({ status, size = 14 }: { status: Status; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 16 16', className: `status-icon s-${status}`, 'aria-hidden': true } as const;
  switch (status) {
    case 'doing':
      return <svg {...common}><circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M8 3.5a4.5 4.5 0 0 1 0 9z" fill="currentColor" /></svg>;
    case 'waiting':
      return <svg {...common}><circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M6.25 5.5v5M9.75 5.5v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>;
    case 'done':
      return <svg {...common}><circle cx="8" cy="8" r="7" fill="currentColor" /><path d="M5 8.2l2 2 4-4.2" fill="none" stroke="var(--bg)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
    default:
      return <svg {...common}><circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2.2 2" /></svg>;
  }
}
