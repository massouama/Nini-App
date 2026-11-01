'use strict';

/* Référentiels + stockage local (localStorage) des dossiers et des tâches. */

const STORAGE_KEY = 'nini-app:v1';

const STATUSES = [
  { id: 'todo', label: 'À faire' },
  { id: 'doing', label: 'En cours' },
  { id: 'waiting', label: 'En attente client' },
  { id: 'done', label: 'Terminé' },
];
const PRIORITIES = [
  { id: 'low', label: 'Basse' },
  { id: 'normal', label: 'Normale' },
  { id: 'high', label: 'Haute' },
  { id: 'urgent', label: 'Urgente' },
];
const CATEGORIES = [
  'Saisie comptable', 'Rapprochement bancaire', 'TVA', 'Fiscal (IS / IR)', 'Révision / Bilan',
  'Liasse fiscale', 'Paie / Social', 'Juridique', 'Relance client', 'Rendez-vous / Conseil',
  'Administratif', 'Autre',
];
const FORMES = ['SARL', 'EURL', 'SAS', 'SASU', 'SA', 'SCI', 'EI', 'Micro-entreprise', 'Association', 'Autre'];
const REGIMES_TVA = [
  { id: 'mensuel', label: 'Réel normal – mensuel (CA3)' },
  { id: 'trimestriel', label: 'Réel normal – trimestriel (CA3)' },
  { id: 'ca12', label: 'Réel simplifié (CA12)' },
  { id: 'franchise', label: 'Franchise en base / non assujetti' },
];
const RECURRENCES = [
  { id: '', label: 'Aucune' },
  { id: 'weekly', label: 'Chaque semaine' },
  { id: 'monthly', label: 'Chaque mois' },
  { id: 'quarterly', label: 'Chaque trimestre' },
  { id: 'yearly', label: 'Chaque année' },
];
const label = (list, id) => (list.find(x => x.id === id) || {}).label || id;

function defaultState() {
  return { version: 1, profile: { name: '' }, clients: [], tasks: [], timer: null, lastBackup: null, ui: {} };
}

const Store = {
  s: null,

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this.s = raw ? JSON.parse(raw) : defaultState();
    } catch (e) {
      console.error(e);
      this.s = defaultState();
    }
    this.s = Object.assign(defaultState(), this.s);
    this.s.tasks.forEach(t => {
      t.checklist ||= []; t.timeEntries ||= []; t.log ||= [];
    });
  },
  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.s));
    } catch (e) {
      U.toast('Impossible d’enregistrer : stockage du navigateur plein ou bloqué.', 'err');
    }
  },

  /* ---------- Dossiers ---------- */
  clients(includeArchived = false) {
    return this.s.clients.filter(c => includeArchived || !c.archived).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  },
  client(id) { return this.s.clients.find(c => c.id === id); },
  clientName(id) { const c = this.client(id); return c ? c.name : 'Sans dossier'; },
  upsertClient(c) {
    const i = this.s.clients.findIndex(x => x.id === c.id);
    if (i >= 0) this.s.clients[i] = c; else this.s.clients.push(c);
    this.save();
  },
  deleteClient(id) {
    this.s.clients = this.s.clients.filter(c => c.id !== id);
    this.s.tasks = this.s.tasks.filter(t => t.clientId !== id);
    if (this.s.timer && !this.task(this.s.timer.taskId)) this.s.timer = null;
    this.save();
  },

  /* ---------- Tâches ---------- */
  tasks() { return this.s.tasks; },
  task(id) { return this.s.tasks.find(t => t.id === id); },
  upsertTask(t) {
    t.updatedAt = Date.now();
    const i = this.s.tasks.findIndex(x => x.id === t.id);
    if (i >= 0) this.s.tasks[i] = t; else this.s.tasks.push(t);
    this.save();
  },
  deleteTask(id) {
    this.s.tasks = this.s.tasks.filter(t => t.id !== id);
    if (this.s.timer?.taskId === id) this.s.timer = null;
    this.save();
  },
};

function newClient(preset = {}) {
  return Object.assign({
    id: U.uid(), name: '', siren: '', forme: 'SARL', activite: '', regimeFiscal: 'IS', regimeTva: 'mensuel',
    jourTva: 19, cloture: '12-31', paie: false, contact: '', email: '', phone: '',
    honoraires: '', budgetHeures: '', notes: '', archived: false, createdAt: Date.now(),
  }, preset);
}

function newTask(preset = {}) {
  return Object.assign({
    id: U.uid(), clientId: '', title: '', category: 'Autre', priority: 'normal', status: 'todo',
    dueDate: '', estimate: '', description: '', recurrence: '',
    checklist: [], timeEntries: [], log: [],
    createdAt: Date.now(), updatedAt: Date.now(), completedAt: null, waitingSince: null, key: null,
  }, preset);
}

/* ---------- Règles métier sur les tâches ---------- */
const T = {
  isOpen: t => t.status !== 'done',
  isOverdue: t => t.status !== 'done' && t.dueDate && t.dueDate < U.today(),
  timeSpent: t => (t.timeEntries || []).reduce((s, e) => s + (e.minutes || 0), 0),
  timeIn: (t, from, to) => (t.timeEntries || []).filter(e => e.date >= from && e.date <= to).reduce((s, e) => s + (e.minutes || 0), 0),
  log(t, text, type = 'system') { t.log.push({ at: Date.now(), type, text }); },

  /** Change le statut en tenant à jour le journal, les dates et la récurrence. Renvoie une éventuelle tâche créée. */
  setStatus(t, status) {
    if (t.status === status) return null;
    const prev = t.status;
    t.status = status;
    T.log(t, `Statut : ${label(STATUSES, prev)} → ${label(STATUSES, status)}`);
    t.waitingSince = status === 'waiting' ? Date.now() : null;
    if (status === 'done') {
      t.completedAt = Date.now();
      return T.spawnNext(t);
    }
    t.completedAt = null;
    return null;
  },

  spawnNext(t) {
    if (!t.recurrence || t.nextSpawned) return null;
    const base = t.dueDate || U.today();
    const due = { weekly: U.addDays(base, 7), monthly: U.addMonths(base, 1), quarterly: U.addMonths(base, 3), yearly: U.addMonths(base, 12) }[t.recurrence];
    if (!due) return null;
    t.nextSpawned = true;
    const next = newTask({
      clientId: t.clientId, title: t.title, category: t.category, priority: t.priority, dueDate: due,
      estimate: t.estimate, description: t.description, recurrence: t.recurrence,
      checklist: t.checklist.map(c => ({ id: U.uid(), text: c.text, done: false })),
    });
    T.log(next, `Créée automatiquement (récurrence) après la tâche du ${U.fmtDate(t.dueDate)}`);
    return next;
  },
};
