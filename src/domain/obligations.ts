/*
 * Générateur d'échéances fiscales, sociales et juridiques courantes (France).
 * Ce sont des dates « usuelles » pour planifier le travail : elles restent modifiables
 * et sont à vérifier au cas par cas (calendrier fiscal officiel, option EDI, jours fériés…).
 */
import { addDays, addMonths, iso, monthName, parse, withDay } from '../lib/dates';
import { uid } from '../lib/format';
import { logEntry, newTask } from './tasks';
import type { Client, Priority, Task } from './types';

export interface Obligation {
  key: string;
  clientId: string;
  title: string;
  category: string;
  dueDate: string;
  description: string;
  priority?: Priority;
  checklist?: string[];
}

/** 2e jour ouvré suivant le 1er mai (référence des liasses pour les clôtures au 31/12). */
export function secondWorkingDayAfterMay1(year: number) {
  const d = new Date(year, 4, 1);
  let n = 0;
  while (n < 2) {
    d.setDate(d.getDate() + 1);
    const w = d.getDay();
    const ferie = d.getMonth() === 4 && d.getDate() === 8;
    if (w !== 0 && w !== 6 && !ferie) n++;
  }
  return iso(d);
}

const isSociete = (c: Client) => !['EI', 'Micro-entreprise', 'Association'].includes(c.forme);
const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Échéances d'un dossier pour l'année `year` :
 * déclarations périodiques (TVA, DSN) dont la période tombe dans l'année,
 * et obligations liées à l'exercice clos au cours de l'année.
 */
