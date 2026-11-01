import { describe, expect, it } from 'vitest';
import { obligationsFor, secondWorkingDayAfterMay1 } from './obligations';
import { clientCode, newClient, newTask, withStatus } from './tasks';
import { parseDuration } from '../lib/format';
import { computeReport } from './report';

describe('échéances', () => {
  it('calcule le 2e jour ouvré après le 1er mai', () => {
    expect(secondWorkingDayAfterMay1(2026)).toBe('2026-05-05'); // ven. 1er → lun. 4, mar. 5
    expect(secondWorkingDayAfterMay1(2027)).toBe('2027-05-04'); // sam. 1er → lun. 3, mar. 4
  });

  it('génère TVA mensuelle, IS et liasse pour une SARL au 31/12', () => {
    const c = newClient({ name: 'Test', regimeTva: 'mensuel', jourTva: 19 });
    const list = obligationsFor(c, 2026);
    const tva = list.filter(o => o.category === 'TVA');
    expect(tva).toHaveLength(12);
    expect(tva.find(o => o.title.includes('décembre'))?.dueDate).toBe('2027-01-19');
    const acomptes = list.filter(o => o.title.startsWith('Acompte IS')).map(o => o.dueDate);
    expect(acomptes).toEqual(['2026-03-15', '2026-06-15', '2026-09-15', '2026-12-15']);
    expect(list.find(o => o.title.startsWith('Solde IS'))?.dueDate).toBe('2027-05-15');
    expect(list.find(o => o.title.startsWith('Liasse'))?.dueDate).toBe('2027-05-19');
  });

  it('gère un exercice décalé (clôture 30/06) et la TVA trimestrielle', () => {
    const c = newClient({ name: 'Décalé', regimeTva: 'trimestriel', jourTva: 21, cloture: '06-30' });
    const list = obligationsFor(c, 2026);
    expect(list.filter(o => o.category === 'TVA').map(o => o.dueDate)).toEqual(['2026-04-21', '2026-07-21', '2026-10-21', '2027-01-21']);
    expect(list.filter(o => o.title.startsWith('Acompte IS')).map(o => o.dueDate)).toEqual(['2025-09-15', '2025-12-15', '2026-03-15', '2026-06-15']);
    expect(list.find(o => o.title.startsWith('Solde IS'))?.dueDate).toBe('2026-10-15');
    expect(list.find(o => o.title.startsWith('Liasse'))?.dueDate).toBe('2026-09-30');
  });

  it('ne génère ni IS ni greffe pour une SCI à l’IR', () => {
    const c = newClient({ name: 'SCI X', forme: 'SCI', regimeFiscal: 'IR', regimeTva: 'franchise' });
    const titles = obligationsFor(c, 2026).map(o => o.title);
    expect(titles.some(t => t.includes('IS'))).toBe(false);
    expect(titles.some(t => t.includes('greffe'))).toBe(false);
    expect(titles.some(t => t.includes('2072'))).toBe(true);
  });
});

describe('tâches', () => {
  it('crée la prochaine occurrence d’une tâche récurrente', () => {
    const t = newTask({ title: 'Saisie', dueDate: '2026-01-31', recurrence: 'monthly' });
    const { task, spawned } = withStatus(t, 'done');
    expect(task.completedAt).not.toBeNull();
    expect(spawned?.dueDate).toBe('2026-02-28');
    expect(withStatus(task, 'todo').task.completedAt).toBeNull();
  });

  it('déduit un code dossier', () => {
    expect(clientCode({ name: 'Boulangerie Martin', code: '' })).toBe('BOUM');
    expect(clientCode({ name: 'SCI Les Tilleuls', code: '' })).toBe('LEST');
    expect(clientCode({ name: 'x', code: 'abc' })).toBe('ABC');
  });

  it('lit les durées', () => {
    expect(parseDuration('1h30')).toBe(90);
    expect(parseDuration('1,5h')).toBe(90);
    expect(parseDuration('0:45')).toBe(45);
    expect(parseDuration('20')).toBe(20);
    expect(parseDuration('abc')).toBeNull();
  });
});

describe('rapports', () => {
  it('sépare fait et reste à faire sur la période', () => {
    const c = newClient({ name: 'A' });
    const done = { ...newTask({ clientId: c.id, title: 'fait', status: 'done', dueDate: '2026-11-03' }), completedAt: new Date(2026, 10, 4, 12).getTime() };
    const late = newTask({ clientId: c.id, title: 'retard', dueDate: '2026-10-20' });
    const later = newTask({ clientId: c.id, title: 'plus tard', dueDate: '2027-02-01' });
    const r = computeReport([done, late, later], [c], { preset: 'month', from: '', to: '', clientId: '', includeAll: false, showTime: true }, '2026-11-15');
    expect(r.done.map(t => t.title)).toEqual(['fait']);
    expect(r.remaining.map(t => t.title)).toEqual(['retard']);
    expect(r.overdue).toHaveLength(1);
  });
});
