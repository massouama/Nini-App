import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

/** En-tête de groupe repliable (dossiers, tâches). */
export function GroupHeader({ label, count, open, onToggle, color, aside, muted }: {
  label: ReactNode; count: number; open: boolean; onToggle: () => void; color?: string; aside?: ReactNode; muted?: boolean;
}) {
  return (
    <button type="button" className={`group-head ${open ? 'opened' : ''} ${muted ? 'muted-group' : ''}`} aria-expanded={open} onClick={onToggle}>
      <ChevronRight size={14} className="chev" />
      {color && <i className="group-dot" style={{ background: color }} />}
      <span className="group-label">{label}</span>
      <span className="count">{count}</span>
      {aside && <span className="group-aside">{aside}</span>}
    </button>
  );
}
