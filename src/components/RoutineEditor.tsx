import { Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useData, useStore } from '../data/StoreContext';
import { uid } from '../lib/format';
import { CATEGORIES } from '../domain/constants';
import { DEFAULT_ROUTINE } from '../domain/routine';
import type { RoutinePhase } from '../domain/types';
import { useConfirm } from './ui/Confirm';
import { useToast } from './ui/Toasts';

/** Modification de la routine mensuelle : périodes, échéances et étapes. */
export function RoutineEditor() {
  const { settings } = useData();
  const store = useStore();
  const toast = useToast();
  const confirm = useConfirm();
  const [draft, setDraft] = useState<RoutinePhase[]>(settings.routine);
  useEffect(() => setDraft(settings.routine), [settings.routine]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings.routine);
  const set = (i: number, patch: Partial<RoutinePhase>) => setDraft(d => d.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  return (
    <div className="routine">
      {draft.map((p, i) => (
        <div key={p.id} className="routine-phase">
          <div className="routine-row">
            <input className="routine-title" value={p.title} onChange={e => set(i, { title: e.target.value })} aria-label="Nom de la période" />
            <button className="icon-btn danger" title="Supprimer cette période" onClick={() => setDraft(d => d.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
          </div>
          <div className="routine-grid">
            <label className="field"><span>Planifiée du</span><input type="number" min={1} max={31} value={p.from} onChange={e => set(i, { from: Number(e.target.value) || 1 })} /></label>
            <label className="field"><span>au</span><input type="number" min={1} max={31} value={p.to} onChange={e => set(i, { to: Number(e.target.value) || 31 })} /></label>
            <label className="field"><span>Échéance</span>
              <select value={typeof p.due === 'number' ? 'jour' : p.due} onChange={e => set(i, { due: e.target.value === 'jour' ? 17 : e.target.value as 'tva' | 'last' })}>
                <option value="jour">Un jour fixe</option>
                <option value="tva">Date TVA du dossier</option>
                <option value="last">Dernier jour ouvré</option>
              </select>
            </label>
            {typeof p.due === 'number' && <label className="field"><span>Le</span><input type="number" min={1} max={31} value={p.due} onChange={e => set(i, { due: Number(e.target.value) || 1 })} /></label>}
            <label className="field"><span>Tâches</span>
              <select value={p.scope} onChange={e => set(i, { scope: e.target.value as RoutinePhase['scope'] })}>
                <option value="client">Une par dossier</option>
                <option value="manager">Une par manager</option>
                <option value="global">Une seule</option>
              </select>
            </label>
            <label className="field"><span>Catégorie</span>
              <select value={p.category} onChange={e => set(i, { category: e.target.value })}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
            </label>
          </div>
          <label className="field"><span>Étapes (une par ligne){p.scope === 'manager' ? ' – les dossiers du manager sont ajoutés automatiquement' : ''}</span>
            <textarea rows={Math.max(2, p.steps.length + 1)} value={p.steps.join('\n')} onChange={e => set(i, { steps: e.target.value.split('\n').map(s => s.trimStart()).filter((s, k, a) => s || k < a.length - 1) })} />
          </label>
        </div>
      ))}
      <div className="row">
        <button className="btn" onClick={() => setDraft(d => [...d, { id: uid(), title: 'Nouvelle période', from: 1, to: 31, due: 'last', scope: 'client', category: 'Autre', steps: [] }])}><Plus size={15} /> Ajouter une période</button>
        <button className="btn ghost" onClick={async () => {
          if (await confirm({ title: 'Revenir à la routine d’origine ?', confirmLabel: 'Rétablir' })) setDraft(structuredClone(DEFAULT_ROUTINE));
        }}><RotateCcw size={14} /> Routine d’origine</button>
        <span className="spacer" />
        {dirty && <button className="btn ghost" onClick={() => setDraft(settings.routine)}>Annuler</button>}
        <button className="btn primary" disabled={!dirty} onClick={() => {
          store.setRoutine(draft.map(p => ({ ...p, steps: p.steps.map(s => s.trim()).filter(Boolean) })));
          toast('Routine enregistrée : elle s’applique aux prochaines tâches créées.');
        }}>Enregistrer la routine</button>
      </div>
    </div>
  );
}
