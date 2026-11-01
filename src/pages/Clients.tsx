import { CalendarPlus, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDialogs } from '../components/Dialogs';
import { PageHeader } from '../components/PageHeader';
import { useData } from '../data/StoreContext';
import { fmtDate } from '../lib/dates';
import { fmtMin, pct } from '../lib/format';
import { usePref } from '../lib/usePref';
import { managerColor } from '../components/managers';
import { REGIMES_TVA } from '../domain/constants';
import { fmtDays } from '../domain/planning';
import { clientStats } from '../domain/stats';
import { clientCode } from '../domain/tasks';

export function ClientsPage() {
  const { clients, tasks } = useData();
  const dialogs = useDialogs();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [prefs, setPrefs] = usePref('clients', { archived: false });
  const year = new Date().getFullYear();
  const list = clients
    .filter(c => prefs.archived || !c.archived)
    .filter(c => !q || `${c.name} ${clientCode(c)} ${c.siren} ${c.contact} ${c.activite}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  const activeIds = clients.filter(c => !c.archived).map(c => c.id);

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
        <label className="search-field"><Search size={14} /><input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Nom, code, SIREN, interlocuteur…" /></label>
        <label className="switch"><input type="checkbox" checked={prefs.archived} onChange={e => setPrefs({ archived: e.target.checked })} /><span>Afficher les archivés</span></label>
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
          {list.map(c => {
            const st = clientStats(c, tasks, year);
            const budget = Number(c.budgetHeures) * 60;
            return (
              <div key={c.id} role="row" tabIndex={0} className={`ct-row ${c.archived ? 'archived' : ''}`}
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
                <span className="small ellipsis">{st.next ? <><span className={st.overdue ? 'late-text' : 'muted'}>{fmtDate(st.next.dueDate, 'short')}</span> · {st.next.title}</> : <span className="muted">—</span>}</span>
                <span className={`num small ${budget && st.minutesYear > budget ? 'late-text' : ''}`}>
                  {fmtMin(st.minutesYear)}{budget ? <span className="muted"> / {c.budgetHeures}h</span> : null}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
