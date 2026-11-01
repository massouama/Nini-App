import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

interface Toast { id: number; message: string; tone: 'default' | 'error'; action?: { label: string; onClick: () => void } }
type ToastFn = (message: string, opts?: { tone?: Toast['tone']; action?: Toast['action'] }) => void;

const Ctx = createContext<ToastFn>(() => {});
export const useToast = () => useContext(Ctx);

let next = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = (id: number) => setToasts(ts => ts.filter(t => t.id !== id));
  const toast = useCallback<ToastFn>((message, opts = {}) => {
    const id = next++;
    setToasts(ts => [...ts.slice(-2), { id, message, tone: opts.tone ?? 'default', action: opts.action }]);
    setTimeout(() => dismiss(id), opts.action ? 6000 : 3200);
  }, []);
  return (
    <Ctx.Provider value={toast}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.tone}`}>
            <span>{t.message}</span>
            {t.action && (
              <button onClick={() => { t.action!.onClick(); dismiss(t.id); }}>{t.action.label}</button>
            )}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
