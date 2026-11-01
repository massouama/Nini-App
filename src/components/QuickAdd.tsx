import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../data/StoreContext';
import { logEntry, newTask } from '../domain/tasks';
import { useToast } from './ui/Toasts';
import { useTaskNav } from './useTaskNav';

/** Champ « Ajouter une tâche » : Entrée pour créer sans quitter la liste. */
export function QuickAdd({ clientId = '', dueDate = '', placeholder = 'Ajouter une tâche…' }: { clientId?: string; dueDate?: string; placeholder?: string }) {
  const store = useStore();
  const toast = useToast();
  const nav = useTaskNav();
  const [value, setValue] = useState('');
  const submit = () => {
    const title = value.trim();
    if (!title) return;
    const t = newTask({ title, clientId, dueDate, log: [logEntry('Tâche créée')] });
    store.upsertTasks([t]);
    setValue('');
    toast('Tâche ajoutée', { action: { label: 'Ouvrir', onClick: () => nav.open(t.id) } });
  };
  return (
    <label className="quick-add">
      <Plus size={16} />
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setValue(''); }}
        placeholder={placeholder}
      />
      {value && <kbd>Entrée</kbd>}
    </label>
  );
}
