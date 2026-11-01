import { useSearchParams } from 'react-router-dom';

/** Le panneau de tâche est piloté par l'URL (?tache=…) : lien direct, bouton retour du navigateur. */
export function useTaskNav() {
  const [params, setParams] = useSearchParams();
  const clear = (p: URLSearchParams) => { ['tache', 'client', 'date'].forEach(k => p.delete(k)); return p; };
  return {
    openId: params.get('tache'),
    preset: { clientId: params.get('client') ?? '', dueDate: params.get('date') ?? '' },
    open: (id: string) => setParams(p => { clear(p).set('tache', id); return p; }),
    openNew: (preset: { clientId?: string; dueDate?: string } = {}) => setParams(p => {
      clear(p).set('tache', 'new');
      if (preset.clientId) p.set('client', preset.clientId);
      if (preset.dueDate) p.set('date', preset.dueDate);
      return p;
    }),
    replace: (id: string) => setParams(p => { clear(p).set('tache', id); return p; }, { replace: true }),
    close: () => setParams(p => clear(p)),
  };
}
