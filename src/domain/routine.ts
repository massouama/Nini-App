import { monthName, parse, withDay } from '../lib/dates';
import { uid } from '../lib/format';
import type { Client, RoutinePhase, Task } from './types';
import { lastWorkingDay, workingOnOrAfter, workingOnOrBefore } from './workdays';

/** Routine mensuelle par défaut (modifiable dans les réglages). */
export const DEFAULT_ROUTINE: RoutinePhase[] = [
  {
    id: 'debut', title: 'Début de mois', from: 1, to: 10, due: 17, scope: 'client', category: 'Saisie comptable',
    steps: ['Fiche Tunisie', 'Intégration banque', 'Intégration recettes', 'Rapprochement banque', 'Lettrage clients / fournisseurs et autres',
      'Réaffectation 471', 'Contrôle des soldes – balance générale', 'Écriture OD caisse'],
  },
  {
    id: 'milieu', title: 'Milieu de mois', from: 11, to: 17, due: 17, scope: 'client', category: 'Saisie comptable',
    steps: ['Saisie achats (factures et petty cash)', 'Contrôle de l’intégration de la paie', 'Écriture OD AEN', 'États manquants'],
  },
  {
    id: 'tva', title: 'TVA & révision', from: 18, to: 24, due: 'tva', scope: 'client', category: 'TVA',
    steps: ['Préparation TVA', 'Validation TVA', 'Écriture OD TVA', 'Mail client – information TVA', 'Lettrage et cadrage TVA',
      'Révision et ajustement des comptes', 'Mail pour documents manquants'],
  },
  {
    id: 'fin', title: 'Fin de mois', from: 25, to: 31, due: 'last', scope: 'client', category: 'Révision / Bilan',
    steps: ['Préparation du tableau de bord', 'Révision et finalisation du dossier'],
  },
  {
    id: 'variation', title: 'Tableau de variation du CA', from: 25, to: 31, due: 'last', scope: 'global', category: 'Administratif',
    steps: ['Variation du CA par dossier', 'Masse salariale', 'Autres indicateurs'],
  },
  {
    id: 'point', title: 'Point dossiers', from: 25, to: 31, due: 'last', scope: 'manager', category: 'Rendez-vous / Conseil',
    steps: [],
  },
];

export const monthLabel = (month: string) => `${monthName(parse(`${month}-01`).getMonth())} ${month.slice(0, 4)}`;

const hasTva = (c?: Client) => !!c && c.regimeTva !== 'franchise';

/** Date d'échéance d'une période pour un mois donné (et un dossier, pour la TVA). */
export function phaseDueDate(phase: RoutinePhase, month: string, client?: Client): string {
  if (phase.due === 'last') return lastWorkingDay(month);
  // Échéance sur un week-end ou un jour férié : avancée au jour ouvré précédent.
  if (phase.due === 'tva') return workingOnOrBefore(withDay(`${month}-01`, hasTva(client) ? client!.jourTva || 24 : 24));
  return workingOnOrBefore(withDay(`${month}-01`, phase.due));
}

/** Date de début d'une période : son premier jour, ou le jour ouvré suivant. */
export const phaseStartDate = (phase: RoutinePhase, month: string) => workingOnOrAfter(withDay(`${month}-01`, phase.from));

/** Tâches de la routine pour un mois (une par dossier et par période, plus les tâches globales). */
export function routineTasks(month: string, clients: Client[], routine: RoutinePhase[], existingKeys: Set<string | null>): Task[] {
  const active = clients.filter(c => !c.archived).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  const label = monthLabel(month);
  const out: Task[] = [];
  const now = Date.now();
  const make = (key: string, clientId: string, title: string, phase: RoutinePhase, dueDate: string, steps: string[]): void => {
    if (existingKeys.has(key)) return;
    out.push({
      id: uid(), clientId, title, category: phase.category, priority: phase.id === 'tva' ? 'high' : 'normal', status: 'todo',
      dueDate, startDate: phaseStartDate(phase, month), estimate: '', description: '', recurrence: '',
      checklist: steps.map(text => ({ id: uid(), text, done: false })),
      timeEntries: [], log: [{ at: now, type: 'system', text: `Créée depuis la routine du mois (${label})` }],
      createdAt: now, updatedAt: now, completedAt: null, waitingSince: null, key,
    });
  };
  for (const phase of routine) {
    if (phase.scope === 'client') {
      for (const c of active) {
        const steps = hasTva(c) ? phase.steps : phase.steps.filter(s => !/TVA/i.test(s));
        if (!steps.length && phase.steps.length) continue;
        make(`${c.id}|routine|${phase.id}|${month}`, c.id, `${phase.title} – ${label}`, phase, phaseDueDate(phase, month, c), steps);
      }
    } else if (phase.scope === 'global') {
      make(`routine|${phase.id}|${month}`, '', `${phase.title} – ${label}`, phase, phaseDueDate(phase, month), phase.steps);
    } else {
      const managers = [...new Set(active.map(c => c.manager.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'));
      for (const m of managers) {
        const dossiers = active.filter(c => c.manager.trim() === m).map(c => c.name);
        make(`routine|${phase.id}|${m}|${month}`, '', `${phase.title} avec ${m} – ${label}`, phase, phaseDueDate(phase, month), [...phase.steps, ...dossiers]);
      }
    }
  }
  return out;
}
