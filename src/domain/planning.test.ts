import { describe, expect, it } from 'vitest';
import { buildPlan, dayTotals, plannedByClient } from './planning';
import { DEFAULT_ROUTINE, routineTasks } from './routine';
import { newClient } from './tasks';
import { workingDays } from './workdays';

// Jeu fictif reprenant la structure d'un portefeuille réel : 3 managers, 19,25 j/mois.
const alloc: [string, number][] = [
  ['A1', 0.5], ['A2', 0.5], ['A3', 0.5], ['A4', 1], ['A5', 1], ['A6', 0.5], ['A7', 0.5], ['A8', 0.75],
  ['B1', 1], ['B2', 1], ['B3', 1.25], ['B4', 1.25], ['B5', 0.5], ['B6', 0.5], ['B7', 0.25], ['B8', 0.125], ['B9', 0.125],
  ['B10', 0.5], ['B11', 0.5], ['B12', 0.5], ['B13', 0.25], ['B14', 0.75], ['B15', 0.5],
];
const clients = [
  ...alloc.map(([name, j]) => newClient({
    name, manager: name.startsWith('A') ? 'Manager A' : 'Manager B', joursMois: j, jourTva: name === 'B3' ? 24 : 19,
    regimeTva: name === 'B8' || name === 'B9' ? 'franchise' : 'mensuel',
  })),
  newClient({ name: 'Réservé', manager: 'Manager C', joursMois: 5, fenetre: { from: 5, to: 10 } }),
];

describe('jours ouvrés', () => {
  it('exclut week-ends et jours fériés', () => {
    const nov = workingDays('2026-11');
    expect(nov).toHaveLength(20); // 1er (dim.) et 11 novembre (mer.) exclus
    expect(nov).not.toContain('2026-11-11');
    expect(workingDays('2026-05')).not.toContain('2026-05-14'); // Ascension 2026
  });
});

describe('répartition', () => {
  const plan = buildPlan('2026-11', clients, DEFAULT_ROUTINE);
  const per = plannedByClient(plan.blocks);

  it('respecte exactement le temps alloué à chaque dossier', () => {
    for (const c of clients) expect(per.get(c.id)).toBeCloseTo(c.joursMois);
    expect(plan.scaled).toBe(false);
  });

  it('ne dépasse jamais une journée de travail', () => {
    for (const [, total] of dayTotals(plan.blocks)) expect(total).toBeLessThanOrEqual(1);
  });

  it('place le dossier réservé sur sa période (puis juste après)', () => {
    const r = clients.at(-1)!;
    const dates = plan.blocks.filter(b => b.clientId === r.id).map(b => b.date);
    expect(dates.slice(0, 4)).toEqual(['2026-11-05', '2026-11-06', '2026-11-09', '2026-11-10']);
  });

  it('traite chaque dossier dans plusieurs périodes du mois', () => {
    const big = clients.find(c => c.name === 'B3')!;
    expect(new Set(plan.blocks.filter(b => b.clientId === big.id).map(b => b.phaseId)).size).toBe(4);
  });

  it('ne place jamais un dossier sans TVA en période TVA', () => {
    const sans = clients.filter(c => c.regimeTva === 'franchise').map(c => c.id);
    expect(plan.blocks.some(b => sans.includes(b.clientId) && b.phaseId === 'tva')).toBe(false);
  });

  it('donne au moins un créneau de début de mois à chaque dossier', () => {
    for (const c of clients.filter(c => !c.fenetre)) expect(plan.blocks.some(b => b.clientId === c.id && b.phaseId === 'debut')).toBe(true);
  });

  it('passe d’abord les TVA au 19 en période TVA', () => {
    const tva = plan.blocks.filter(b => b.phaseId === 'tva');
    const late = clients.find(c => c.name === 'B3')!;
    const lastFirstDate = tva.find(b => b.clientId === late.id)!.date;
    expect(tva[0].date <= lastFirstDate).toBe(true);
    expect(tva.filter(b => b.date < lastFirstDate).every(b => b.clientId !== late.id)).toBe(true);
  });

  it('réduit proportionnellement si le temps alloué dépasse le mois', () => {
    const tooMuch = clients.map(c => ({ ...c, joursMois: c.joursMois * 2 }));
    const p = buildPlan('2026-11', tooMuch, DEFAULT_ROUTINE);
    expect(p.scaled).toBe(true);
    for (const [, total] of dayTotals(p.blocks)) expect(total).toBeLessThanOrEqual(1);
  });
});

describe('routine mensuelle', () => {
  it('crée une tâche par dossier et par période, sans doublon', () => {
    const tasks = routineTasks('2026-11', clients, DEFAULT_ROUTINE, new Set());
    expect(tasks.filter(t => t.title.startsWith('Début de mois'))).toHaveLength(clients.length);
    expect(tasks.filter(t => t.title.startsWith('Point dossiers'))).toHaveLength(3);
    expect(tasks.find(t => t.title.startsWith('TVA') && t.clientId === clients.find(c => c.name === 'B3')!.id)?.dueDate).toBe('2026-11-24');
    expect(tasks.find(t => t.title.startsWith('Fin de mois'))?.dueDate).toBe('2026-11-30');
    const again = routineTasks('2026-11', clients, DEFAULT_ROUTINE, new Set(tasks.map(t => t.key)));
    expect(again).toHaveLength(0);
  });
});
