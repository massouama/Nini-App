import type { Client, Data, Settings, Task } from '../domain/types';

/** Persistance des données. Deux implémentations : navigateur (local) ou Supabase. */
export interface Repo {
  kind: 'local' | 'supabase';
  load(): Promise<Data>;
  upsertClients(clients: Client[]): Promise<void>;
  deleteClients(ids: string[]): Promise<void>;
  upsertTasks(tasks: Task[]): Promise<void>;
  deleteTasks(ids: string[]): Promise<void>;
  saveSettings(settings: Settings): Promise<void>;
  replaceAll(data: Data): Promise<void>;
  /** Notifie quand les données changent ailleurs (autre onglet, autre appareil). */
  subscribe?(onChange: () => void): () => void;
}
