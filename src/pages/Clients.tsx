import { CalendarPlus, ChevronsDownUp, ChevronsUpDown, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDialogs } from '../components/Dialogs';
import { GroupHeader } from '../components/GroupHeader';
import { managerColor } from '../components/managers';
import { PageHeader } from '../components/PageHeader';
import { useData } from '../data/StoreContext';
import { fmtDate } from '../lib/dates';
import { fmtMin, pct } from '../lib/format';
import { usePref } from '../lib/usePref';
import { REGIMES_TVA } from '../domain/constants';
import { CLIENT_GROUPINGS, groupClients, type ClientGroupBy } from '../domain/grouping';
import { fmtDays } from '../domain/planning';
import { clientStats } from '../domain/stats';
import { clientCode } from '../domain/tasks';
import type { Client, Task } from '../domain/types';

interface Prefs { archived: boolean; groupBy: ClientGroupBy; closed: Record<string, boolean> }

export function ClientsPage() {
  const { clients, tasks } = useData();
  const dialogs = useDialogs();
  const [q, setQ] = useState('');
  const [prefs, setPrefs] = usePref<Prefs>('clients', { archived: false, groupBy: 'manager', closed: {} });
  const year = new Date().getFullYear();
  const list = clients
    .filter(c => prefs.archived || !c.archived)
    .filter(c => !q || `${c.name} ${clientCode(c)} ${c.siren} ${c.contact} ${c.activite} ${c.manager}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  const activeIds = clients.filter(c => !c.archived).map(c => c.id);
  const groups = groupClients(list, prefs.groupBy);
  const grouped = prefs.groupBy !== 'none';
  const isOpen = (key: string) => !!q || !prefs.closed[`${prefs.groupBy}:${key}`];
  const toggle = (key: string) => setPrefs(p => ({ ...p, closed: { ...p.closed, [`${p.groupBy}:${key}`]: isOpen(key) } }));
  const setAll = (open: boolean) => setPrefs(p => ({ ...p, closed: Object.fromEntries(groups.map(g => [`${p.groupBy}:${g.key}`, !open])) }));

  return (
    <div className="page">
      <PageHeader
        title="Dossiers"
        subtitle={`${activeIds.length} dossier${activeIds.length > 1 ? 's' : ''} actif${activeIds.length > 1 ? 's' : ''}`}
        actions={<>
          {activeIds.length > 0 && <button className="btn" onClick={() => dialogs.openGenerator(activeIds)}><CalendarPlus size={15} /> Poser les échéances</button>}
          <button className="btn primary" onClick={() => dialogs.openClient()}><Plus size={15} /> Nouveau dossier</button>
        </>}
      />
      <div className="filters">
        <label className="search-field"><Search size={14} /><input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Nom, code, SIREN, manager…" /></label>
        <select className={grouped ? 'set' : ''} value={prefs.groupBy} onChange={e => setPrefs(p => ({ ...p, groupBy: e.target.value as ClientGroupBy }))} aria-label="Regrouper par">
          {CLIENT_GROUPINGS.map(g => <option key={g.id} value={g.id}>{g.id === 'none' ? 'Sans regroupement' : `Regrouper par ${g.label.toLowerCase()}`}</option>)}
        </select>
        <label className="switch"><input type="checkbox" checked={prefs.archived} onChange={e => setPrefs(p => ({ ...p, archived: e.target.checked }))} /><span>Afficher les archivés</span></label>
        {grouped && groups.length > 1 && (
          <div className="group-tools">
            <button className="btn ghost sm" onClick={() => setAll(true)}><ChevronsUpDown size={14} /> Tout déplier</button>
            <button className="btn ghost sm" onClick={() => setAll(false)}><ChevronsDownUp size={14} /> Tout replier</button>
          </div>
        )}
      </div>

      {list.length === 0 ? (
        <div className="empty-block">
          <p>{q ? 'Aucun dossier ne correspond.' : 'Aucun dossier pour le moment.'}</p>
          {!q && <button className="btn primary" onClick={() => dialogs.openClient()}><Plus size={15} /> Créer un dossier</button>}
        </div>
      ) : (
        <div className="client-table" role="table">
          <div className="ct-head" role="row">
            <span>Dossier</span><span>Manager</span><span>Alloué</span><span>Échéances {year}</span><span className="num">Ouvertes</span><span>Prochaine échéance</span><span className="num">Temps</span>
          </div>
          {groups.map(g => {
            const stats = g.list.map(c => clientStats(c, tasks, year));
            const late = stats.reduce((n, s) => n + s.overdue, 0);
            const alloc = g.list.reduce((n, c) => n + (c.joursMois || 0), 0);
            const open = !grouped || isOpen(g.key);
            return (
              <div key={g.key} className="client-group">
                {grouped && (
                  <GroupHeader
                    label={g.label} count={g.list.length} open={open} onToggle={() => toggle(g.key)} muted={g.tone === 'muted'}
                    color={prefs.groupBy === 'manager' && g.manager ? managerColor(clients, g.manager) : undefined}
                    aside={<>{alloc > 0 && <span>{fmtDays(alloc)} / mois</span>}{late > 0 && <span className="late-text">{late} en retard</span>}</>}
                  />
                )}
                {open && g.list.map((c, i) => <ClientRow key={c.id} c={c} st={stats[i]} clients={clients} />)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ClientRow({ c, st, clients }: { c: Client; st: ReturnType<typeof clientStats>; clients: Client[] }) {
  const navigate = useNavigate();
  const budget = Number(c.budgetHeures) * 60;
  const next: Task | undefined = st.next;
  return (
    <div role="row" tabIndex={0} className={`ct-row ${c.archived ? 'archived' : ''}`}
      onClick={() => navigate(`/dossiers/${c.id}`)} onKeyDown={e => { if (e.key === 'Enter') navigate(`/dossiers/${c.id}`); }}>
      <span className="ct-name">
        <span className="code lg">{clientCode(c)}</span>
        <span><b>{c.name}</b><small>{[c.forme, REGIMES_TVA.find(r => r.id === c.regimeTva)?.short, c.activite].filter(Boolean).join(' · ')}</small></span>
      </span>
      <span className="small manager-cell">{c.manager ? <><i style={{ background: managerColor(clients, c.manager) }} />{c.manager}</> : <span className="muted">—</span>}</span>
      <span className="small mono">{c.joursMois ? fmtDays(c.joursMois) : '—'}</span>
      <span className="ct-progress">
        <span className="meter"><span style={{ width: `${pct(st.yearDone, st.yearTotal)}%` }} /></span>
        <small>{st.yearDone}/{st.yearTotal}</small>
      </span>
      <span className="num">{st.open.length}{st.overdue > 0 && <span className="late-pill">{st.overdue} en retard</span>}</span>
      <span className="small ellipsis">{next ? <><span className={st.overdue ? 'late-text' : 'muted'}>{fmtDate(next.dueDate, 'short')}</span> · {next.title}</> : <span className="muted">—</span>}</span>
      <span className={`num small ${budget && st.minutesYear > budget ? 'late-text' : ''}`}>
        {fmtMin(st.minutesYear)}{budget ? <span className="muted"> / {c.budgetHeures}h</span> : null}
      </span>
    </div>
  );
}
