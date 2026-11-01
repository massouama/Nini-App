export type Status = 'todo' | 'doing' | 'waiting' | 'done';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';
export type Recurrence = '' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type RegimeTva = 'mensuel' | 'trimestriel' | 'ca12' | 'franchise';

export interface ChecklistItem { id: string; text: string; done: boolean }
export interface TimeEntry { id: string; date: string; minutes: number; note: string }
export interface LogEntry { at: number; type: 'system' | 'comment'; text: string }

export interface Task {
  id: string;
  clientId: string;
  title: string;
  category: string;
  priority: Priority;
  status: Status;
  dueDate: string;
  /** Date à partir de laquelle on peut commencer (vide = dès maintenant). */
  startDate?: string;
  estimate: string;
  description: string;
  recurrence: Recurrence;
  checklist: ChecklistItem[];
  timeEntries: TimeEntry[];
  log: LogEntry[];
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
  waitingSince: number | null;
  /** Clé des échéances générées (évite les doublons). */
  key: string | null;
  nextSpawned?: boolean;
}

export interface Client {
  id: string;
  name: string;
  code: string;
  siren: string;
  forme: string;
  activite: string;
  regimeFiscal: 'IS' | 'IR';
  regimeTva: RegimeTva;
  jourTva: number;
  /** Date de clôture « MM-JJ ». */
  cloture: string;
  paie: boolean;
  contact: string;
  email: string;
  phone: string;
  honoraires: string;
  budgetHeures: string;
  notes: string;
  archived: boolean;
  createdAt: number;
  /** Manager responsable du dossier. */
  manager: string;
  /** Temps alloué au dossier, en jours par mois. */
  joursMois: number;
  /** Période réservée dans le mois (ex. du 5 au 10), ou null. */
  fenetre: { from: number; to: number } | null;
}

/** Une période de la routine mensuelle (ex. « Début de mois », du 1er au 10, à finir le 17). */
export interface RoutinePhase {
  id: string;
  title: string;
  /** Jours du mois sur lesquels le travail est planifié. */
  from: number;
  to: number;
  /** Échéance : un jour du mois, la date limite TVA du dossier, ou le dernier jour ouvré. */
  due: number | 'tva' | 'last';
  /** Une tâche par dossier, une seule tâche, ou une par manager. */
  scope: 'client' | 'global' | 'manager';
  category: string;
  steps: string[];
}

/** Un bloc de temps planifié : tel dossier, tel jour, pour tant de jours (multiples de 0,125). */
export interface PlanBlock {
  id: string;
  date: string;
  clientId: string;
  days: number;
  phaseId: string;
}

export interface Timer { taskId: string; start: number }
export interface Settings {
  profileName: string;
  timer: Timer | null;
  lastBackup: number | null;
  routine: RoutinePhase[];
  /** Répartition par mois (« AAAA-MM »). */
  plans: Record<string, PlanBlock[]>;
}

export interface Data { clients: Client[]; tasks: Task[]; settings: Settings }
