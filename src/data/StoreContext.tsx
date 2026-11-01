import { createContext, useContext, useSyncExternalStore } from 'react';
import type { AppStore } from './store';

export const StoreContext = createContext<AppStore | null>(null);

export function useStore() {
  const s = useContext(StoreContext);
  if (!s) throw new Error('StoreContext manquant');
  return s;
}

/** Données réactives (re-rendu à chaque modification). */
export function useData() {
  const s = useStore();
  return useSyncExternalStore(s.subscribe, s.getSnapshot).data;
}

export function useStoreStatus() {
  const s = useStore();
  const st = useSyncExternalStore(s.subscribe, s.getSnapshot);
  return { status: st.status, error: st.error };
}