export function obligationsFor(c: Client, year: number): Obligation[] {
  const out: Obligation[] = [];
  const add = (key: string, title: string, category: string, dueDate: string, description = '', extra: Partial<Obligation> = {}) =>
    out.push({ key: `${c.id}|${key}`, clientId: c.id, title, category, dueDate, description, ...extra });
  const jour = Math.min(Math.max(Number(c.jourTva) || 19, 1), 28);
  const mois = (m: number) => `${monthName(m)} ${year}`;

  // TVA
  if (c.regimeTva === 'mensuel') {
    for (let m = 0; m < 12; m++) {
      add(`tva-${year}-${m + 1}`, `Déclaration TVA CA3 – ${mois(m)}`, 'TVA', withDay(addMonths(`${year}-${pad(m + 1)}-01`, 1), jour),
        'Préparer et télédéclarer la CA3 mensuelle, puis télérégler.', { priority: 'high' });
    }
  } else if (c.regimeTva === 'trimestriel') {
    for (let q = 0; q < 4; q++) {
      add(`tva-${year}-T${q + 1}`, `Déclaration TVA CA3 – T${q + 1} ${year}`, 'TVA', withDay(addMonths(`${year}-${pad(q * 3 + 3)}-01`, 1), jour),
        'Préparer et télédéclarer la CA3 trimestrielle.', { priority: 'high' });
    }
  } else if (c.regimeTva === 'ca12') {
    add(`tva-acpt1-${year}`, `Acompte TVA (CA12) – juillet ${year}`, 'TVA', withDay(`${year}-07-01`, jour), 'Acompte semestriel (55 % de la TVA due N-1).');
    add(`tva-acpt2-${year}`, `Acompte TVA (CA12) – décembre ${year}`, 'TVA', withDay(`${year}-12-01`, jour), 'Acompte semestriel (40 % de la TVA due N-1).');
    add(`tva-ca12-${year}`, `Déclaration annuelle TVA CA12 – ${year}`, 'TVA', secondWorkingDayAfterMay1(year + 1),
      'Déclaration annuelle de régularisation (exercice civil ; si exercice décalé : CA12E dans les 3 mois de la clôture).', { priority: 'high' });
  }

  // Paie
  if (c.paie) {
    for (let m = 0; m < 12; m++) {
      add(`dsn-${year}-${m + 1}`, `Paie & DSN – ${mois(m)}`, 'Paie / Social', withDay(addMonths(`${year}-${pad(m + 1)}-01`, 1), 15),
        'Bulletins de paie, DSN mensuelle (le 5 si ≥ 50 salariés, le 15 sinon).');
    }
  }

  // Exercice clos dans l'année
  const cloture = /^\d{2}-\d{2}$/.test(c.cloture || '') ? c.cloture : '12-31';
  const C = `${year}-${cloture}`;
  const isDec = cloture === '12-31';
  const ex = `exercice clos le ${parse(C).toLocaleDateString('fr-FR')}`;
  const liasse = isDec ? addDays(secondWorkingDayAfterMay1(year + 1), 15) : addMonths(C, 3);

  add(`collecte-${year}`, `Collecte des pièces de fin d'exercice – ${ex}`, 'Relance client', addDays(C, 20),
    'Relevés bancaires au jour de clôture, inventaire des stocks, factures non parvenues, emprunts, immobilisations…',
    { checklist: ['Relevés bancaires de clôture', 'Inventaire des stocks', 'Tableaux d’emprunts', 'Factures d’immobilisations', 'Créances / dettes à la clôture'] });
  add(`revision-${year}`, `Révision & comptes annuels – ${ex}`, 'Révision / Bilan', addDays(liasse, -21),
    'Révision des cycles, écritures d’inventaire, établissement du bilan et du compte de résultat.', {
      priority: 'high',
      checklist: ['Rapprochements bancaires', 'Lettrage clients / fournisseurs', 'Cut-off (FNP, FAE, CCA, PCA)', 'Immobilisations & amortissements', 'Stocks', 'Provisions', 'Dossier de révision', 'Plaquette'],
    });

  if (c.regimeFiscal === 'IS') {
    add(`liasse-${year}`, `Liasse fiscale IS (2065) – ${ex}`, 'Liasse fiscale', liasse, 'Télétransmission de la liasse fiscale.', { priority: 'high' });
    const start = addDays(addMonths(C, -12), 1);
    [2, 5, 8, 11].forEach((k, i) =>
      add(`is-acpt${i + 1}-${year}`, `Acompte IS n°${i + 1} – ${ex}`, 'Fiscal (IS / IR)', withDay(addMonths(start, k), 15), 'Relevé d’acompte 2571 (si IS N-1 > 3 000 €).'));
    const solde = isDec ? `${year + 1}-05-15` : withDay(addMonths(C.slice(0, 8) + '01', 4), 15);
    add(`is-solde-${year}`, `Solde IS (2572) – ${ex}`, 'Fiscal (IS / IR)', solde, 'Relevé de solde d’impôt sur les sociétés.', { priority: 'high' });
  } else {
    const form = c.forme === 'SCI' ? '2072' : '2031 / 2035';
    add(`liasse-${year}`, `Déclaration de résultats ${form} – ${ex}`, 'Liasse fiscale', liasse, 'Télétransmission de la déclaration de résultats.', { priority: 'high' });
  }

  if (isSociete(c)) {
    add(`ag-${year}`, `Approbation des comptes (AG) – ${ex}`, 'Juridique', addMonths(C, 6), 'Rapport de gestion, PV d’AG, affectation du résultat.');
    if (c.forme !== 'SCI') {
      add(`greffe-${year}`, `Dépôt des comptes au greffe – ${ex}`, 'Juridique', addMonths(C, 7), 'Dépôt dans le mois suivant l’approbation (2 mois si dépôt électronique).');
    }
  }

  // Impôts locaux
  if (c.forme !== 'SCI' && c.forme !== 'Association') {
    add(`cfe-${year}`, `Paiement CFE – ${year}`, 'Fiscal (IS / IR)', `${year}-12-15`, 'Vérifier l’avis sur l’espace professionnel et le paiement.');
  }

  return out.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export const obligationToTask = (o: Obligation): Task =>
  newTask({
    clientId: o.clientId, title: o.title, category: o.category, dueDate: o.dueDate,
    description: o.description, priority: o.priority ?? 'normal', key: o.key,
    checklist: (o.checklist ?? []).map(text => ({ id: uid(), text, done: false })),
    log: [logEntry('Créée depuis le générateur d’échéances')],
  });
