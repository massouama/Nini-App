import { defaultSettings } from '../domain/tasks';
import type { Data } from '../domain/types';
import { normalizeData } from './normalize';
import type { Repo } from './repo';

const KEY = 'nini:data:v2';
const LEGACY_KEY = 'nini-app:v1';

/** Stockage dans le navigateur (localStorage). Reprend automatiquement les données de la v1. */
export function createLocalRepo(): Repo {
  let data: Data = { clients: [], tasks: [], settings: defaultSettings() };

  const write = async () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      throw new Error('Stockage du navigateur plein ou bloqué.');
    }
  };

  return {
    kind: 'local',
    async load() {
      try {
        const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
        if (raw) data = normalizeData(JSON.parse(raw));
      } catch (e) {
        console.error(e);
      }
      return structuredClone(data);
    },
    async upsertClients(cs) {
      const map = new Map(data.clients.map(c => [c.id, c]));
      cs.forEach(c => map.set(c.id, c));
      data.clients = [...map.values()];
      await write();
    },
    async deleteClients(ids) {
      data.clients = data.clients.filter(c => !ids.includes(c.id));
      await write();
    },
    async upsertTasks(ts) {
      const map = new Map(data.tasks.map(t => [t.id, t]));
      ts.forEach(t => map.set(t.id, t));
      data.tasks = [...map.values()];
      await write();
    },
    async deleteTasks(ids) {
      const set = new Set(ids);
      data.tasks = data.tasks.filter(t => !set.has(t.id));
      await write();
    },
    async saveSettings(s) {
      data.settings = s;
      await write();
    },
    async replaceAll(d) {
      data = structuredClone(d);
      await write();
    },
    subscribe(onChange) {
      // Synchronise les onglets ouverts sur le même navigateur.
      const h = (e: StorageEvent) => {
        if (e.key === KEY && e.newValue) {
          data = normalizeData(JSON.parse(e.newValue));
          onChange();
        }
      };
      window.addEventListener('storage', h);
      return () => window.removeEventListener('storage', h);
    },
  };
}
