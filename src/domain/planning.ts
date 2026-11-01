/*
 * Répartition du temps du mois entre les dossiers.
 *
 * Principe (proposition, entièrement modifiable ensuite) :
 * 1. Les dossiers ayant une période réservée (ex. du 5 au 10) sont placés en premier sur ces jours.
 * 2. Le temps restant de chaque dossier est réparti sur les périodes de la routine (début, milieu, TVA, fin)
 *    au prorata du temps libre de chaque période : chaque dossier est ainsi traité à chaque étape du mois.
 * 3. Dans chaque période, les dossiers sont enchaînés jour après jour sans éparpillement :
 *    en période TVA, ceux dont la date limite est la plus proche passent en premier ;
 *    ailleurs, ils sont regroupés par manager, les plus gros d'abord.
 */
import { uid } from '../lib/format';
import type { Client, PlanBlock, RoutinePhase } from './types';
import { workingDays } from './workdays';

export const SLOT = 0.125; // 1 heure environ
const SLOTS_PER_DAY = 8;

const toSlots = (days: number) => Math.round((Number(days) || 0) / SLOT);

/** Arrondi qui conserve exactement le total (méthode du plus fort reste). */
function apportion(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (!sum || !total) return weights.map(() => 0);
  const exact = weights.map(w => (total * w) / sum);
  const base = exact.map(Math.floor);
  let rest = total - base.reduce((a, b) => a + b, 0);
  const order = exact.map((x, i) => ({ i, r: x - Math.floor(x) })).sort((a, b) => b.r - a.r || a.i - b.i);
  for (const { i } of order) { if (rest-- <= 0) break; base[i]++; }
  return base;
}

export interface PlanResult { blocks: PlanBlock[]; capacity: number; demand: number; scaled: boolean }

