import { today } from '../lib/dates';
import { byDue, isOpen, isOverdue, timeIn } from './tasks';
import type { Client, Task } from './types';

export function clientStats(c: Client, tasks: Task[], year = new Date().getFullYear()) {
  const all = tasks.filter(t => t.clientId === c.id);
  const y = String(year);
  const yearTasks = all.filter(t => t.dueDate.startsWith(y));
  const open = all.filter(isOpen);
  const ref = today();
  return {
    all,
    open,
    overdue: open.filter(t => isOverdue(t, ref)).length,
    waiting: open.filter(t => t.status === 'waiting').length,
    yearDone: yearTasks.filter(t => t.status === 'done').length,
    yearTotal: yearTasks.length,
    minutesYear: all.reduce((s, t) => s + timeIn(t, `${y}-01-01`, `${y}-12-31`), 0),
    next: open.filter(t => t.dueDate).sort(byDue)[0] as Task | undefined,
  };
}
