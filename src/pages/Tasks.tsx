import { LayoutList, Search, SquareKanban } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DueLabel } from '../components/DueLabel';
import { PageHeader } from '../components/PageHeader';
import { QuickAdd } from '../components/QuickAdd';
import { StatusIcon } from '../components/StatusIcon';
import { PrioTag, TaskList } from '../components/TaskRow';
import { useToast } from '../components/ui/Toasts';
import { useTaskNav } from '../components/useTaskNav';
import { useData, useStore } from '../data/StoreContext';
import { addDays, fmtDate, today } from '../lib/dates';
import { fmtMin } from '../lib/format';
import { usePref } from '../lib/usePref';
import { CATEGORIES, PRIORITIES, PRIO_RANK, STATUSES } from '../domain/constants';
import { byDue, clientCode, isOverdue, isStarted, timeSpent } from '../domain/tasks';
import type { Status, Task } from '../domain/types';
import { TASK_GROUPINGS, TASK_GROUPS_OPEN_BY_DEFAULT, groupTasks, type TaskGroupBy } from '../domain/grouping';
import { GroupHeader } from '../components/GroupHeader';
import { managerColor } from '../components/managers';
import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react';

interface Filters { client: string; status: string; due: string; category: string; priority: string; sort: string; view: 'list' | 'board'; groupBy: TaskGroupBy; folds: Record<string, boolean> }
const DEFAULTS: Filters = { client: '', status: 'open', due: '', category: '', priority: '', sort: 'due', view: 'list', groupBy: 'client', folds: {} };

