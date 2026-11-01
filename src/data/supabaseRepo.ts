import type { SupabaseClient } from '@supabase/supabase-js';
import { defaultSettings } from '../domain/tasks';
import type { Client, Data, Task } from '../domain/types';
import { normalizeData } from './normalize';
import type { Repo } from './repo';

const PAGE = 1000;
const chunks = <T,>(arr: T[], n = 500) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

/** Données synchronisées dans PostgreSQL via Supabase (voir supabase/schema.sql). */
export function createSupabaseRepo(sb: SupabaseClient, userId: string): Repo {
  const check = ({ error }: { error: { message: string } | null }) => {
    if (error) throw new Error(error.message);
  };

  const fetchAll = async (table: 'clients' | 'tasks') => {
    const out: unknown[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await sb.from(table).select('data').order('id').range(from, from + PAGE - 1);
      if (error) throw new Error(error.message);
      out.push(...data.map(r => r.data));
      if (data.length < PAGE) break;
    }
    return out;
  };

  const now = () => new Date().toISOString();
  const clientRow = (c: Client) => ({ id: c.id, user_id: userId, data: c, updated_at: now() });
  const taskRow = (t: Task) => ({ id: t.id, user_id: userId, client_id: t.clientId || null, data: t, updated_at: now() });

  const repo: Repo = {
    kind: 'supabase',
    async load() {
      const [clients, tasks, settings] = await Promise.all([
        fetchAll('clients'),
        fetchAll('tasks'),
        sb.from('settings').select('data').maybeSingle(),
      ]);
      if (settings.error) throw new Error(settings.error.message);
      return normalizeData({ clients, tasks, settings: { ...defaultSettings(), ...(settings.data?.data ?? {}) } });
    },
    async upsertClients(cs) {
      for (const part of chunks(cs)) check(await sb.from('clients').upsert(part.map(clientRow)));
    },
    async deleteClients(ids) {
      for (const part of chunks(ids)) check(await sb.from('clients').delete().in('id', part));
    },
    async upsertTasks(ts) {
      for (const part of chunks(ts)) check(await sb.from('tasks').upsert(part.map(taskRow)));
    },
    async deleteTasks(ids) {
      for (const part of chunks(ids)) check(await sb.from('tasks').delete().in('id', part));
    },
    async saveSettings(s) {
      check(await sb.from('settings').upsert({ user_id: userId, data: s, updated_at: now() }));
    },
    async replaceAll(d: Data) {
      check(await sb.from('tasks').delete().eq('user_id', userId));
      check(await sb.from('clients').delete().eq('user_id', userId));
      await repo.upsertClients(d.clients);
      await repo.upsertTasks(d.tasks);
      await repo.saveSettings(d.settings);
    },
    subscribe(onChange) {
      const ch = sb.channel(`nini-${userId}`);
      for (const table of ['clients', 'tasks', 'settings']) {
        ch.on('postgres_changes', { event: '*', schema: 'public', table, filter: `user_id=eq.${userId}` }, () => onChange());
      }
      ch.subscribe();
      return () => { void sb.removeChannel(ch); };
    },
  };
  return repo;
}
