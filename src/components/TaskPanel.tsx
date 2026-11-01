import { CalendarClock, Copy, Pause, Play, Trash2, X } from 'lucide-react';
import { PostponeDialog } from './PostponeDialog';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useData, useStore } from '../data/StoreContext';
import { fmtDate, fmtDateTime, today } from '../lib/dates';
import { fmtClock, fmtMin, parseDuration, uid } from '../lib/format';
import { CATEGORIES, PRIORITIES, RECURRENCES, STATUSES } from '../domain/constants';
import { clientCode, logEntry, newTask, startOf, timeSpent, withStatus } from '../domain/tasks';
import type { Task } from '../domain/types';
import { DueLabel } from './DueLabel';
import { StatusIcon } from './StatusIcon';
import { useToast } from './ui/Toasts';
import { useTaskNav } from './useTaskNav';
import { useNow } from './useNow';

function Prop({ label, children }: { label: string; children: ReactNode }) {
  return <div className="prop"><span className="prop-l">{label}</span><div className="prop-v">{children}</div></div>;
}

function AutoText({ value, onChange, onCommit, className, placeholder, autoFocus, singleLine }: {
  value: string; onChange: (v: string) => void; onCommit: () => void; className: string; placeholder: string; autoFocus?: boolean; singleLine?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      className={className}
      value={value}
      placeholder={placeholder}
      autoFocus={autoFocus}
      onChange={e => onChange(singleLine ? e.target.value.replace(/\n/g, ' ') : e.target.value)}
      onBlur={onCommit}
      onKeyDown={e => { if (singleLine && e.key === 'Enter') { e.preventDefault(); (e.target as HTMLTextAreaElement).blur(); } }}
    />
  );
}