export function buildPlan(month: string, clients: Client[], routine: RoutinePhase[]): PlanResult {
  const days = workingDays(month);
  const used = new Map(days.map(d => [d, 0]));
  const blocks: PlanBlock[] = [];
  const add = (date: string, clientId: string, slots: number, phaseId: string) => {
    if (slots <= 0) return;
    const prev = blocks.find(b => b.date === date && b.clientId === clientId && b.phaseId === phaseId);
    if (prev) prev.days += slots * SLOT;
    else blocks.push({ id: uid(), date, clientId, days: slots * SLOT, phaseId });
    used.set(date, used.get(date)! + slots);
  };
  const dayNum = (d: string) => +d.slice(8);
  const phases = routine.filter(p => p.scope === 'client');
  const phaseOf = (d: string) => phases.find(p => dayNum(d) >= p.from && dayNum(d) <= p.to)?.id ?? '';
  const active = clients.filter(c => !c.archived && c.joursMois > 0);

  // 1. Dossiers à période réservée
  for (const c of active.filter(c => c.fenetre)) {
    let left = toSlots(c.joursMois);
    const inWindow = days.filter(d => dayNum(d) >= c.fenetre!.from && dayNum(d) <= c.fenetre!.to);
    const after = days.filter(d => dayNum(d) > c.fenetre!.to);
    const before = days.filter(d => dayNum(d) < c.fenetre!.from).reverse();
    for (const d of [...inWindow, ...after, ...before]) {
      if (left <= 0) break;
      const take = Math.min(left, SLOTS_PER_DAY - used.get(d)!);
      add(d, c.id, take, 'reserve');
      left -= take;
    }
  }

  // 2. Temps libre par période
  const free = (d: string) => SLOTS_PER_DAY - used.get(d)!;
  const phaseDays = phases.map(p => days.filter(d => phaseOf(d) === p.id && free(d) > 0));
  const caps = phaseDays.map(list => list.reduce((s, d) => s + free(d), 0));
  const capacity = caps.reduce((a, b) => a + b, 0);
  const others = active.filter(c => !c.fenetre);
  let demand = others.map(c => toSlots(c.joursMois));
  const totalDemand = demand.reduce((a, b) => a + b, 0);
  const scaled = totalDemand > capacity;
  if (scaled) demand = apportion(capacity, demand);

  // 3. Répartition de chaque dossier sur les périodes :
  //    – un dossier sans TVA n'est jamais placé en période TVA ;
  //    – un petit dossier passe d'abord par le début de mois, puis la TVA, puis les autres périodes ;
  //    – sinon, au prorata du temps libre de chaque période.
  //    Les dépassements de capacité d'une période sont ensuite corrigés en déplaçant des créneaux.
  const allowed = others.map(c => phases.map((p, i) => caps[i] > 0 && !(p.due === 'tva' && c.regimeTva === 'franchise')));
  const importance = phases.map((p, i) => (i === 0 ? 0 : p.due === 'tva' ? 1 : i + 1));
  const byImportance = phases.map((_, i) => i).sort((a, b) => importance[a] - importance[b]);
  const perPhase = others.map((_, i) => {
    let ok = byImportance.filter(p => allowed[i][p]);
    if (!ok.length) ok = byImportance.filter(p => caps[p] > 0);
    const out = phases.map(() => 0);
    if (demand[i] <= ok.length) for (let k = 0; k < demand[i]; k++) out[ok[k]]++;
    else apportion(demand[i], phases.map((_, p) => (ok.includes(p) ? caps[p] : 0))).forEach((x, p) => { out[p] = x; });
    return out;
  });
  const colSum = (p: number) => perPhase.reduce((s, r) => s + r[p], 0);
  for (let guard = 0; guard < 10000; guard++) {
    const over = phases.findIndex((_, p) => colSum(p) > caps[p]);
    if (over < 0) break;
    let best: { i: number; q: number; score: number } | null = null;
    perPhase.forEach((row, i) => {
      if (row[over] <= 1 && demand[i] > 1) return; // on garde au moins un créneau par période quand c'est possible
      phases.forEach((_, q) => {
        if (q === over || !allowed[i][q] || colSum(q) >= caps[q]) return;
        const score = row[over] * 100 - row[q];
        if (!best || score > best.score) best = { i, q, score };
      });
    });
    if (!best) break;
    const { i, q } = best as { i: number; q: number };
    perPhase[i][over]--; perPhase[i][q]++;
  }
  const managerRank = (c: Client) => c.manager.toLocaleLowerCase('fr') || '~';
  phases.forEach((phase, p) => {
    const order = others.map((c, i) => ({ c, slots: perPhase[i][p] })).filter(x => x.slots > 0);
    order.sort(phase.due === 'tva'
      ? (a, b) => (a.c.regimeTva === 'franchise' ? 99 : a.c.jourTva) - (b.c.regimeTva === 'franchise' ? 99 : b.c.jourTva) || managerRank(a.c).localeCompare(managerRank(b.c)) || b.slots - a.slots
      : (a, b) => managerRank(a.c).localeCompare(managerRank(b.c)) || b.slots - a.slots || a.c.name.localeCompare(b.c.name, 'fr'));
    const list = phaseDays[p];
    let k = 0;
    for (const { c, slots } of order) {
      let left = slots;
      while (left > 0) {
        while (k < list.length - 1 && free(list[k]) <= 0) k++;
        const d = list[k];
        if (!d) break;
        const take = k === list.length - 1 ? left : Math.min(left, free(d)); // dernier jour : on accepte un léger dépassement
        add(d, c.id, take, phase.id);
        left -= take;
      }
    }
  });

  blocks.sort((a, b) => a.date.localeCompare(b.date));
  return { blocks, capacity: capacity * SLOT, demand: totalDemand * SLOT, scaled };
}

/** Temps planifié par dossier. */
export function plannedByClient(blocks: PlanBlock[]) {
  const m = new Map<string, number>();
  blocks.forEach(b => m.set(b.clientId, (m.get(b.clientId) ?? 0) + b.days));
  return m;
}

/** Total planifié par jour. */
export function dayTotals(blocks: PlanBlock[]) {
  const m = new Map<string, number>();
  blocks.forEach(b => m.set(b.date, (m.get(b.date) ?? 0) + b.days));
  return m;
}

/** « 0,5 j », « 1 h », « 1,25 j ». */
export const fmtDays = (d: number) => {
  if (d > 0 && d < 0.25) return `${Math.round(d * 8)} h`;
  return `${String(Math.round(d * 1000) / 1000).replace('.', ',')} j`;
};
