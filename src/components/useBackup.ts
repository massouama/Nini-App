import { useData, useStore } from '../data/StoreContext';
import { today } from '../lib/dates';
import { download } from '../lib/files';

/** Export de sauvegarde JSON + état du rappel (aucune sauvegarde depuis 7 jours). */
export function useBackup() {
  const data = useData();
  const store = useStore();
  const last = data.settings.lastBackup;
  const days = last ? Math.floor((Date.now() - last) / 86400000) : null;
  const due = data.tasks.length > 0 && (days === null || days >= 7);
  const exportNow = () => {
    store.setSettings({ lastBackup: Date.now() });
    download(`nini-sauvegarde-${today()}.json`, JSON.stringify({ ...store.data, settings: { ...store.data.settings, lastBackup: Date.now() }, version: 2 }, null, 2), 'application/json');
  };
  return { days, due, exportNow };
}
