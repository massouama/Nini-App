/* Regroupements au choix pour la liste des dossiers et la liste des tâches. */
import { PRIORITIES, REGIMES_TVA, STATUSES, label } from './constants';
import type { Client, RoutinePhase, Task } from './types';

export interface Group<T> { key: string; label: string; list: T[]; clientId?: string; manager?: string; tone?: 'muted' }

const byLabel = <T,>(groups: Group<T>[]) =>
  groups.sort((a, b) => Number(a.tone === 'muted') - Number(b.tone === 'muted') || a.label.localeCompare(b.label, 'fr'));

function collect<T>(items: T[], keyOf: (x: T) => { key: string; label: string; tone?: 'muted'; extra?: Partial<Group<T>> }): Group<T>[] {
  const map = new Map<string, Group<T>>();
  for (const it of items) {
    const k = keyOf(it);
    if (!map.has(k.key)) map.set(k.key, { key: k.key, label: k.label, list: [], tone: k.tone, ...k.extra });
    map.get(k.key)!.list.push(it);
  }
  return [...map.values()];
}

/* ---------- Dossiers ---------- */
export type ClientGroupBy = 'manager' | 'tva' | 'forme' | 'fiscal' | 'none';
export const CLIENT_GROUPINGS: { id: ClientGroupBy; label: string }[] = [
  { id: 'manager', label: 'Manager' },
  { id: 'tva', label: 'Régime de TVA' },
  { id: 'forme', label: 'Forme juridique' },
  { id: 'fiscal', label: 'Imposition' },
  { id: 'none', label: 'Aucun' },
];

export function groupClients(clients: Client[], by: ClientGroupBy): Group<Client>[] {
  if (by === 'none') return [{ key: 'all', label: 'Tous les dossiers', list: clients }];
  return byLabel(collect(clients, c => {
    switch (by) {
      case 'manager': return c.manager.trim()
        ? { key: c.manager.trim(), label: c.manager.trim(), extra: { manager: c.manager.trim() } }
        : { key: '~', label: 'Sans manager', tone: 'muted' };
      case 'tva': return { key: c.regimeTva, label: REGIMES_TVA.find(r => r.id === c.regimeTva)?.short ?? c.regimeTva };
      case 'forme': return c.forme ? { key: c.forme, label: c.forme } : { key: '~', label: 'Forme non renseignée', tone: 'muted' };
      default: return { key: c.regimeFiscal, label: c.regimeFiscal === 'IS' ? 'Impôt sur les sociétés (IS)' : 'Impôt sur le revenu (IR)' };
    }
  }));
}

/* ---------- Tâches ---------- */
export type TaskGroupBy = 'none' | 'client' | 'manager' | 'status' | 'category' | 'period' | 'priority';
export const TASK_GROUPINGS: { id: TaskGroupBy; label: string }[] = [
  { id: 'none', label: 'Sans regroupement' },
  { id: 'client', label: 'Par dossier' },
  { id: 'manager', label: 'Par manager' },
  { id: 'period', label: 'Par période du mois' },
  { id: 'status', label: 'Par statut' },
  { id: 'category', label: 'Par catégorie' },
  { id: 'priority', label: 'Par priorité' },
];
/** Groupes repliés par défaut (beaucoup de groupes) ou dépliés. */
export const TASK_GROUPS_OPEN_BY_DEFAULT: Record<TaskGroupBy, boolean> = {
  none: true, client: false, manager: false, period: true, status: true, category: true, priority: true,
};

/** Tâche générale de la routine (pas liée à un dossier par nature : variation du CA, point manager…). */
export const isGeneral = (t: Task) => !t.clientId && !!t.key?.startsWith('routine|');

export function phaseOfTask(t: Task, routine: RoutinePhase[]) {
  if (!t.key?.includes('routine|')) return undefined;
  const parts = t.key.split('|');
  return routine.find(p => p.id === parts[parts.indexOf('routine') + 1]);
}

export function groupTasks(tasks: Task[], by: TaskGroupBy, clients: Client[], routine: RoutinePhase[]): Group<Task>[] {
  if (by === 'none') return [{ key: 'all', label: '', list: tasks }];
  const client = (id: string) => clients.find(c => c.id === id);
  const groups = collect(tasks, t => {
    switch (by) {
      case 'client': {
        const c = client(t.clientId);
        if (c) return { key: c.id, label: c.name, extra: { clientId: c.id, manager: c.manager } };
        return isGeneral(t) ? { key: '~general', label: 'Tâches générales (cabinet)', tone: 'muted' } : { key: '~', label: 'Sans dossier — à lier', tone: 'muted' };
      }
      case 'manager': {
        const m = client(t.clientId)?.manager.trim();
        return m ? { key: m, label: m, extra: { manager: m } } : { key: '~', label: 'Sans manager', tone: 'muted' };
      }
      case 'status': return { key: t.status, label: label(STATUSES, t.status) };
      case 'category': return { key: t.category, label: t.category };
      case 'priority': return { key: t.priority, label: label(PRIORITIES, t.priority) };
      default: {
        const p = phaseOfTask(t, routine);
        return p ? { key: p.id, label: p.title } : { key: '~', label: 'Hors routine', tone: 'muted' };
      }
    }
  });
  if (by === 'status') return groups.sort((a, b) => STATUSES.findIndex(s => s.id === a.key) - STATUSES.findIndex(s => s.id === b.key));
  if (by === 'priority') return groups.sort((a, b) => PRIORITIES.findIndex(s => s.id === a.key) - PRIORITIES.findIndex(s => s.id === b.key));
  if (by === 'period') {
    const rank = (k: string) => { const i = routine.findIndex(p => p.id === k); return i < 0 ? Number.MAX_SAFE_INTEGER : i; };
    return groups.sort((a, b) => rank(a.key) - rank(b.key));
  }
  return byLabel(groups);
}
