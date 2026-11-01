'use strict';

/*
 * Générateur d'échéances fiscales / sociales / juridiques courantes (France).
 * Les dates sont des dates « usuelles » destinées à planifier le travail :
 * elles restent modifiables et doivent être vérifiées au cas par cas
 * (calendrier fiscal officiel, option EDI, jours fériés, etc.).
 */
const Obligations = {
  /** 2e jour ouvré suivant le 1er mai (date de référence des liasses pour les clôtures au 31/12). */
  secondWorkingDayAfterMay1(year) {
    const d = new Date(year, 4, 1);
    let n = 0;
    while (n < 2) {
      d.setDate(d.getDate() + 1);
      const w = d.getDay();
      const ferie = d.getMonth() === 4 && d.getDate() === 8;
      if (w !== 0 && w !== 6 && !ferie) n++;
    }
    return U.iso(d);
  },

  withDay(iso, day) {
    const last = new Date(+iso.slice(0, 4), +iso.slice(5, 7), 0).getDate();
    return iso.slice(0, 8) + String(Math.min(day, last)).padStart(2, '0');
  },

  isSociete(c) { return !['EI', 'Micro-entreprise', 'Association'].includes(c.forme); },

  /**
   * Liste des échéances d'un dossier pour l'année `year` :
   * – déclarations périodiques (TVA, DSN) dont la période tombe dans l'année ;
   * – obligations liées à l'exercice clos au cours de l'année.
   */
  forClient(c, year) {
    const out = [];
    const add = (key, title, category, dueDate, description = '', extra = {}) =>
      out.push({ key: `${c.id}|${key}`, clientId: c.id, title, category, dueDate, description, ...extra });
    const jour = Math.min(Math.max(parseInt(c.jourTva, 10) || 19, 1), 28);
    const mois = m => `${U.monthName(m)} ${year}`;

    /* --- TVA --- */
    if (c.regimeTva === 'mensuel') {
      for (let m = 0; m < 12; m++) {
        const due = this.withDay(U.addMonths(`${year}-${String(m + 1).padStart(2, '0')}-01`, 1), jour);
        add(`tva-${year}-${m + 1}`, `Déclaration TVA CA3 – ${mois(m)}`, 'TVA', due, 'Préparer et télédéclarer la CA3 mensuelle, puis télérégler.', { priority: 'high' });
      }
    } else if (c.regimeTva === 'trimestriel') {
      for (let q = 0; q < 4; q++) {
        const due = this.withDay(U.addMonths(`${year}-${String(q * 3 + 3).padStart(2, '0')}-01`, 1), jour);
        add(`tva-${year}-T${q + 1}`, `Déclaration TVA CA3 – T${q + 1} ${year}`, 'TVA', due, 'Préparer et télédéclarer la CA3 trimestrielle.', { priority: 'high' });
      }
    } else if (c.regimeTva === 'ca12') {
      add(`tva-acpt1-${year}`, `Acompte TVA (CA12) – juillet ${year}`, 'TVA', this.withDay(`${year}-07-01`, jour), 'Acompte semestriel (55 % de la TVA due N-1).');
      add(`tva-acpt2-${year}`, `Acompte TVA (CA12) – décembre ${year}`, 'TVA', this.withDay(`${year}-12-01`, jour), 'Acompte semestriel (40 % de la TVA due N-1).');
      add(`tva-ca12-${year}`, `Déclaration annuelle TVA CA12 – ${year}`, 'TVA', this.secondWorkingDayAfterMay1(year + 1), 'Déclaration annuelle de régularisation (exercice civil ; si exercice décalé : CA12E dans les 3 mois de la clôture).', { priority: 'high' });
    }

    /* --- Paie --- */
    if (c.paie) {
      for (let m = 0; m < 12; m++) {
        const due = this.withDay(U.addMonths(`${year}-${String(m + 1).padStart(2, '0')}-01`, 1), 15);
        add(`dsn-${year}-${m + 1}`, `Paie & DSN – ${mois(m)}`, 'Paie / Social', due, 'Bulletins de paie, DSN mensuelle (le 5 si ≥ 50 salariés, le 15 sinon).');
      }
    }

    /* --- Exercice clos dans l'année --- */
    const cloture = /^\d{2}-\d{2}$/.test(c.cloture || '') ? c.cloture : '12-31';
    const C = `${year}-${cloture}`;
    const isDec = cloture === '12-31';
    const ex = `exercice clos le ${U.parse(C).toLocaleDateString('fr-FR')}`;
    const liasse = isDec ? U.addDays(this.secondWorkingDayAfterMay1(year + 1), 15) : U.addMonths(C, 3);

    add(`collecte-${year}`, `Collecte des pièces de fin d'exercice – ${ex}`, 'Relance client', U.addDays(C, 20),
      'Relevés bancaires au jour de clôture, inventaire des stocks, factures non parvenues, emprunts, immobilisations…', { checklist: ['Relevés bancaires de clôture', 'Inventaire des stocks', 'Tableaux d’emprunts', 'Factures d’immobilisations', 'Créances / dettes à la clôture'] });
    add(`revision-${year}`, `Révision & comptes annuels – ${ex}`, 'Révision / Bilan', U.addDays(liasse, -21),
      'Révision des cycles, écritures d’inventaire, établissement du bilan et du compte de résultat.', {
        priority: 'high',
        checklist: ['Rapprochements bancaires', 'Lettrage clients / fournisseurs', 'Cut-off (FNP, FAE, CCA, PCA)', 'Immobilisations & amortissements', 'Stocks', 'Provisions', 'Dossier de révision', 'Plaquette'],
      });

    if (c.regimeFiscal === 'IS') {
      add(`liasse-${year}`, `Liasse fiscale IS (2065) – ${ex}`, 'Liasse fiscale', liasse, 'Télétransmission de la liasse fiscale.', { priority: 'high' });
      const start = U.addDays(U.addMonths(C, -12), 1);
      [2, 5, 8, 11].forEach((k, i) => {
        add(`is-acpt${i + 1}-${year}`, `Acompte IS n°${i + 1} – ${ex}`, 'Fiscal (IS / IR)', this.withDay(U.addMonths(start, k), 15), 'Relevé d’acompte 2571 (si IS N-1 > 3 000 €).');
      });
      const solde = isDec ? `${year + 1}-05-15` : this.withDay(U.addMonths(C.slice(0, 8) + '01', 4), 15);
      add(`is-solde-${year}`, `Solde IS (2572) – ${ex}`, 'Fiscal (IS / IR)', solde, 'Relevé de solde d’impôt sur les sociétés.', { priority: 'high' });
    } else {
      const form = c.forme === 'SCI' ? '2072' : '2031 / 2035';
      add(`liasse-${year}`, `Déclaration de résultats ${form} – ${ex}`, 'Liasse fiscale', liasse, 'Télétransmission de la déclaration de résultats.', { priority: 'high' });
    }

    if (this.isSociete(c)) {
      add(`ag-${year}`, `Approbation des comptes (AG) – ${ex}`, 'Juridique', U.addMonths(C, 6), 'Rapport de gestion, PV d’AG, affectation du résultat.');
      if (c.forme !== 'SCI') {
        add(`greffe-${year}`, `Dépôt des comptes au greffe – ${ex}`, 'Juridique', U.addMonths(C, 7), 'Dépôt dans le mois suivant l’approbation (2 mois si dépôt électronique).');
      }
    }

    /* --- Impôts locaux --- */
    if (c.forme !== 'SCI' && c.forme !== 'Association') {
      add(`cfe-${year}`, `Paiement CFE – ${year}`, 'Fiscal (IS / IR)', `${year}-12-15`, 'Vérifier l’avis sur l’espace professionnel et le paiement.', { priority: 'normal' });
    }

    return out.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  },

  /** Transforme une échéance en tâche. */
  toTask(o) {
    const t = newTask({
      clientId: o.clientId, title: o.title, category: o.category, dueDate: o.dueDate,
      description: o.description, priority: o.priority || 'normal', key: o.key,
      checklist: (o.checklist || []).map(text => ({ id: U.uid(), text, done: false })),
    });
    T.log(t, 'Créée depuis le générateur d’échéances');
    return t;
  },

  existingKeys() { return new Set(Store.tasks().map(t => t.key).filter(Boolean)); },
};
