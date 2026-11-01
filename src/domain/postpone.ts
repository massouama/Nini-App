/*
 * Reporter une tâche bloquée (pièces manquantes…) et proposer autre chose à faire à la place.
 */
import { fmtDate } from '../lib/dates';
import { uid } from '../lib/format';
import { byDue, isOpen, logEntry, startOf, withStatus } from './tasks';
import type { PlanBlock, RoutinePhase, Task } from './types';

export const REASONS = [
  { id: 'docs', label: 'Pièces ou informations manquantes du client', waiting: true },
  { id: 'manager', label: 'En attente du manager', waiting: true },
  { id: 'autre', label: 'Autre raison', waiting: false },
] as const;
export type ReasonId = (typeof REASONS)[number]['id'];

export interface PostponeInput { until: string; dueDate: string; reason: ReasonId; note: string; waiting: boolean }

/** Reporte la tâche jusqu'à la date de reprise. Fonction pure. */
export function postponeTask(t: Task, input: PostponeInput): Task {
  const reason = REASONS.find(r => r.id === input.reason)?.label ?? '';
  let next: Task = { ...t, startDate: input.until, reportedUntil: input.until, log: [...t.log] };
  if (input.dueDate && input.dueDate !== t.dueDate) {
    next.log.push(logEntry(`Échéance : ${fmtDate(t.dueDate)} → ${fmtDate(input.dueDate)}`));
    next.dueDate = input.dueDate;
  }
  if (input.waiting && t.status !== 'waiting') next = withStatus(next, 'waiting').task;
  next.log.push(logEntry(`Reportée au ${fmtDate(input.until)} — ${reason}${input.note.trim() ? ` : ${input.note.trim()}` : ''}`, 'comment'));
  return next;
}

/** Reprise : la tâche redevient « En cours » et quitte « À reprendre ». */
export function resumeTask(t: Task): Task {
  const next = t.status === 'waiting' ? withStatus(t, 'doing').task : { ...t };
  return { ...next, reportedUntil: null, log: [...next.log, logEntry('Reprise de la tâche')] };
}

/** Retire du planning les créneaux du dossier entre `from` (inclus) et `until` (exclu). */
export function freeSlots(blocks: PlanBlock[], clientId: string, from: string, until: string) {
  const freed = blocks.filter(b => b.clientId === clientId && b.date >= from && b.date < until);
  return { blocks: blocks.filter(b => !freed.includes(b)), freed };
}

/** Donne le temps libéré d'un jour à un autre dossier (fusionne avec un créneau existant le même jour). */
export function giveTime(blocks: PlanBlock[], date: string, clientId: string, days: number, phaseId: string): PlanBlock[] {
  if (days <= 0) return blocks;
  const same = blocks.find(b => b.date === date && b.clientId === clientId);
  if (same) return blocks.map(b => (b === same ? { ...b, days: b.days + days } : b));
  return [...blocks, { id: uid(), date, clientId, days, phaseId }];
}

/**
 * Que faire à la place : les tâches disponibles maintenant, puis celles qu'on peut avancer.
 * Les autres tâches du dossier bloqué sont écartées (elles attendent sans doute les mêmes pièces).
 */
export function suggestAlternatives(tasks: Task[], routine: RoutinePhase[], blocked: Task, ref: string) {
  const usable = tasks.filter(t => isOpen(t) && t.status !== 'waiting' && t.id !== blocked.id && (!blocked.clientId || t.clientId !== blocked.clientId));
  const now = usable.filter(t => { const s = startOf(t, routine); return !s || s <= ref; }).sort(byDue).slice(0, 6);
  const ahead = usable
    .filter(t => { const s = startOf(t, routine); return !!s && s > ref; })
    .sort((a, b) => startOf(a, routine).localeCompare(startOf(b, routine)) || byDue(a, b))
    .slice(0, 4);
  return { now, ahead };
}
