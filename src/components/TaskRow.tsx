import { Repeat } from 'lucide-react';
import type { ReactNode } from 'react';
import { useData } from '../data/StoreContext';
import { fmtMin } from '../lib/format';
import { RECURRENCES, label } from '../domain/constants';
import { clientCode, isOverdue, timeSpent } from '../domain/tasks';
import type { Task } from '../domain/types';
import { DueLabel } from './DueLabel';
import { StatusIcon } from './StatusIcon';
import { useComplete } from './useComplete';
import { useTaskNav } from './useTaskNav';

export function PrioTag({ priority }: { priority: Task['priority'] }) {
  if (priority === 'urgent') return <span className="tag red">Urgent</span>;
  if (priority === 'high') return <span className="tag amber">Haute</span>;
  return null;
}

export function Check({ task }: { task: Task }) {
  const complete = useComplete();
  const done = task.status === 'done';
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={done ? 'Rouvrir la tâche' : 'Marquer comme terminée'}
      className={`check p-${task.priority} ${done ? 'on' : ''}`}
      onClick={e => { e.stopPropagation(); complete(task.id); }}
    >
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 8.4l2.2 2.2 4.8-5" /></svg>
    </button>
  );
}

export function TaskRow({ task, showClient = true, extra, clientAsTitle = false }: { task: Task; showClient?: boolean; extra?: ReactNode; clientAsTitle?: boolean }) {
  const { clients, settings } = useData();
  const nav = useTaskNav();
  const client = clients.find(c => c.id === task.clientId);
  const spent = timeSpent(task);
  const ckDone = task.checklist.filter(c => c.done).length;
  const running = settings.timer?.taskId === task.id;
  const meta: ReactNode[] = [];
  if (showClient && client && !clientAsTitle) meta.push(client.name);
  if (!clientAsTitle) meta.push(task.category);
  if (task.checklist.length) meta.push(`${ckDone}/${task.checklist.length} étapes`);
  if (spent) meta.push(fmtMin(spent));
  if (task.recurrence) meta.push(<span className="inline-icon"><Repeat size={11} />{label(RECURRENCES, task.recurrence).replace('Chaque ', '')}</span>);
  if (extra) meta.push(extra);

  return (
    <div
      className={`task-row ${isOverdue(task) ? 'is-late' : ''} ${task.status === 'done' ? 'is-done' : ''} ${nav.openId === task.id ? 'is-active' : ''}`}
      onClick={() => nav.open(task.id)}
      onKeyDown={e => { if (e.key === 'Enter') nav.open(task.id); }}
      tabIndex={0}
      role="button"
    >
      <Check task={task} />
      <div className="task-main">
        <div className="task-title">
          {running && <span className="rec" title="Chrono en cours" />}
          {(task.status === 'doing' || task.status === 'waiting') && <StatusIcon status={task.status} size={13} />}
          <span className="t">{clientAsTitle && client ? client.name : task.title}</span>
          <PrioTag priority={task.priority} />
        </div>
        <div className="task-meta">
          {meta.map((m, i) => <span key={i}>{m}</span>)}
        </div>
      </div>
      <div className="task-side">
        {showClient && client && <span className="code">{clientCode(client)}</span>}
        <DueLabel task={task} />
      </div>
    </div>
  );
}

export function TaskList({ tasks, showClient = true, empty, extra, clientAsTitle }: {
  tasks: Task[]; showClient?: boolean; empty?: ReactNode; extra?: (t: Task) => ReactNode; clientAsTitle?: boolean;
}) {
  if (!tasks.length) return empty ? <div className="empty-line">{empty}</div> : null;
  return <div className="task-list">{tasks.map(t => <TaskRow key={t.id} task={t} showClient={showClient} extra={extra?.(t)} clientAsTitle={clientAsTitle} />)}</div>;
}
