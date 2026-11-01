import type { Priority, Recurrence, RegimeTva, Status } from './types';

export const STATUSES: { id: Status; label: string }[] = [
  { id: 'todo', label: 'À faire' },
  { id: 'doing', label: 'En cours' },
  { id: 'waiting', label: 'En attente client' },
  { id: 'done', label: 'Terminé' },
];
export const PRIORITIES: { id: Priority; label: string }[] = [
  { id: 'urgent', label: 'Urgente' },
  { id: 'high', label: 'Haute' },
  { id: 'normal', label: 'Normale' },
  { id: 'low', label: 'Basse' },
];
export const CATEGORIES = [
  'Saisie comptable', 'Rapprochement bancaire', 'TVA', 'Fiscal (IS / IR)', 'Révision / Bilan',
  'Liasse fiscale', 'Paie / Social', 'Juridique', 'Relance client', 'Rendez-vous / Conseil',
  'Administratif', 'Autre',
];
export const FORMES = ['SARL', 'EURL', 'SAS', 'SASU', 'SA', 'SCI', 'EI', 'Micro-entreprise', 'Association', 'Autre'];
export const REGIMES_TVA: { id: RegimeTva; label: string; short: string }[] = [
  { id: 'mensuel', label: 'Réel normal – mensuel (CA3)', short: 'TVA mensuelle' },
  { id: 'trimestriel', label: 'Réel normal – trimestriel (CA3)', short: 'TVA trimestrielle' },
  { id: 'ca12', label: 'Réel simplifié (CA12)', short: 'CA12' },
  { id: 'franchise', label: 'Franchise en base / non assujetti', short: 'Franchise TVA' },
];
export const RECURRENCES: { id: Recurrence; label: string }[] = [
  { id: '', label: 'Aucune' },
  { id: 'weekly', label: 'Chaque semaine' },
  { id: 'monthly', label: 'Chaque mois' },
  { id: 'quarterly', label: 'Chaque trimestre' },
  { id: 'yearly', label: 'Chaque année' },
];

export const label = <T extends string>(list: { id: T; label: string }[], id: T) =>
  list.find(x => x.id === id)?.label ?? id;

export const PRIO_RANK: Record<Priority, number> = { low: 0, normal: 1, high: 2, urgent: 3 };
