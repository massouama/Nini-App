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
}

export interface Timer { taskId: string; start: number }
export interface Settings { profileName: string; timer: Timer | null; lastBackup: number | null }

export interface Data { clients: Client[]; tasks: Task[]; settings: Settings }
