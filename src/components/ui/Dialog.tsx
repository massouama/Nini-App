import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/** Fenêtre modale basée sur l'élément natif <dialog> (focus, Échap, accessibilité). */
export function Dialog({ open, onClose, title, children, footer, size = 'md', className = '' }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={`dialog dialog-${size} ${className}`}
      onCancel={e => { e.preventDefault(); onClose(); }}
      onMouseDown={e => { if (e.target === ref.current) onClose(); }}
    >
      {open && (
        <div className="dialog-inner">
          {title && (
            <header className="dialog-head">
              <h2>{title}</h2>
              <button className="icon-btn" onClick={onClose} aria-label="Fermer"><X size={16} /></button>
            </header>
          )}
          <div className="dialog-body">{children}</div>
          {footer && <footer className="dialog-foot">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}