export function TasksPage() {
  const { tasks, clients, settings } = useData();
  const [f, setF] = usePref<Filters>('tasks', DEFAULTS);
  const [q, setQ] = useState('');
  const [params, setParams] = useSearchParams();

  // Raccourcis depuis l'accueil : /taches?f=overdue|week|waiting
  useEffect(() => {
    const preset = params.get('f');
    if (!preset) return;
    setF({ ...DEFAULTS, view: 'list', ...(preset === 'waiting' ? { status: 'waiting' } : { due: preset }) });
    setParams(p => { p.delete('f'); return p; }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const ref = today();
  const filtered = useMemo(() => {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const name = (id: string) => clients.find(c => c.id === id)?.name ?? '';
    const list = tasks.filter(t => {
      if (f.client && t.clientId !== f.client) return false;
      if (f.view === 'list') {
        if (f.status === 'open' && t.status === 'done') return false;
        if (!['open', 'all'].includes(f.status) && t.status !== f.status) return false;
      }
      if (f.category && t.category !== f.category) return false;
      if (f.priority && t.priority !== f.priority) return false;
      const d = t.dueDate;
      if (f.due === 'started' && !isStarted(t, settings.routine, ref)) return false;
      if (f.due === 'overdue' && !isOverdue(t, ref)) return false;
      if (f.due === 'today' && d !== ref) return false;
      if (f.due === 'week' && !(d && d >= ref && d <= addDays(ref, 7))) return false;
      if (f.due === 'month' && !(d && d.slice(0, 7) === ref.slice(0, 7))) return false;
      if (f.due === 'nodate' && d) return false;
      if (words.length) {
        const hay = `${t.title} ${t.description} ${name(t.clientId)} ${t.category}`.toLowerCase();
        if (!words.every(w => hay.includes(w))) return false;
      }
      return true;
    });
    const sorts: Record<string, (a: Task, b: Task) => number> = {
      due: byDue,
      priority: (a, b) => PRIO_RANK[b.priority] - PRIO_RANK[a.priority] || byDue(a, b),
      client: (a, b) => name(a.clientId).localeCompare(name(b.clientId), 'fr') || byDue(a, b),
      updated: (a, b) => b.updatedAt - a.updatedAt,
    };
    return list.sort(sorts[f.sort] ?? byDue);
  }, [tasks, clients, settings.routine, f, q, ref]);

  const set = (patch: Partial<Filters>) => setF(prev => ({ ...prev, ...patch }));
  const isFiltered = ['client', 'status', 'due', 'category', 'priority'].some(k => f[k as keyof Filters] !== DEFAULTS[k as keyof Filters]) || q;
  const total = filtered.reduce((s, t) => s + timeSpent(t), 0);

  return (
    <div className={`page ${f.view === 'board' ? 'wide' : ''}`}>
      <PageHeader
        title="Toutes les tâches"
        subtitle={`${filtered.length} tâche${filtered.length > 1 ? 's' : ''}${total ? ` · ${fmtMin(total)} passées` : ''}`}
        actions={
          <div className="segmented" role="tablist">
            <button className={f.view === 'list' ? 'on' : ''} onClick={() => set({ view: 'list' })}><LayoutList size={14} /> Liste</button>
            <button className={f.view === 'board' ? 'on' : ''} onClick={() => set({ view: 'board' })}><SquareKanban size={14} /> Tableau</button>
          </div>
        }
      />
      <div className="filters">
        <label className="search-field"><Search size={14} /><input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Filtrer…" /></label>
        <select className={f.client ? 'set' : ''} value={f.client} onChange={e => set({ client: e.target.value })}>
          <option value="">Tous les dossiers</option>
          {[...clients].sort((a, b) => a.name.localeCompare(b.name, 'fr')).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {f.view === 'list' && (
          <select className={f.status !== 'open' ? 'set' : ''} value={f.status} onChange={e => set({ status: e.target.value })}>
            <option value="open">Ouvertes</option>
            <option value="all">Tous statuts</option>
            {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        )}
        <select className={f.due ? 'set' : ''} value={f.due} onChange={e => set({ due: e.target.value })}>
          <option value="">Toutes échéances</option>
          <option value="started">À traiter en ce moment</option>
          <option value="overdue">En retard</option>
          <option value="today">Aujourd’hui</option>
          <option value="week">7 prochains jours</option>
          <option value="month">Ce mois-ci</option>
          <option value="nodate">Sans échéance</option>
        </select>
        <select className={f.category ? 'set' : ''} value={f.category} onChange={e => set({ category: e.target.value })}>
          <option value="">Toutes catégories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className={f.priority ? 'set' : ''} value={f.priority} onChange={e => set({ priority: e.target.value })}>
          <option value="">Toutes priorités</option>
          {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        {f.view === 'list' && (
          <select value={f.sort} onChange={e => set({ sort: e.target.value })}>
            <option value="due">Tri par échéance</option>
            <option value="priority">Tri par priorité</option>
            <option value="client">Tri par dossier</option>
            <option value="updated">Modifiées récemment</option>
          </select>
        )}
        {f.view === 'list' && (
          <select className={f.groupBy !== 'none' ? 'set' : ''} value={f.groupBy} onChange={e => set({ groupBy: e.target.value as TaskGroupBy })} aria-label="Regrouper">
            {TASK_GROUPINGS.map(g => <option key={g.id} value={g.id}>{g.id === 'none' ? g.label : `Regrouper ${g.label.toLowerCase()}`}</option>)}
          </select>
        )}
        {isFiltered && <button className="btn ghost sm" onClick={() => { setF({ ...DEFAULTS, view: f.view, groupBy: f.groupBy, folds: f.folds }); setQ(''); }}>Effacer les filtres</button>}
      </div>

      {f.view === 'list' ? (
        <>
          <QuickAdd clientId={f.client} chooseClient />
          <GroupedTasks tasks={filtered} f={f} set={set} />
        </>
      ) : <Board tasks={filtered} />}
    </div>
  );
}

function Board({ tasks }: { tasks: Task[] }) {
  const store = useStore();
  const { clients } = useData();
  const toast = useToast();
  const nav = useTaskNav();
  const [over, setOver] = useState<Status | null>(null);
  const recent = Date.now() - 14 * 86400000;

  const drop = (status: Status, id: string) => {
    setOver(null);
    const spawned = store.setStatus(id, status);
    if (spawned) toast(`Prochaine occurrence créée pour le ${fmtDate(spawned.dueDate, 'short')}`);
  };

  return (
    <div className="board">
      {STATUSES.map(s => {
        const cards = tasks.filter(t => t.status === s.id && (s.id !== 'done' || (t.completedAt ?? 0) >= recent)).sort(byDue);
        return (
          <div key={s.id} className={`column ${over === s.id ? 'over' : ''}`}
            onDragOver={e => { e.preventDefault(); setOver(s.id); }}
            onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null); }}
            onDrop={e => { e.preventDefault(); drop(s.id, e.dataTransfer.getData('text/plain')); }}>
            <div className="column-head"><StatusIcon status={s.id} /> {s.label} <span className="count">{cards.length}</span></div>
            {s.id === 'done' && <p className="muted small column-note">14 derniers jours</p>}
            <div className="column-body">
              {cards.map(t => {
                const c = clients.find(x => x.id === t.clientId);
                return (
                  <div key={t.id} className={`card ${isOverdue(t) ? 'is-late' : ''}`} draggable
                    onDragStart={e => e.dataTransfer.setData('text/plain', t.id)}
                    onClick={() => nav.open(t.id)}>
                    <div className="card-title">{t.title}</div>
                    <div className="card-foot">
                      {c && <span className="code">{clientCode(c)}</span>}
                      <DueLabel task={t} compact />
                      <PrioTag priority={t.priority} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GroupedTasks({ tasks, f, set }: { tasks: Task[]; f: Filters; set: (p: Partial<Filters>) => void }) {
  const { clients, settings } = useData();
  if (!tasks.length) return <div className="empty-line">Aucune tâche ne correspond.</div>;
  if (f.groupBy === 'none') return <TaskList tasks={tasks} />;
  const groups = groupTasks(tasks, f.groupBy, clients, settings.routine);
  const def = TASK_GROUPS_OPEN_BY_DEFAULT[f.groupBy];
  const k = (key: string) => `${f.groupBy}:${key}`;
  const isOpen = (key: string) => f.folds[k(key)] ?? def;
  const setAll = (open: boolean) => set({ folds: { ...f.folds, ...Object.fromEntries(groups.map(g => [k(g.key), open])) } });
  const showClient = f.groupBy !== 'client';
  return (
    <div className="task-groups">
      {groups.length > 1 && (
        <div className="group-tools">
          <button className="btn ghost sm" onClick={() => setAll(true)}><ChevronsUpDown size={14} /> Tout déplier</button>
          <button className="btn ghost sm" onClick={() => setAll(false)}><ChevronsDownUp size={14} /> Tout replier</button>
        </div>
      )}
      {groups.map(g => {
        const late = g.list.filter(t => isOverdue(t)).length;
        const open = isOpen(g.key);
        return (
          <div key={g.key}>
            <GroupHeader
              label={g.label} count={g.list.length} open={open} muted={g.tone === 'muted'}
              onToggle={() => set({ folds: { ...f.folds, [k(g.key)]: !open } })}
              color={g.manager ? managerColor(clients, g.manager) : undefined}
              aside={late > 0 ? <span className="late-text">{late} en retard</span> : undefined}
            />
            {open && (
              <div className="group-body">
                {g.key === '~' && f.groupBy === 'client' && <p className="group-hint">Pour rattacher une tâche à un dossier : ouvre-la, puis choisis le dossier dans « Dossier ».</p>}
                <TaskList tasks={g.list} showClient={showClient} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
