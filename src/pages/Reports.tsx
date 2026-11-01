import { Download, Printer } from 'lucide-react';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { useData } from '../data/StoreContext';
import { daysBetween, fmtDate, isoFromMs, today } from '../lib/dates';
import { csv, download } from '../lib/files';
import { fmtMin } from '../lib/format';
import { usePref } from '../lib/usePref';
import { PRIORITIES, STATUSES, label } from '../domain/constants';
import { PRESETS, computeReport, groupByClient, type ReportParams } from '../domain/report';
import { isOverdue, timeIn } from '../domain/tasks';

const DEFAULTS: ReportParams = { preset: 'month', from: '', to: '', clientId: '', includeAll: false, showTime: true };

export function ReportsPage() {
  const { tasks, clients, settings } = useData();
  const [r, setR] = usePref<ReportParams>('report', DEFAULTS);
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    const id = params.get('dossier');
    if (id === null) return;
    setR(prev => ({ ...prev, clientId: id }));
    setParams(p => { p.delete('dossier'); return p; }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const R = computeReport(tasks, clients, r);
  const set = (patch: Partial<ReportParams>) => setR(prev => {
    const next = { ...prev, ...patch };
    if (patch.preset === 'custom' && !prev.from) { next.from = today().slice(0, 8) + '01'; next.to = today(); }
    return next;
  });
  const who = r.clientId ? R.nameOf(r.clientId) : 'Tous les dossiers';
  const waiting = R.remaining.filter(t => t.status === 'waiting').length;

  const exportCsv = () => {
    const rows: (string | number)[][] = [['Section', 'Dossier', 'Tâche', 'Catégorie', 'Statut', 'Priorité', 'Échéance', 'Terminée le', 'En retard', 'Temps sur la période (h)']];
    const h = (t: (typeof R.done)[number]) => (timeIn(t, R.from, R.to) / 60).toFixed(2).replace('.', ',');
    R.done.forEach(t => rows.push(['Réalisé', R.nameOf(t.clientId), t.title, t.category, label(STATUSES, t.status), label(PRIORITIES, t.priority), t.dueDate ? fmtDate(t.dueDate) : '', fmtDate(isoFromMs(t.completedAt!)), '', h(t)]));
    R.remaining.forEach(t => rows.push(['Reste à faire', R.nameOf(t.clientId), t.title, t.category, label(STATUSES, t.status), label(PRIORITIES, t.priority), t.dueDate ? fmtDate(t.dueDate) : '', '', isOverdue(t) ? 'Oui' : '', h(t)]));
    download(`rapport_${R.from}_${R.to}.csv`, csv(rows), 'text/csv');
  };

  return (
    <div className="page">
      <div className="no-print">
        <PageHeader
          title="Rapports"
          subtitle="Ce qui a été fait et ce qu’il reste à faire, par période et par dossier."
          actions={<>
            <button className="btn" onClick={exportCsv}><Download size={15} /> Excel (CSV)</button>
            <button className="btn primary" onClick={() => window.print()}><Printer size={15} /> Imprimer ou PDF</button>
          </>}
        />
        <div className="filters">
          <div className="segmented wrap">
            {PRESETS.map(p => <button key={p.id} className={r.preset === p.id ? 'on' : ''} onClick={() => set({ preset: p.id })}>{p.label}</button>)}
          </div>
          {r.preset === 'custom' && <>
            <input type="date" value={r.from} onChange={e => set({ from: e.target.value })} />
            <span className="muted">→</span>
            <input type="date" value={r.to} onChange={e => set({ to: e.target.value })} />
          </>}
          <select className={r.clientId ? 'set' : ''} value={r.clientId} onChange={e => set({ clientId: e.target.value })}>
            <option value="">Tous les dossiers</option>
            {[...clients].sort((a, b) => a.name.localeCompare(b.name, 'fr')).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <label className="switch"><input type="checkbox" checked={r.includeAll} onChange={e => set({ includeAll: e.target.checked })} /><span>Inclure les échéances futures</span></label>
          <label className="switch"><input type="checkbox" checked={r.showTime} onChange={e => set({ showTime: e.target.checked })} /><span>Temps passés</span></label>
        </div>
      </div>

      <article className="report">
        <header className="report-head">
          <div>
            <div className="eyebrow">Rapport d’activité</div>
            <h2>{R.label.charAt(0).toUpperCase() + R.label.slice(1)}</h2>
            <p>{who}</p>
          </div>
          <p className="muted small">Établi le {fmtDate(today())}{settings.profileName ? ` par ${settings.profileName}` : ''}</p>
        </header>

        <div className="kpi-row">
          <div className="kpi good"><b>{R.done.length}</b><span>terminées</span></div>
          <div className="kpi"><b>{R.remaining.length}</b><span>restant à faire</span></div>
          <div className={`kpi ${R.overdue.length ? 'late' : ''}`}><b>{R.overdue.length}</b><span>en retard</span></div>
          <div className="kpi"><b>{waiting}</b><span>en attente client</span></div>
          {r.showTime && <div className="kpi"><b>{fmtMin(R.minutes)}</b><span>temps passé</span></div>}
        </div>

        {(!r.clientId || R.perClient.length > 1) && R.perClient.length > 0 && (
          <>
            <h3>Synthèse par dossier</h3>
            <table className="table">
              <thead><tr><th>Dossier</th><th className="num">Terminées</th><th className="num">Restantes</th><th className="num">En retard</th><th className="num">En attente</th>{r.showTime && <th className="num">Temps</th>}</tr></thead>
              <tbody>
                {R.perClient.map(p => (
                  <tr key={p.id}><td>{p.name}</td><td className="num">{p.done}</td><td className="num">{p.remaining}</td><td className={`num ${p.overdue ? 'late-text' : ''}`}>{p.overdue}</td><td className="num">{p.waiting}</td>{r.showTime && <td className="num">{fmtMin(p.minutes)}</td>}</tr>
                ))}
              </tbody>
              <tfoot><tr><td>Total</td><td className="num">{R.done.length}</td><td className="num">{R.remaining.length}</td><td className="num">{R.overdue.length}</td><td className="num">{waiting}</td>{r.showTime && <td className="num">{fmtMin(R.minutes)}</td>}</tr></tfoot>
            </table>
          </>
        )}

        <h3>Travaux réalisés</h3>
        {R.done.length === 0 ? <p className="muted">Aucune tâche terminée sur la période.</p> : groupByClient(R.done, R.nameOf).map(([cid, list]) => (
          <div key={cid} className="report-group">
            <h4>{R.nameOf(cid)} <span className="muted">· {list.length}</span></h4>
            <table className="table">
              <thead><tr><th>Terminée le</th><th>Tâche</th><th>Catégorie</th><th>Échéance</th>{r.showTime && <th className="num">Temps</th>}</tr></thead>
              <tbody>{list.map(t => {
                const doneOn = isoFromMs(t.completedAt!);
                return (
                  <tr key={t.id}>
                    <td className="nowrap">{fmtDate(doneOn)}</td><td>{t.title}</td><td className="muted">{t.category}</td>
                    <td className="nowrap">{t.dueDate ? fmtDate(t.dueDate) : '—'}{t.dueDate && doneOn > t.dueDate && <span className="late-text small"> · hors délai</span>}</td>
                    {r.showTime && <td className="num">{fmtMin(timeIn(t, R.from, R.to))}</td>}
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        ))}

        <h3>Reste à faire {!r.includeAll && <span className="muted small">· échéance au plus tard le {fmtDate(R.to)}, ou sans échéance</span>}</h3>
        {R.remaining.length === 0 ? <p className="muted">Rien à faire sur la période.</p> : groupByClient(R.remaining, R.nameOf).map(([cid, list]) => (
          <div key={cid} className="report-group">
            <h4>{R.nameOf(cid)} <span className="muted">· {list.length}</span></h4>
            <table className="table">
              <thead><tr><th>Échéance</th><th>Tâche</th><th>Statut</th><th>Priorité</th><th>Étapes</th></tr></thead>
              <tbody>{list.map(t => (
                <tr key={t.id} className={isOverdue(t) ? 'late-row' : ''}>
                  <td className="nowrap">{t.dueDate ? fmtDate(t.dueDate) : '—'}{isOverdue(t) && <span className="late-text small"> · {daysBetween(t.dueDate, today())} j de retard</span>}</td>
                  <td>{t.title}</td><td>{label(STATUSES, t.status)}</td><td>{label(PRIORITIES, t.priority)}</td>
                  <td className="muted">{t.checklist.length ? `${t.checklist.filter(c => c.done).length}/${t.checklist.length}` : '—'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ))}
      </article>
    </div>
  );
}
