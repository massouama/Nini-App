import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Dialog } from './Dialog';

interface Ask { title: string; message?: ReactNode; confirmLabel?: string; danger?: boolean }
type ConfirmFn = (ask: Ask) => Promise<boolean>;

const Ctx = createContext<ConfirmFn>(async () => false);
export const useConfirm = () => useContext(Ctx);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [ask, setAsk] = useState<Ask | null>(null);
  const resolver = useRef<(v: boolean) => void>(undefined);
  const confirm = useCallback<ConfirmFn>(a => new Promise(res => { resolver.current = res; setAsk(a); }), []);
  const answer = (v: boolean) => { resolver.current?.(v); setAsk(null); };
  return (
    <Ctx.Provider value={confirm}>
      {children}
      <Dialog open={!!ask} onClose={() => answer(false)} size="sm" title={ask?.title}
        footer={<>
          <button className="btn" onClick={() => answer(false)}>Annuler</button>
          <button className={`btn ${ask?.danger ? 'danger' : 'primary'}`} autoFocus onClick={() => answer(true)}>{ask?.confirmLabel ?? 'Confirmer'}</button>
        </>}>
        {ask?.message && <div className="confirm-msg">{ask.message}</div>}
      </Dialog>
    </Ctx.Provider>
  );
}
