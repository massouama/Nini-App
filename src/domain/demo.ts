import { addDays, addMonths, parse, today as todayIso } from '../lib/dates';
import { uid } from '../lib/format';
import { obligationToTask, obligationsFor } from './obligations';
import { defaultSettings, logEntry, newClient, newTask } from './tasks';
import type { Data, Task } from './types';

/** Jeu de données d'exemple, construit autour de la date du jour. */
export function demoData(today = todayIso()): Data {
  const year = +today.slice(0, 4);
  let seed = 7;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const toMs = (s: string, h = 10) => { const d = parse(s); d.setHours(h); return d.getTime(); };

  const clients = [
    newClient({ name: 'Boulangerie Martin', siren: '512 345 678', forme: 'SARL', activite: 'Boulangerie-pâtisserie', regimeTva: 'mensuel', jourTva: 19, paie: true, contact: 'Paul Martin', email: 'contact@boulangerie-martin.fr', phone: '01 23 45 67 89', honoraires: '3600', budgetHeures: '45', notes: 'Envoie les relevés bancaires par mail vers le 10 du mois. Caisse enregistreuse certifiée.' }),
    newClient({ name: 'Dupont Conseil', siren: '843 210 987', forme: 'SASU', activite: 'Conseil en management', regimeTva: 'trimestriel', jourTva: 21, cloture: '06-30', contact: 'Claire Dupont', email: 'claire@dupont-conseil.fr', honoraires: '2200', budgetHeures: '22' }),
    newClient({ name: 'Garage Petit', siren: '398 765 432', forme: 'SAS', activite: 'Réparation automobile', regimeTva: 'ca12', jourTva: 17, cloture: '09-30', paie: true, contact: 'Marc Petit', phone: '06 12 34 56 78', honoraires: '4100', budgetHeures: '50', notes: 'Stock de pièces à inventorier chaque fin septembre.' }),
    newClient({ name: 'Dr Sophie Leroy', siren: '901 234 567', forme: 'EI', activite: 'Médecin généraliste (BNC)', regimeFiscal: 'IR', regimeTva: 'franchise', contact: 'Sophie Leroy', email: 's.leroy@exemple.fr', honoraires: '1300', budgetHeures: '12' }),
    newClient({ name: 'SCI Les Tilleuls', siren: '789 456 123', forme: 'SCI', activite: 'Location immobilière', regimeFiscal: 'IR', regimeTva: 'franchise', contact: 'Famille Bernard', honoraires: '800', budgetHeures: '8' }),
  ];

  const tasks: Task[] = [];
  for (const c of clients) {
    for (const y of [year - 1, year]) {
      for (const o of obligationsFor(c, y)) {
        if (o.dueDate < addMonths(today, -8) || o.dueDate > addMonths(today, 7)) continue;
        const t = obligationToTask(o);
        t.createdAt = toMs(addDays(o.dueDate, -40));
        if (o.dueDate < today) {
          const late = rnd() < 0.08 && o.dueDate > addDays(today, -30);
          if (!late) {
            const doneOn = addDays(o.dueDate, -Math.floor(rnd() * 6) - 1);
            t.status = 'done';
            t.completedAt = toMs(doneOn, 16);
            t.checklist = t.checklist.map(ck => ({ ...ck, done: true }));
            t.timeEntries.push({ id: uid(), date: doneOn, minutes: 15 * (1 + Math.floor(rnd() * 8)), note: '' });
            t.log.push(logEntry('Statut : À faire → Terminé'));
          }
        } else if (o.dueDate < addDays(today, 10) && rnd() < 0.4) {
          t.status = 'doing';
          t.timeEntries.push({ id: uid(), date: addDays(today, -1), minutes: 30, note: '' });
        }
        tasks.push(t);
      }
    }
  }

  const [bm, dc, gp, sl, sci] = clients;
  const manual: Partial<Task>[] = [
    { clientId: bm.id, title: 'Saisie des achats et ventes – mois précédent', category: 'Saisie comptable', dueDate: addDays(today, 5), recurrence: 'monthly', estimate: '3' },
    { clientId: bm.id, title: 'Rapprochement bancaire – mois précédent', category: 'Rapprochement bancaire', dueDate: addDays(today, 6), recurrence: 'monthly', estimate: '1' },
    { clientId: gp.id, title: 'Relancer le client : relevés bancaires manquants', category: 'Relance client', dueDate: addDays(today, -3), status: 'waiting', priority: 'high', description: 'Relevés Crédit Agricole d’août et septembre manquants.', waitingSince: Date.now() - 9 * 86400000 },
    { clientId: dc.id, title: 'Rendez-vous de présentation des comptes', category: 'Rendez-vous / Conseil', dueDate: addDays(today, 9), estimate: '1.5', description: 'Présenter le bilan au 30/06 et discuter de la rémunération / dividendes.' },
    { clientId: sl.id, title: 'Récupérer les relevés SNIR / honoraires rétrocédés', category: 'Relance client', dueDate: addDays(today, 12), status: 'waiting', waitingSince: Date.now() - 3 * 86400000 },
    { clientId: sci.id, title: 'Mettre à jour le tableau des loyers et charges', category: 'Saisie comptable', dueDate: addDays(today, 20), estimate: '1' },
    { clientId: gp.id, title: 'Inventaire du stock de pièces au 30/09', category: 'Révision / Bilan', dueDate: addDays(today, -1), priority: 'urgent', status: 'doing' },
    { clientId: '', title: 'Mettre à jour la lettre de mission type du cabinet', category: 'Administratif', priority: 'low' },
  ];
  for (const m of manual) {
    const t = newTask({ ...m, log: [logEntry('Tâche créée')] });
    if (m.status === 'doing') {
      t.checklist = ['Recevoir l’état de stock', 'Contrôler les valorisations', 'Passer l’écriture de variation'].map(text => ({ id: uid(), text, done: false }));
      t.timeEntries.push({ id: uid(), date: addDays(today, -2), minutes: 90, note: 'Contrôle des quantités' });
    }
    if (m.status === 'waiting') t.log.push(logEntry('Mail de relance envoyé au client', 'comment'));
    tasks.push(t);
  }

  return { clients, tasks, settings: { ...defaultSettings(), profileName: 'Nini' } };
}
