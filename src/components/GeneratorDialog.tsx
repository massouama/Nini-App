import { useEffect, useMemo, useState } from 'react';
import { useData, useStore } from '../data/StoreContext';
import { fmtDate, today } from '../lib/dates';
import { obligationToTask, obligationsFor } from '../domain/obligations';
import { clientCode } from '../domain/tasks';
import { Dialog } from './ui/Dialog';
import { useToast } from './ui/Toasts';

/** Pose en une fois les échéances de l'année (TVA, IS, liasse, AG, DSN, CFE…) pour un ou plusieurs dossiers. */
export function GeneratorDialog({ open, clientIds, onClose }: { open: boolean; clientIds: string[]; onClose: () => void }) {
  const store = useStore();
  const { clients, tasks } = useData();
  const toast = useToast();
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const items = useMemo(() => {
    const keys = new Set(tasks.map(t => t.key).filter(Boolean));
    const ref = today();
    return clientIds
      .map(id => clients.find(c => c.id === id))
      .filter(c => !!c)
      .flatMap(c => obligationsFor(c!, year))
      .map(o => ({ ...o, exists: keys.has(o.key), past: o.dueDate < ref }));
  }, [clientIds, clients, tasks, year]);

  useEffect(() => {
    if (open) setChecked(new Set(items.filter(o => !o.exists && !o.past).map(o => o.key)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, year, clientIds.join()]);

  const toggle = (k: string) => setChecked(s => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const selected = items.filter(o => !o.exists && checked.has(o.key));
  const groups = clientIds.map(id => ({ client: clients.find(c => c.id === id)!, items: items.filter(o => o.clientId === id) })).filter(g => g.client);

  const create = () => {
    store.upsertTasks(selected.map(obligationToTask));
    toast(`${selected.length} tâche${selected.length > 1 ? 's' : ''} créée${selected.length > 1 ? 's' : ''}`);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} size="lg" title="Poser les échéances"
      footer={<>
        <span className="muted small">{selected.length} sélectionnée{selected.length > 1 ? 's' : ''}</span>
        <span className="spacer" />
        <button className="btn" onClick={onClose}>Annuler</button>
        <button className="btn primary" disabled={!selected.length} onClick={create}>Créer {selected.length} tâche{selected.length > 1 ? 's' : ''}</button>
      </>}>
      <div className="gen-bar">
        <div className="segmented">
          {[thisYear - 1, thisYear, thisYear + 1].map(y => (
            <button key={y} className={y === year ? 'on' : ''} onClick={() => setYear(y)}>{y}</button>
          ))}
        </div>
        <button className="btn ghost sm" onClick={() => setChecked(new Set(items.filter(o => !o.exists).map(o => o.key)))}>Tout cocher</button>
        <button className="btn ghost sm" onClick={() => setChecked(new Set())}>Tout décocher</button>
      </div>
      <p className="muted small">
        Exercice clos en {year} et déclarations périodiques de l’année. Ce sont des dates usuelles : vérifie-les et ajuste-les si besoin.
        Les échéances déjà passées sont décochées ; celles déjà créées sont grisées.
      </p>
      {groups.map(g => (
        <div key={g.client.id} className="gen-group">
          {groups.length > 1 && <h4><span className="code">{clientCode(g.client)}</span>{g.client.name}</h4>}
          <ul className="gen-list">
            {g.items.map(o => (
              <li key={o.key} className={`${o.exists ? 'exists' : ''} ${o.past ? 'past' : ''}`}>
                <label>
                  <input type="checkbox" disabled={o.exists} checked={o.exists || checked.has(o.key)} onChange={() => toggle(o.key)} />
                  <span className="gen-date">{fmtDate(o.dueDate)}</span>
                  <span className="gen-title">{o.title}</span>
                  <span className="muted small">{o.exists ? 'déjà créée' : o.category}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </Dialog>
  );
}
