import { useStore } from '../data/StoreContext';
import { fmtDate } from '../lib/dates';
import { useToast } from './ui/Toasts';

/** Coche / décoche une tâche, avec « Annuler » dans la notification. */
export function useComplete() {
  const store = useStore();
  const toast = useToast();
  return (id: string) => {
    const before = store.task(id);
    if (!before) return;
    if (before.status === 'done') {
      store.setStatus(id, 'todo');
      toast('Tâche rouverte');
      return;
    }
    const spawned = store.setStatus(id, 'done');
    toast(spawned ? `Terminée · prochaine le ${fmtDate(spawned.dueDate, 'short')}` : 'Terminée', {
      action: {
        label: 'Annuler',
        onClick: () => {
          store.upsertTasks([before]);
          if (spawned) store.deleteTasks([spawned.id]);
        },
      },
    });
  };
}
