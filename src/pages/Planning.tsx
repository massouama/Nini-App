import { ChevronLeft, ChevronRight, ListChecks, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { managerColor, managersOf } from '../components/managers';
import { useConfirm } from '../components/ui/Confirm';
import { Dialog } from '../components/ui/Dialog';
import { useToast } from '../components/ui/Toasts';
import { useData, useStore } from '../data/StoreContext';
import { addMonths, capitalize, iso, parse, startOfWeek, today } from '../lib/dates';
import { uid } from '../lib/format';
import { usePref } from '../lib/usePref';
import { SLOT, buildPlan, dayTotals, fmtDays, plannedByClient } from '../domain/planning';
import { monthLabel, routineTasks } from '../domain/routine';
import { clientCode } from '../domain/tasks';
import type { Client, PlanBlock } from '../domain/types';
import { frenchHolidays, workingDays } from '../domain/workdays';

const DURATIONS = Array.from({ length: 8 }, (_, i) => (i + 1) * SLOT);
const durationLabel = (d: number) => `${fmtDays(d)}${d < 1 ? ` · ${Math.round(d * 8)} h` : ''}`.replace(/^(\d+) h · \d+ h$/, '$1 h');

export function PlanningPage() {
  const data = useData();
  const store = useStore();
  const toast = useToast();
  const confirm = useConfirm();
  const [prefs, setPrefs] = usePref('planning', { month: today().slice(0, 7) });
  const month = prefs.month;
  const blocks = useMemo(() => data.settings.plans[month] ?? [], [data.settings.plans, month]);
  const [edit, setEdit] = useState<{ block: PlanBlock; isNew: boolean } | null>(null);
  const [over, setOver] = useState<string | null>(null);

  const clients = useMemo(() => data.clients.filter(c => !c.archived).sort((a, b) => a.name.localeCompare(b.name, 'fr')), [data.clients]);
  const allocated = clients.filter(c => c.joursMois > 0);
  const managers = managersOf(clients);
  const wdays = workingDays(month);
  const holidays = frenchHolidays(+month.slice(0, 4));
  const totals = dayTotals(blocks);
  const planned = plannedByClient(blocks);
  const allocTotal = allocated.reduce((s, c) => s + c.joursMois, 0);
  const clientById = (id: string) => data.clients.find(c => c.id === id);
  const phaseTitle = (id: string) => id === 'reserve' ? 'Période réservée' : data.settings.routine.find(p => p.id === id)?.title ?? '';
  const phaseOfDay = (d: string) => data.settings.routine.find(p => p.scope === 'client' && +d.slice(8) >= p.from && +d.slice(8) <= p.to);

  const save = (next: PlanBlock[]) => store.setPlan(month, next);

  const propose = async () => {
    if (!allocated.length) { toast('Renseigne d’abord le temps alloué (jours / mois) dans les dossiers.', { tone: 'error' }); return; }
    if (blocks.length && !(await confirm({
      title: 'Remplacer la répartition du mois ?', message: 'Une nouvelle proposition remplacera les modifications faites à la main pour ce mois.', confirmLabel: 'Remplacer',
    }))) return;
    const res = buildPlan(month, clients, data.settings.routine);
    save(res.blocks);
    toast(res.scaled ? 'Proposition créée : le temps alloué dépassait le mois, il a été réduit au prorata.' : 'Répartition proposée');
  };
  const createTasks = () => {
    const keys = new Set(data.tasks.map(t => t.key));
    const list = routineTasks(month, data.clients, data.settings.routine, keys);
    if (!list.length) { toast('Les tâches de ce mois existent déjà.'); return; }
    store.upsertTasks(list);
    toast(`${list.length} tâches créées pour ${monthLabel(month)}`);
  };
  const moveBlock = (id: string, date: string) => {
    setOver(null);
    const b = blocks.find(x => x.id === id);
    if (!b || b.date === date) return;
    const twin = blocks.find(x => x.date === date && x.clientId === b.clientId && x.id !== id);
    save(twin
      ? blocks.filter(x => x.id !== id).map(x => x.id === twin.id ? { ...x, days: x.days + b.days } : x)
      : blocks.map(x => x.id === id ? { ...x, date } : x));
  };

  // Semaines du mois (lundi → vendredi)
  const weeks: string[][] = [];
  for (let w = startOfWeek(`${month}-01`); w.slice(0, 7) <= month; w = iso(new Date(parse(w).getTime() + 7 * 86400000))) {
    const days = Array.from({ length: 5 }, (_, i) => iso(new Date(parse(w).getFullYear(), parse(w).getMonth(), parse(w).getDate() + i)));
    if (days.some(d => d.slice(0, 7) === month)) weeks.push(days);
  }
  const free = wdays.length - allocTotal;

  return (
    <div className="page wide">
      <PageHeader
        eyebrow="Répartition du temps"
        title={capitalize(monthLabel(month))}
        subtitle={<span className="stats">
          <span className="stat">{wdays.length} jours ouvrés</span>
          <span className="stat">{fmtDays(allocTotal)} alloués</span>
          <span className={`stat ${free < 0 ? 'late' : ''}`}>{free >= 0 ? `${fmtDays(free)} de marge` : `${fmtDays(-free)} de trop`}</span>
        </span>}
        actions={<>
          <div className="segmented">
            <button onClick={() => setPrefs({ month: addMonths(`${month}-01`, -1).slice(0, 7) })} aria-label="Mois précédent"><ChevronLeft size={15} /></button>
            <button onClick={() => setPrefs({ month: today().slice(0, 7) })}>Ce mois</button>
            <button onClick={() => setPrefs({ month: addMonths(`${month}-01`, 1).slice(0, 7) })} aria-label="Mois suivant"><ChevronRight size={15} /></button>
          </div>
          <button className="btn" onClick={createTasks}><ListChecks size={15} /> Créer les tâches du mois</button>
          <button className={`btn ${blocks.length ? '' : 'primary'}`} onClick={propose}><Sparkles size={15} /> {blocks.length ? 'Nouvelle proposition' : 'Proposer une répartition'}</button>
        </>}
      />

      {!blocks.length ? (
        <div className="plan-empty">
          <h2>Pas encore de répartition pour {monthLabel(month)}</h2>
          <p>La proposition place d’abord les dossiers ayant une période réservée, puis répartit le temps de chaque dossier sur les périodes du mois
            (début, milieu, TVA, fin), au prorata du temps disponible. En période TVA, les dossiers dont la date limite est la plus proche passent en premier.
            Tout reste modifiable ensuite : glisser un bloc vers un autre jour, changer une durée, ajouter ou supprimer.</p>
          {allocated.length ? (
            <button className="btn primary" onClick={propose}><Sparkles size={15} /> Proposer une répartition</button>
          ) : (
            <p className="muted">Aucun dossier n’a de temps alloué pour l’instant : ouvre un dossier, puis « Modifier », et renseigne « Temps alloué (jours / mois) ».</p>
          )}
        </div>
      ) : (
        <div className="plan-layout">
          <div>
            <div className="plan-legend">
              {managers.map(m => <span key={m}><i style={{ background: managerColor(clients, m) }} />{m}</span>)}
              <span className="muted small">Glisse un bloc pour le déplacer · clique pour le modifier</span>
            </div>
            <div className="plan-grid">
              {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'].map(d => <div key={d} className="plan-head">{d}</div>)}
              {weeks.flat().map(d => {
                const inMonth = d.slice(0, 7) === month;
                const working = wdays.includes(d);
                if (!inMonth || !working) {
                  return <div key={d} className="plan-day off"><span className="plan-num">{+d.slice(8)}</span>{inMonth && holidays.has(d) && <span className="muted small">Férié</span>}</div>;
                }
                const items = blocks.filter(b => b.date === d);
                const total = totals.get(d) ?? 0;
                const phase = phaseOfDay(d);
                return (
                  <div key={d} className={`plan-day ${over === d ? 'over' : ''} ${d === today() ? 'today' : ''}`}
                    onDragOver={e => { e.preventDefault(); setOver(d); }}
                    onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null); }}
                    onDrop={e => { e.preventDefault(); moveBlock(e.dataTransfer.getData('text/plain'), d); }}>
                    <div className="plan-day-head">
                      <span className="plan-num">{+d.slice(8)}</span>
                      {phase && <span className="plan-phase">{phase.title}</span>}
                      <span className={`plan-total ${total > 1 ? 'late' : total < 1 ? 'free' : ''}`}>{total > 1 ? `${fmtDays(total)} !` : total < 1 ? `${fmtDays(1 - total)} libre` : '1 j'}</span>
                    </div>
                    {items.map(b => {
                      const c = clientById(b.clientId);
                      return (
                        <button key={b.id} className="plan-block" draggable title={`${c?.name ?? 'Dossier supprimé'} · ${phaseTitle(b.phaseId)}`}
                          style={{ ['--mc' as string]: managerColor(clients, c?.manager ?? '') }}
                          onDragStart={e => e.dataTransfer.setData('text/plain', b.id)}
                          onClick={() => setEdit({ block: b, isNew: false })}>
                          <span className="code">{clientCode(c)}</span>
                          <span className="ellipsis">{c?.name ?? '—'}</span>
                          <span className="plan-dur">{fmtDays(b.days)}</span>
                        </button>
                      );
                    })}
                    {total < 1 && (
                      <button className="plan-add" onClick={() => setEdit({ block: { id: uid(), date: d, clientId: allocated[0]?.id ?? clients[0]?.id ?? '', days: Math.max(SLOT, Math.min(0.5, 1 - total)), phaseId: phase?.id ?? '' }, isNew: true })}>
                        <Plus size={13} /> Ajouter
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <Balance clients={clients} planned={planned} />
        </div>
      )}

      {blocks.length > 0 && (
        <div className="plan-foot">
          <button className="btn ghost sm danger" onClick={async () => {
            if (await confirm({ title: 'Effacer la répartition du mois ?', confirmLabel: 'Effacer', danger: true })) save([]);
          }}><Trash2 size={14} /> Effacer la répartition</button>
        </div>
      )}

      <BlockDialog
        edit={edit} clients={clients} days={wdays} routine={data.settings.routine}
        onClose={() => setEdit(null)}
        onSave={b => { save(edit?.isNew ? [...blocks, b] : blocks.map(x => x.id === b.id ? b : x)); setEdit(null); }}
        onDelete={id => { save(blocks.filter(x => x.id !== id)); setEdit(null); }}
      />
    </div>
  );
}

function Balance({ clients, planned }: { clients: Client[]; planned: Map<string, number> }) {
  const store = useStore();
  const groups = managersOf(clients).map(m => ({ m, list: clients.filter(c => c.manager.trim() === m) }));
  const orphans = clients.filter(c => !c.manager.trim());
  if (orphans.length) groups.push({ m: 'Sans manager', list: orphans });
  return (
    <aside className="balance">
      <h2 className="section-title">Équilibre par dossier</h2>
      <p className="muted small">Temps alloué par mois (modifiable ici) et temps planifié.</p>
      {groups.map(({ m, list }) => {
        const alloc = list.reduce((s, c) => s + c.joursMois, 0);
        const plan = list.reduce((s, c) => s + (planned.get(c.id) ?? 0), 0);
        return (
          <div key={m} className="balance-group">
            <h3><i style={{ background: managerColor(clients, m) }} />{m}<span className="muted">{fmtDays(plan)} / {fmtDays(alloc)}</span></h3>
            {list.map(c => {
              const p = planned.get(c.id) ?? 0;
              const diff = Math.round((p - c.joursMois) * 1000) / 1000;
              return (
                <div key={c.id} className="balance-row">
                  <Link to={`/dossiers/${c.id}`} className="ellipsis"><span className="code">{clientCode(c)}</span> {c.name}</Link>
                  <input type="number" min={0} step={SLOT} value={c.joursMois} aria-label={`Temps alloué à ${c.name}`}
                    onChange={e => store.upsertClient({ ...c, joursMois: Math.max(0, Number(e.target.value) || 0) })} />
                  <span className={`balance-diff ${diff === 0 ? 'ok' : diff > 0 ? 'plus' : 'minus'}`}>{diff === 0 ? '✓' : `${diff > 0 ? '+' : '−'}${fmtDays(Math.abs(diff))}`}</span>
                </div>
              );
            })}
          </div>
        );
      })}
    </aside>
  );
}

function BlockDialog({ edit, clients, days, routine, onClose, onSave, onDelete }: {
  edit: { block: PlanBlock; isNew: boolean } | null; clients: Client[]; days: string[]; routine: { id: string; title: string; scope: string }[];
  onClose: () => void; onSave: (b: PlanBlock) => void; onDelete: (id: string) => void;
}) {
  const [b, setB] = useState<PlanBlock | null>(null);
  const current = b && edit && b.id === edit.block.id ? b : edit?.block ?? null;
  const set = (patch: Partial<PlanBlock>) => current && setB({ ...current, ...patch });
  return (
    <Dialog open={!!edit} onClose={() => { setB(null); onClose(); }} size="sm" title={edit?.isNew ? 'Ajouter un créneau' : 'Modifier le créneau'}
      footer={current && <>
        {!edit?.isNew && <button className="btn ghost danger" onClick={() => { setB(null); onDelete(current.id); }}><Trash2 size={14} /> Supprimer</button>}
        <span className="spacer" />
        <button className="btn" onClick={() => { setB(null); onClose(); }}>Annuler</button>
        <button className="btn primary" disabled={!current.clientId} onClick={() => { onSave(current); setB(null); }}>Enregistrer</button>
      </>}>
      {current && (
        <div className="form-grid">
          <label className="field wide"><span>Dossier</span>
            <select value={current.clientId} onChange={e => set({ clientId: e.target.value })}>
              {clients.map(c => <option key={c.id} value={c.id}>{clientCode(c)} · {c.name}</option>)}
            </select>
          </label>
          <label className="field"><span>Jour</span>
            <select value={current.date} onChange={e => set({ date: e.target.value })}>
              {days.map(d => <option key={d} value={d}>{parse(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</option>)}
            </select>
          </label>
          <label className="field"><span>Durée</span>
            <select value={current.days} onChange={e => set({ days: Number(e.target.value) })}>
              {DURATIONS.map(d => <option key={d} value={d}>{durationLabel(d)}</option>)}
            </select>
          </label>
          <label className="field wide"><span>Période</span>
            <select value={current.phaseId} onChange={e => set({ phaseId: e.target.value })}>
              <option value="">—</option>
              <option value="reserve">Période réservée</option>
              {routine.filter(p => p.scope === 'client').map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </label>
        </div>
      )}
    </Dialog>
  );
}
