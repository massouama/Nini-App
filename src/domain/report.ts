import { addDays, addMonths, endOfMonth, fmtDate, isoFromMs, monthName, parse, startOfWeek, today } from '../lib/dates';
import { byDue, isOpen, isOverdue, timeIn } from './tasks';
import type { Client, Task } from './types';

export type Preset = 'week' | 'lastweek' | 'month' | 'lastmonth' | 'quarter' | 'year' | 'custom';
export interface ReportParams { preset: Preset; from: string; to: string; clientId: string; includeAll: boolean; showTime: boolean }

export const PRESETS: { id: Preset; label: string }[] = [
  { id: 'week', label: 'Cette semaine' },
  { id: 'lastweek', label: 'Semaine dernière' },
  { id: 'month', label: 'Ce mois' },
  { id: 'lastmonth', label: 'Mois dernier' },
  { id: 'quarter', label: 'Ce trimestre' },
  { id: 'year', label: 'Cette année' },
  { id: 'custom', label: 'Personnalisée' },
];

export function reportRange(r: ReportParams, ref = today()): { from: string; to: string; label: string } {
  const d = parse(ref), y = d.getFullYear(), m = d.getMonth();
  switch (r.preset) {
    case 'week': { const s = startOfWeek(ref); return { from: s, to: addDays(s, 6), label: `Semaine du ${fmtDate(s)}` }; }
    case 'lastweek': { const s = addDays(startOfWeek(ref), -7); return { from: s, to: addDays(s, 6), label: `Semaine du ${fmtDate(s)}` }; }
    case 'month': return { from: ref.slice(0, 8) + '01', to: endOfMonth(ref), label: `${monthName(m)} ${y}` };
    case 'lastmonth': {
      const s = addMonths(ref.slice(0, 8) + '01', -1);
      return { from: s, to: endOfMonth(s), label: `${monthName(parse(s).getMonth())} ${s.slice(0, 4)}` };
    }
    case 'quarter': {
      const q = Math.floor(m / 3);
      const s = `${y}-${String(q * 3 + 1).padStart(2, '0')}-01`;
      return { from: s, to: endOfMonth(addMonths(s, 2)), label: `${q + 1}${q ? 'e' : 'er'} trimestre ${y}` };
    }
    case 'year': return { from: `${y}-01-01`, to: `${y}-12-31`, label: `Année ${y}` };
    default: {
      const from = r.from || ref.slice(0, 8) + '01';
      const to = r.to || ref;
      return { from, to, label: `Du ${fmtDate(from)} au ${fmtDate(to)}` };
    }
  }
}

export interface ClientLine { id: string; name: string; done: number; remaining: number; overdue: number; waiting: number; minutes: number }

export function computeReport(tasks: Task[], clients: Client[], r: ReportParams, ref = today()) {
  const { from, to, label } = reportRange(r, ref);
  const scoped = tasks.filter(t => !r.clientId || t.clientId === r.clientId);
  const done = scoped
    .filter(t => t.status === 'done' && t.completedAt && isoFromMs(t.completedAt) >= from && isoFromMs(t.completedAt) <= to)
    .sort((a, b) => (a.completedAt ?? 0) - (b.completedAt ?? 0));
  const remaining = scoped.filter(t => isOpen(t) && (r.includeAll || !t.dueDate || t.dueDate <= to)).sort(byDue);
  const worked = scoped.filter(t => timeIn(t, from, to) > 0);
  const minutes = scoped.reduce((s, t) => s + timeIn(t, from, to), 0);
  const nameOf = (id: string) => clients.find(c => c.id === id)?.name ?? 'Sans dossier';
  const ids = [...new Set([...done, ...remaining, ...worked].map(t => t.clientId))];
  const perClient: ClientLine[] = ids.map(id => {
    const rem = remaining.filter(t => t.clientId === id);
    return {
      id, name: nameOf(id),
      done: done.filter(t => t.clientId === id).length,
      remaining: rem.length,
      overdue: rem.filter(t => isOverdue(t, ref)).length,
      waiting: rem.filter(t => t.status === 'waiting').length,
      minutes: scoped.filter(t => t.clientId === id).reduce((s, t) => s + timeIn(t, from, to), 0),
    };
  }).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  return { from, to, label, done, remaining, minutes, perClient, overdue: remaining.filter(t => isOverdue(t, ref)), nameOf };
}

export function groupByClient(tasks: Task[], nameOf: (id: string) => string) {
  const g = new Map<string, Task[]>();
  tasks.forEach(t => g.set(t.clientId, [...(g.get(t.clientId) ?? []), t]));
  return [...g.entries()].sort((a, b) => nameOf(a[0]).localeCompare(nameOf(b[0]), 'fr'));
}
