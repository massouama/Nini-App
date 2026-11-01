import { describe, expect, it } from 'vitest';
import { freeSlots, giveTime, postponeTask, resumeTask, suggestAlternatives } from './postpone';
import { DEFAULT_ROUTINE, routineTasks } from './routine';
import { isStarted, newClient, newTask } from './tasks';
import { addWorkingDays, nextMonday } from './workdays';

describe('jours ouvrés suivants', () => {
  it('saute week-ends et jours fériés', () => {
    expect(addWorkingDays('2026-11-06', 1)).toBe('2026-11-09'); // vendredi → lundi
    expect(addWorkingDays('2026-11-10', 1)).toBe('2026-11-12'); // 11 novembre férié
    expect(nextMonday('2026-11-03')).toBe('2026-11-09');
  });
});

describe('reporter une tâche', () => {
  const c = newClient({ name: 'Valérie test' });
  const t = routineTasks('2026-11', [c], DEFAULT_ROUTINE, new Set()).find(x => x.title.startsWith('Début'))!;

  it('passe en attente, décale le début et sort de « à traiter »', () => {
    const p = postponeTask(t, { until: '2026-11-12', dueDate: t.dueDate, reason: 'docs', note: 'relevés de banque', waiting: true });
    expect(p.status).toBe('waiting');
    expect(p.startDate).toBe('2026-11-12');
    expect(p.reportedUntil).toBe('2026-11-12');
    expect(isStarted(p, DEFAULT_ROUTINE, '2026-11-05')).toBe(false);
    expect(p.log.at(-1)?.text).toContain('relevés de banque');
    const r = resumeTask(p);
    expect(r.status).toBe('doing');
    expect(r.reportedUntil).toBeNull();
  });

  it('libère les créneaux du dossier jusqu’à la reprise et les donne à un autre', () => {
    const blocks = [
      { id: '1', date: '2026-11-05', clientId: c.id, days: 1, phaseId: 'reserve' },
      { id: '2', date: '2026-11-06', clientId: c.id, days: 1, phaseId: 'reserve' },
      { id: '3', date: '2026-11-12', clientId: c.id, days: 1, phaseId: 'reserve' },
    ];
    const { blocks: left, freed } = freeSlots(blocks, c.id, '2026-11-05', '2026-11-12');
    expect(freed.map(b => b.id)).toEqual(['1', '2']);
    expect(left.map(b => b.id)).toEqual(['3']);
    const given = giveTime(left, '2026-11-05', 'autre', 1, 'debut');
    expect(given.find(b => b.date === '2026-11-05')?.clientId).toBe('autre');
  });

  it('propose d’abord les tâches disponibles, puis celles à avancer', () => {
    const other = newClient({ name: 'Autre' });
    const tasks = [t, ...routineTasks('2026-11', [other], DEFAULT_ROUTINE, new Set()), newTask({ title: 'Sans date' })];
    const s = suggestAlternatives(tasks, DEFAULT_ROUTINE, t, '2026-11-05');
    expect(s.now.some(x => x.id === t.id)).toBe(false);
    expect([...s.now, ...s.ahead].some(x => x.clientId === c.id)).toBe(false); // même dossier bloqué écarté
    expect(s.now.some(x => x.title.startsWith('Début') && x.clientId === other.id)).toBe(true);
    expect(s.ahead[0].title.startsWith('Milieu')).toBe(true);
  });
});