export function TaskPanel() {
  const nav = useTaskNav();
  const store = useStore();
  const data = useData();
  const toast = useToast();
  const id = nav.openId;
  const isNew = id === 'new';
  const [draft, setDraft] = useState<Task | null>(null);

  useEffect(() => {
    if (isNew) setDraft(newTask({ clientId: nav.preset.clientId, dueDate: nav.preset.dueDate }));
    else setDraft(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const task = isNew ? draft : data.tasks.find(t => t.id === id) ?? null;

  // Champs texte : saisie locale, enregistrement à la sortie du champ ou après une pause.
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  useEffect(() => { setTitle(task?.title ?? ''); setDesc(task?.description ?? ''); /* eslint-disable-next-line */ }, [task?.id]);

  useEffect(() => {
    if (!id) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('dialog[open]')) nav.close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [id, nav]);

  const update = (patch: Partial<Task>) => {
    if (!task) return;
    if (isNew) {
      const next = { ...task, ...patch };
      setDraft(next);
      if (next.title.trim()) {
        const { task: created, spawned } = withStatus({ ...next, title: next.title.trim(), status: 'todo', log: [...next.log, logEntry('Tâche créée')] }, next.status);
        store.upsertTasks(spawned ? [created, spawned] : [created]);
        nav.replace(created.id);
      }
      return;
    }
    const spawned = store.updateTask(task.id, patch);
    if (spawned) toast(`Prochaine occurrence créée pour le ${fmtDate(spawned.dueDate, 'short')}`);
  };

  // Enregistrement différé du titre et de la description.
  useEffect(() => {
    if (!task || isNew || title === task.title || !title.trim()) return;
    const h = setTimeout(() => update({ title: title.trim() }), 600);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);
  useEffect(() => {
    if (!task || isNew || desc === task.description) return;
    const h = setTimeout(() => update({ description: desc }), 600);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desc]);

  if (!id) return null;

  return (
    <>
      <div className="scrim" onClick={nav.close} />
      <aside className="panel" role="dialog" aria-label="Tâche">
        {!task ? (
          <div className="panel-missing">
            <p>Cette tâche n’existe plus.</p>
            <button className="btn" onClick={nav.close}>Fermer</button>
          </div>
        ) : (
          <PanelContent
            task={task} isNew={isNew} title={title} desc={desc}
            setTitle={setTitle} setDesc={setDesc} update={update}
          />
        )}
      </aside>
    </>
  );
}

function PanelContent({ task, isNew, title, desc, setTitle, setDesc, update }: {
  task: Task; isNew: boolean; title: string; desc: string;
  setTitle: (v: string) => void; setDesc: (v: string) => void; update: (p: Partial<Task>) => void;
}) {
  const store = useStore();
  const data = useData();
  const toast = useToast();
  const nav = useTaskNav();
  const client = data.clients.find(c => c.id === task.clientId);
  const timer = data.settings.timer;
  const running = timer?.taskId === task.id;
  const now = useNow(running);
  const [step, setStep] = useState('');
  const [postponing, setPostponing] = useState(false);
  const [comment, setComment] = useState('');
  const [te, setTe] = useState({ date: today(), dur: '', note: '' });
  const spent = timeSpent(task);
  const ckDone = task.checklist.filter(c => c.done).length;
  const clients = useMemo(() => [...data.clients].sort((a, b) => a.name.localeCompare(b.name, 'fr')), [data.clients]);

  const commitTitle = () => {
    const v = title.trim();
    if (isNew) { if (v) update({ title: v }); return; }
    if (!v) { setTitle(task.title); return; }
    if (v !== task.title) update({ title: v });
  };

  const addStep = () => {
    const v = step.trim();
    if (!v) return;
    update({ checklist: [...task.checklist, { id: uid(), text: v, done: false }] });
    setStep('');
  };
  const addTime = () => {
    const minutes = parseDuration(te.dur);
    if (!minutes) { toast('Durée non reconnue. Exemples : 1h30, 45, 0:30', { tone: 'error' }); return; }
    update({
      timeEntries: [...task.timeEntries, { id: uid(), date: te.date || today(), minutes, note: te.note.trim() }],
      log: [...task.log, logEntry(`Temps ajouté : ${fmtMin(minutes)} (${fmtDate(te.date)})`)],
    });
    setTe({ date: today(), dur: '', note: '' });
  };
  const addComment = () => {
    const v = comment.trim();
    if (!v) return;
    update({ log: [...task.log, logEntry(v, 'comment')] });
    setComment('');
  };
  const remove = () => {
    const snapshot = task;
    nav.close();
    store.deleteTasks([task.id]);
    toast('Tâche supprimée', { action: { label: 'Annuler', onClick: () => store.upsertTasks([snapshot]) } });
  };
  const duplicate = () => {
    const copy = newTask({
      ...task, id: uid(), title: `${task.title} (copie)`, status: 'todo', completedAt: null, waitingSince: null,
      key: null, nextSpawned: false, timeEntries: [], createdAt: Date.now(),
      checklist: task.checklist.map(c => ({ ...c, id: uid(), done: false })),
      log: [logEntry('Tâche dupliquée')],
    });
    store.upsertTasks([copy]);
    nav.open(copy.id);
  };
  const toggleTimer = () => {
    if (running) {
      const m = store.stopTimer();
      toast(m ? `${fmtMin(m)} enregistrées` : 'Chrono arrêté (moins d’une minute)');
    } else store.startTimer(task.id);
  };

  return (
    <>
      <header className="panel-head">
        <span className="crumb">
          {client ? <><span className="code">{clientCode(client)}</span>{client.name}</> : <span className="muted">Sans dossier</span>}
        </span>
        <div className="panel-actions">
          {!isNew && (
            <>
              <button className={`btn sm ${running ? 'rec-btn' : ''}`} onClick={toggleTimer} title={running ? 'Arrêter et enregistrer le temps' : 'Lancer le chrono'}>
                {running ? <><Pause size={13} /> {fmtClock(now - (timer?.start ?? now))}</> : <><Play size={13} /> Chrono</>}
              </button>
              {task.status !== 'done' && <button className="btn sm" onClick={() => setPostponing(true)} title="Reporter la tâche à plus tard"><CalendarClock size={13} /> Reporter</button>}
              <button className="icon-btn" onClick={duplicate} title="Dupliquer"><Copy size={15} /></button>
              <button className="icon-btn danger" onClick={remove} title="Supprimer"><Trash2 size={15} /></button>
            </>
          )}
          <button className="icon-btn" onClick={nav.close} title="Fermer (Échap)"><X size={17} /></button>
        </div>
      </header>
      {!isNew && <PostponeDialog task={task} open={postponing} onClose={() => setPostponing(false)} />}
      {task.reportedUntil && task.status !== 'done' && (
        <div className="panel-banner">
          <CalendarClock size={15} /> Reportée jusqu’au {fmtDate(task.reportedUntil, 'short')}.
          <button className="btn sm" onClick={() => update({ reportedUntil: null, status: 'doing', log: [...task.log, logEntry('Reprise de la tâche')] })}>Reprendre maintenant</button>
        </div>
      )}

      <div className="panel-body">
        <AutoText
          className="title-input" value={title} placeholder="Intitulé de la tâche" autoFocus={isNew} singleLine
          onChange={setTitle} onCommit={commitTitle}
        />
        {isNew && <p className="hint">Saisis un intitulé : la tâche est enregistrée automatiquement.</p>}

        <div className="props">
          <Prop label="Statut">
            <span className="with-icon"><StatusIcon status={task.status} />
              <select value={task.status} onChange={e => update({ status: e.target.value as Task['status'] })}>
                {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </span>
          </Prop>
          <Prop label="Début">
            <input type="date" value={startOf(task, data.settings.routine)} onChange={e => update({ startDate: e.target.value })} />
          </Prop>
          <Prop label="Échéance">
            <span className="with-hint">
              <input type="date" value={task.dueDate} onChange={e => update({ dueDate: e.target.value })} />
              {task.dueDate && <DueLabel task={task} compact />}
            </span>
          </Prop>
          <Prop label="Dossier">
            <select value={task.clientId} onChange={e => update({ clientId: e.target.value })}>
              <option value="">Aucun — à lier plus tard</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.archived ? ' (archivé)' : ''}</option>)}
            </select>
          </Prop>
          <Prop label="Priorité">
            <select value={task.priority} onChange={e => update({ priority: e.target.value as Task['priority'] })}>
              {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </Prop>
          <Prop label="Catégorie">
            <select value={task.category} onChange={e => update({ category: e.target.value })}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Prop>
          <Prop label="Estimation">
            <span className="with-hint">
              <input type="number" min="0" step="0.25" value={task.estimate} placeholder="—" onChange={e => update({ estimate: e.target.value })} />
              <span className="muted">heures</span>
            </span>
          </Prop>
          <Prop label="Récurrence">
            <select value={task.recurrence} onChange={e => update({ recurrence: e.target.value as Task['recurrence'] })}>
              {RECURRENCES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </Prop>
        </div>

        <AutoText className="desc-input" value={desc} placeholder="Ajouter des notes, les pièces manquantes, des consignes…" onChange={setDesc}
          onCommit={() => { if (!isNew && desc !== task.description) update({ description: desc }); if (isNew) update({ description: desc }); }} />

        <section className="panel-sec">
          <h3>Étapes {task.checklist.length > 0 && <span className="count">{ckDone}/{task.checklist.length}</span>}</h3>
          {task.checklist.length > 0 && <div className="meter"><span style={{ width: `${(ckDone / task.checklist.length) * 100}%` }} /></div>}
          <ul className="steps">
            {task.checklist.map(c => (
              <li key={c.id} className={c.done ? 'done' : ''}>
                <label>
                  <input type="checkbox" checked={c.done} onChange={() => update({ checklist: task.checklist.map(x => x.id === c.id ? { ...x, done: !x.done } : x) })} />
                  <span>{c.text}</span>
                </label>
                <button className="icon-btn xs" onClick={() => update({ checklist: task.checklist.filter(x => x.id !== c.id) })} aria-label="Supprimer l’étape"><X size={13} /></button>
              </li>
            ))}
          </ul>
          <input className="ghost-input" value={step} placeholder="+ Ajouter une étape" onChange={e => setStep(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addStep(); }} onBlur={addStep} />
        </section>

        <section className="panel-sec">
          <h3>Temps passé <span className="count">{fmtMin(spent)}{task.estimate ? ` sur ${task.estimate} h estimées` : ''}</span></h3>
          {task.timeEntries.length > 0 && (
            <ul className="time-entries">
              {[...task.timeEntries].sort((a, b) => b.date.localeCompare(a.date)).map(e => (
                <li key={e.id}>
                  <span className="muted">{fmtDate(e.date, 'short')}</span>
                  <b>{fmtMin(e.minutes)}</b>
                  <span className="muted ellipsis">{e.note}</span>
                  <button className="icon-btn xs" onClick={() => update({ timeEntries: task.timeEntries.filter(x => x.id !== e.id) })} aria-label="Supprimer"><X size={13} /></button>
                </li>
              ))}
            </ul>
          )}
          <div className="time-add">
            <input type="date" value={te.date} onChange={e => setTe({ ...te, date: e.target.value })} />
            <input value={te.dur} placeholder="1h30" onChange={e => setTe({ ...te, dur: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') addTime(); }} />
            <input value={te.note} placeholder="Note" onChange={e => setTe({ ...te, note: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') addTime(); }} />
            <button className="btn sm" onClick={addTime}>Ajouter</button>
          </div>
        </section>

        <section className="panel-sec">
          <h3>Activité</h3>
          <div className="comment-box">
            <textarea rows={2} value={comment} placeholder="Ajouter un commentaire : appel, relance, information…" onChange={e => setComment(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addComment(); }} />
            {comment.trim() && <button className="btn sm primary" onClick={addComment}>Publier</button>}
          </div>
          <ol className="activity">
            {[...task.log].reverse().map((l, i) => (
              <li key={i} className={l.type}>
                <p>{l.text}</p>
                <time>{fmtDateTime(l.at)}</time>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
