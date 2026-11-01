import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useData, useStore } from '../data/StoreContext';
import { logEntry, newTask } from '../domain/tasks';
import { useToast } from './ui/Toasts';
import { useTaskNav } from './useTaskNav';

/** Champ « Ajouter une tâche » : Entrée pour créer sans quitter la liste. */
export function QuickAdd({ clientId = '', dueDate = '', placeholder = 'Ajouter une tâche…', chooseClient = false }: {
  clientId?: string; dueDate?: string; placeholder?: string; chooseClient?: boolean;
}) {
  const { clients } = useData();
  const [picked, setPicked] = useState('');
  const store = useStore();
  const toast = useToast();
  const nav = useTaskNav();
  const [value, setValue] = useState('');
  const submit = () => {
    const title = value.trim();
    if (!title) return;
    const t = newTask({ title, clientId: clientId || picked, dueDate, log: [logEntry('Tâche créée')] });
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
      {chooseClient && !clientId && (
        <select value={picked} onChange={e => setPicked(e.target.value)} aria-label="Lier au dossier" title="Lier la tâche à un dossier">
          <option value="">Sans dossier (à lier plus tard)</option>
          {[...clients].filter(c => !c.archived).sort((a, b) => a.name.localeCompare(b.name, 'fr')).map(c => <option key={c.id} value={c.id}>Lier à : {c.name}</option>)}
        </select>
      )}
    </label>
  );
}
