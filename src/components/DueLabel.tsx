import { daysBetween, fmtDate, parse, today } from '../lib/dates';
import type { Task } from '../domain/types';

/** Échéance lisible : « En retard · 3 j », « Aujourd’hui », « Demain », « jeudi », « 12 déc. ». */
export function DueLabel({ task, compact = false }: { task: Task; compact?: boolean }) {
  if (!task.dueDate) return compact ? null : <span className="due none">Sans échéance</span>;
  if (task.status === 'done') return <span className="due none">{fmtDate(task.dueDate, 'short')}</span>;
  const d = daysBetween(today(), task.dueDate);
  if (d < 0) return <span className="due late">{compact ? `${-d} j de retard` : `En retard · ${-d} j`}</span>;
  if (d === 0) return <span className="due today">Aujourd’hui</span>;
  if (d === 1) return <span className="due soon">Demain</span>;
  if (d < 7) return <span className="due soon">{parse(task.dueDate).toLocaleDateString('fr-FR', { weekday: 'long' })}</span>;
  const sameYear = task.dueDate.slice(0, 4) === today().slice(0, 4);
  return <span className="due">{fmtDate(task.dueDate, sameYear ? 'short' : 'medium')}</span>;
}
