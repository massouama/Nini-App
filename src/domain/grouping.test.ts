import { describe, expect, it } from 'vitest';
import { groupClients, groupTasks } from './grouping';
import { DEFAULT_ROUTINE, routineTasks } from './routine';
import { newClient, newTask } from './tasks';

const a = newClient({ name: 'Alpha', manager: 'Manager B', regimeTva: 'mensuel' });
const b = newClient({ name: 'Bêta', manager: 'Manager A', regimeTva: 'franchise', forme: 'SCI' });
const c = newClient({ name: 'Gamma', manager: '', regimeTva: 'mensuel' });

describe('regrouper les dossiers', () => {
  it('par manager, « Sans manager » en dernier', () => {
    expect(groupClients([a, b, c], 'manager').map(g => g.label)).toEqual(['Manager A', 'Manager B', 'Sans manager']);
  });
  it('par régime de TVA et sans regroupement', () => {
    expect(groupClients([a, b, c], 'tva').map(g => `${g.label}:${g.list.length}`)).toEqual(['Franchise TVA:1', 'TVA mensuelle:2']);
    expect(groupClients([a, b, c], 'none')[0].list).toHaveLength(3);
  });
});

describe('regrouper les tâches', () => {
  const tasks = [...routineTasks('2026-11', [a, b], DEFAULT_ROUTINE, new Set()), newTask({ title: 'Libre' })];
  it('par dossier, avec un groupe « à lier » pour les tâches sans dossier', () => {
    const g = groupTasks(tasks, 'client', [a, b], DEFAULT_ROUTINE);
    expect(g.map(x => x.label)).toContain('Sans dossier — à lier');
    expect(g.find(x => x.label === 'Sans dossier — à lier')?.list.map(t => t.title)).toEqual(['Libre']);
    expect(g.find(x => x.label.startsWith('Tâches générales'))?.list.length).toBeGreaterThan(0);
    expect(g.find(x => x.clientId === a.id)?.list.every(t => t.clientId === a.id)).toBe(true);
  });
  it('par période, dans l’ordre du mois', () => {
    const g = groupTasks(tasks, 'period', [a, b], DEFAULT_ROUTINE).map(x => x.label);
    expect(g.slice(0, 4)).toEqual(['Début de mois', 'Milieu de mois', 'TVA & révision', 'Fin de mois']);
    expect(g.at(-1)).toBe('Hors routine');
  });
});
