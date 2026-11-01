import { ArrowRight, CalendarClock, FastForward, PlayCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useData, useStore } from '../data/StoreContext';
import { addMonths, fmtDate, parse, today } from '../lib/dates';
import { fmtDays } from '../domain/planning';
import { REASONS, freeSlots, giveTime, postponeTask, suggestAlternatives, type ReasonId } from '../domain/postpone';
import { clientCode, startOf } from '../domain/tasks';
import type { Task } from '../domain/types';
import { addWorkingDays, nextMonday } from '../domain/workdays';
import { DueLabel } from './DueLabel';
import { Dialog } from './ui/Dialog';
import { useToast } from './ui/Toasts';
import { useTaskNav } from './useTaskNav';

const longDate = (d: string) => parse(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

/** Reporter une tâche bloquée, libérer son temps, puis choisir autre chose à faire. */
export function PostponeDialog({ task, open, onClose }: { task: Task; open: boolean; onClose: () => void }) {
  const store = useStore();
  const data = useData();
  const toast = useToast();
  const nav = useTaskNav();
  const ref = today();
  const client = data.clients.find(c => c.id === task.clientId);
  const presets = useMemo(() => [
    { label: 'Demain', date: addWorkingDays(ref, 1) },
    { label: 'Dans 3 jours ouvrés', date: addWorkingDays(ref, 3) },
    { label: 'Lundi prochain', date: nextMonday(ref) },
    { label: 'Dans 2 semaines', date: addWorkingDays(ref, 10) },
  ], [ref]);

  const [step, setStep] = useState<'form' | 'suggest'>('form');
  const [reason, setReason] = useState<ReasonId>('docs');
  const [until, setUntil] = useState(presets[1].date);
  const [due, setDue] = useState(task.dueDate);
  const [note, setNote] = useState('');
  const [waiting, setWaiting] = useState(true);
  const [release, setRelease] = useState(true);
  const [freedToday, setFreedToday] = useState<{ days: number; phaseId: string }>({ days: 0, phaseId: '' });

  useEffect(() => {
    if (!open) return;
    setStep('form'); setReason('docs'); setUntil(presets[1].date); setDue(task.dueDate); setNote(''); setWaiting(true); setRelease(true);
    setFreedToday({ days: 0, phaseId: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task.id]);

  // Créneaux prévus pour ce dossier d'ici la reprise (mois en cours et suivants concernés)
  const months = useMemo(() => {
    const list: string[] = [];
    for (let m = ref.slice(0, 7); m <= until.slice(0, 7); m = addMonths(`${m}-01`, 1).slice(0, 7)) list.push(m);
    return list;
  }, [ref, until]);
  const planned = months.flatMap(m => freeSlots(data.settings.plans[m] ?? [], task.clientId, ref, until).freed);
  const plannedDays = planned.reduce((s, b) => s + b.days, 0);
  const late = !!due && until > due;

  const confirm = () => {
    store.upsertTasks([postponeTask(task, { until, dueDate: due, reason, note, waiting })]);
    let today0 = { days: 0, phaseId: '' };
    if (release && task.clientId) {
      for (const m of months) {
        const res = freeSlots(store.data.settings.plans[m] ?? [], task.clientId, ref, until);
        if (res.freed.length) store.setPlan(m, res.blocks);
        const t = res.freed.filter(b => b.date === ref);
        if (t.length) today0 = { days: today0.days + t.reduce((s, b) => s + b.days, 0), phaseId: t[0].phaseId };
      }
    }
    setFreedToday(today0);
    toast(`Tâche reportée au ${fmtDate(until, 'short')}`);
    setStep('suggest');
  };

  const take = (t: Task) => {
    if (freedToday.days > 0 && t.clientId) {
      const m = ref.slice(0, 7);
      store.setPlan(m, giveTime(store.data.settings.plans[m] ?? [], ref, t.clientId, freedToday.days, freedToday.phaseId));
    }
    if (t.status === 'todo') store.setStatus(t.id, 'doing');
    onClose();
    nav.open(t.id);
    toast(freedToday.days > 0 ? `${fmtDays(freedToday.days)} réattribué à ${data.clients.find(c => c.id === t.clientId)?.name ?? 'cette tâche'} aujourd’hui` : 'Tâche ouverte');
  };

  const suggestions = useMemo(() => suggestAlternatives(store.data.tasks, data.settings.routine, task, ref),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step, data.tasks, data.settings.routine, task.id, ref]);

  const Row = ({ t, ahead }: { t: Task; ahead?: boolean }) => {
    const c = data.clients.find(x => x.id === t.clientId);
    const done = t.checklist.filter(x => x.done).length;
    return (
      <li className="alt-row">
        <div className="alt-main">
          <b>{c ? <><span className="code">{clientCode(c)}</span> {c.name}</> : t.title}</b>
          <span className="muted small">{c ? t.title.split(' – ')[0] : t.category}{t.checklist.length ? ` · ${done}/${t.checklist.length} étapes` : ''}
            {ahead ? ` · prévue à partir du ${fmtDate(startOf(t, data.settings.routine), 'short')}` : ''}</span>
        </div>
        <DueLabel task={t} compact />
        <button className="btn sm" onClick={() => take(t)}>Prendre <ArrowRight size={13} /></button>
      </li>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} size="md"
      title={step === 'form' ? <span className="title-icon"><CalendarClock size={18} /> Reporter la tâche</span> : 'Que faire à la place ?'}
      footer={step === 'form' ? <>
        <span className="spacer" />
        <button className="btn" onClick={onClose}>Annuler</button>
        <button className="btn primary" disabled={!until || until <= ref} onClick={confirm}>Reporter au {fmtDate(until, 'short')}</button>
      </> : <>
        <span className="spacer" />
        <button className="btn" onClick={onClose}>Rien pour l’instant</button>
      </>}>
      {step === 'form' ? (
        <div className="postpone">
          <p className="muted">{client ? <><b className="ink">{client.name}</b> · </> : null}{task.title}</p>

          <div className="field"><span>Pourquoi ?</span>
            <div className="choice-list">
              {REASONS.map(r => (
                <label key={r.id} className={`choice ${reason === r.id ? 'on' : ''}`}>
                  <input type="radio" name="reason" checked={reason === r.id} onChange={() => { setReason(r.id); setWaiting(r.waiting); }} />
                  {r.label}
                </label>
              ))}
            </div>
          </div>

          <div className="field"><span>Reprendre le…</span>
            <div className="chips">
              {presets.map(p => (
                <button key={p.label} type="button" className={`chip ${until === p.date ? 'on' : ''}`} onClick={() => setUntil(p.date)}>
                  {p.label}<small>{fmtDate(p.date, 'short')}</small>
                </button>
              ))}
              <input type="date" value={until} min={addWorkingDays(ref, 1)} onChange={e => setUntil(e.target.value)} aria-label="Autre date" />
            </div>
            <span className="hint">La tâche réapparaîtra {longDate(until)} dans « À reprendre ».</span>
          </div>

          <label className="field"><span>Échéance</span>
            <input type="date" value={due} onChange={e => setDue(e.target.value)} />
          </label>
          {late && (
            <div className="notice warn">La reprise est après l’échéance du {fmtDate(due, 'short')}.
              {client?.manager ? ` Pense à prévenir ${client.manager}` : ' Pense à prévenir le manager'}, ou repousse l’échéance si c’est possible.</div>
          )}

          <label className="field"><span>Précision (facultatif)</span>
            <input value={note} placeholder="Ex. relevés bancaires d’octobre, factures fournisseurs…" onChange={e => setNote(e.target.value)} />
          </label>

          <label className="switch"><input type="checkbox" checked={waiting} onChange={e => setWaiting(e.target.checked)} /><span>Passer la tâche « En attente client »</span></label>
          {plannedDays > 0 && (
            <label className="switch"><input type="checkbox" checked={release} onChange={e => setRelease(e.target.checked)} />
              <span>Libérer les créneaux prévus pour ce dossier d’ici là ({fmtDays(plannedDays)})</span></label>
          )}
        </div>
      ) : (
        <div className="postpone">
          {freedToday.days > 0
            ? <div className="notice ok">Tu as libéré <b>{fmtDays(freedToday.days)}</b> aujourd’hui. Choisis une tâche : ce temps lui sera donné dans ta répartition.</div>
            : <p className="muted">La tâche est reportée. Voici ce que tu peux faire maintenant :</p>}
          {suggestions.now.length > 0 && <>
            <h4 className="alt-title"><PlayCircle size={15} /> Disponibles maintenant</h4>
            <ul className="alt-list">{suggestions.now.map(t => <Row key={t.id} t={t} />)}</ul>
          </>}
          {suggestions.ahead.length > 0 && <>
            <h4 className="alt-title"><FastForward size={15} /> À avancer</h4>
            <ul className="alt-list">{suggestions.ahead.map(t => <Row key={t.id} t={t} ahead />)}</ul>
          </>}
          {!suggestions.now.length && !suggestions.ahead.length && <p className="muted">Aucune autre tâche ouverte pour le moment.</p>}
        </div>
      )}
    </Dialog>
  );
}
