import { useCallback, useState } from 'react';

/** Préférence d'affichage propre à l'appareil (filtres, vue…), mémorisée dans le navigateur. */
export function usePref<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const storageKey = `nini:pref:${key}`;
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? { ...(initial as object), ...JSON.parse(raw) } as T : initial;
    } catch {
      return initial;
    }
  });
  const set = useCallback((v: T | ((prev: T) => T)) => {
    setValue(prev => {
      const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v;
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* navigation privée */ }
      return next;
    });
  }, [storageKey]);
  return [value, set];
}
