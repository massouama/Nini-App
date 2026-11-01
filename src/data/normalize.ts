import { defaultSettings, normalizeClient, normalizeTask } from '../domain/tasks';
import type { Client, Data, Settings, Task } from '../domain/types';

/** Accepte les données de la v2 et les sauvegardes de la première version (v1). */
export function normalizeData(raw: unknown): Data {
  const r = (raw ?? {}) as Record<string, unknown>;
  if (!Array.isArray(r.clients) || !Array.isArray(r.tasks)) throw new Error('Format de données invalide');
  const legacy = r as { profile?: { name?: string }; timer?: Settings['timer']; lastBackup?: number };
  const settings: Settings = {
    ...defaultSettings(),
    ...(legacy.profile ? { profileName: legacy.profile.name ?? '' } : {}),
    ...(legacy.timer !== undefined ? { timer: legacy.timer } : {}),
    ...(legacy.lastBackup ? { lastBackup: legacy.lastBackup } : {}),
    ...((r.settings as Partial<Settings>) ?? {}),
  };
  return {
    clients: (r.clients as Partial<Client>[]).map(c => {
      const n = normalizeClient(c);
      return { ...n, honoraires: String(n.honoraires ?? ''), budgetHeures: String(n.budgetHeures ?? '') };
    }),
    tasks: (r.tasks as Partial<Task>[]).map(t => {
      const n = normalizeTask(t);
      return { ...n, estimate: String(n.estimate ?? '') };
    }),
    settings,
  };
}
