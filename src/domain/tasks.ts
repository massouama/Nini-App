import { addDays, addMonths, fmtDate, isoFromMs, today, withDay } from '../lib/dates';
import { uid } from '../lib/format';
import { PRIORITIES, PRIO_RANK, STATUSES, label } from './constants';
import { DEFAULT_ROUTINE } from './routine';
import type { Client, LogEntry, RoutinePhase, Settings, Status, Task } from './types';

export const defaultSettings = (): Settings => ({ profileName: '', timer: null, lastBackup: null, routine: structuredClone(DEFAULT_ROUTINE), plans: {} });

export function newTask(preset: Partial<Task> = {}): Task {
  const now = Date.now();
  return {
    id: uid(), clientId: '', title: '', category: 'Autre', priority: 'normal', status: 'todo',
    dueDate: '', estimate: '', description: '', recurrence: '',
    checklist: [], timeEntries: [], log: [],
    createdAt: now, updatedAt: now, completedAt: null, waitingSince: null, key: null,
    ...preset,
  };
}

export function newClient(preset: Partial<Client> = {}): Client {
  return {
    id: uid(), name: '', code: '', siren: '', forme: 'SARL', activite: '', regimeFiscal: 'IS', regimeTva: 'mensuel',
    jourTva: 19, cloture: '12-31', paie: false, contact: '', email: '', phone: '',
    honoraires: '', budgetHeures: '', notes: '', archived: false, createdAt: Date.now(),
    manager: '', joursMois: 0, fenetre: null,
    ...preset,
  };
}

/** Complète un objet partiel (sauvegarde ancienne, ligne distante…) avec les valeurs par défaut. */
export const normalizeTask = (t: Partial<Task>): Task => newTask({ ...t, checklist: t.checklist ?? [], timeEntries: t.timeEntries ?? [], log: t.log ?? [] });
export const normalizeClient = (c: Partial<Client>): Client => newClient(c);

export const isOpen = (t: Task) => t.status !== 'done';
export const isOverdue = (t: Task, ref = today()) => t.status !== 'done' && !!t.dueDate && t.dueDate < ref;
/**
 * Date de début effective : celle de la tâche, sinon celle de sa période de routine
 * (déduite de la clé « …|routine|<période>|…|AAAA-MM »), sinon aucune.
 */
export function startOf(t: Task, routine: RoutinePhase[]): string {
  if (t.startDate) return t.startDate;
  if (!t.key?.includes('routine|')) return '';
  const parts = t.key.split('|');
  const phase = routine.find(p => p.id === parts[parts.indexOf('routine') + 1]);
  const month = parts[parts.length - 1];
  return phase && /^\d{4}-\d{2}$/.test(month) ? withDay(`${month}-01`, phase.from) : '';
}

/** Tâche commencée (date de début atteinte) et pas encore terminée. */
export const isStarted = (t: Task, routine: RoutinePhase[], ref = today()) => {
  const s = startOf(t, routine);
  return isOpen(t) && t.status !== 'waiting' && !!s && s <= ref;
};

export const timeSpent = (t: Task) => t.timeEntries.reduce((s, e) => s + (e.minutes || 0), 0);
export const timeIn = (t: Task, from: string, to: string) =>
  t.timeEntries.filter(e => e.date >= from && e.date <= to).reduce((s, e) => s + (e.minutes || 0), 0);
export const completedOn = (t: Task) => (t.completedAt ? isoFromMs(t.completedAt) : null);

export const byDue = (a: Task, b: Task) =>
  (a.dueDate || '9999').localeCompare(b.dueDate || '9999') || PRIO_RANK[b.priority] - PRIO_RANK[a.priority];

export const logEntry = (text: string, type: LogEntry['type'] = 'system'): LogEntry => ({ at: Date.now(), type, text });

/** Code court d'un dossier (saisi, sinon déduit du nom : « Boulangerie Martin » → BOUM). */
export function clientCode(c?: Pick<Client, 'name' | 'code'> | null): string {
  if (!c) return '—';
  if (c.code) return c.code.toUpperCase();
  const w = c.name.replace(/^(SCI|SARL|SAS|SASU|EURL|SA|Dr|Me)\.?\s+/i, '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z ]/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (!w.length) return '—';
  return (w.length > 1 ? w[0].slice(0, 3) + w[1].slice(0, 1) : w[0].slice(0, 4)).toUpperCase();
}

/** Prochaine occurrence d'une tâche récurrente. */
export function nextOccurrence(t: Task): Task | null {
  if (!t.recurrence || t.nextSpawned) return null;
  const base = t.dueDate || today();
  const due = { weekly: addDays(base, 7), monthly: addMonths(base, 1), quarterly: addMonths(base, 3), yearly: addMonths(base, 12) }[t.recurrence];
  return newTask({
    clientId: t.clientId, title: t.title, category: t.category, priority: t.priority, dueDate: due,
    estimate: t.estimate, description: t.description, recurrence: t.recurrence,
    checklist: t.checklist.map(c => ({ id: uid(), text: c.text, done: false })),
    log: [logEntry(`Créée automatiquement (récurrence) après la tâche du ${fmtDate(t.dueDate)}`)],
  });
}

/** Change le statut en tenant à jour journal, dates et récurrence. Fonction pure. */
export function withStatus(t: Task, status: Status): { task: Task; spawned: Task | null } {
  if (t.status === status) return { task: t, spawned: null };
  const task: Task = {
    ...t,
    status,
    log: [...t.log, logEntry(`Statut : ${label(STATUSES, t.status)} → ${label(STATUSES, status)}`)],
    waitingSince: status === 'waiting' ? Date.now() : null,
    completedAt: status === 'done' ? Date.now() : null,
  };
  let spawned: Task | null = null;
  if (status === 'done') {
    spawned = nextOccurrence(task);
    if (spawned) task.nextSpawned = true;
  }
  return { task, spawned };
}

/**
 * Applique des modifications à une tâche en journalisant les changements importants
 * (échéance, priorité, dossier, statut). Fonction pure.
 */
export function changeTask(t: Task, patch: Partial<Task>, clientName: (id: string) => string): { task: Task; spawned: Task | null } {
  const log = [...(patch.log ?? t.log)];
  if (patch.dueDate !== undefined && patch.dueDate !== t.dueDate)
    log.push(logEntry(`Échéance : ${fmtDate(t.dueDate)} → ${fmtDate(patch.dueDate)}`));
  if (patch.priority !== undefined && patch.priority !== t.priority)
    log.push(logEntry(`Priorité : ${label(PRIORITIES, t.priority)} → ${label(PRIORITIES, patch.priority)}`));
  if (patch.clientId !== undefined && patch.clientId !== t.clientId)
    log.push(logEntry(`Dossier : ${clientName(t.clientId)} → ${clientName(patch.clientId)}`));
  const { status, ...rest } = patch;
  const next: Task = { ...t, ...rest, log };
  return status ? withStatus(next, status) : { task: next, spawned: null };
}
