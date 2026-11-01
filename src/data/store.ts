import { isoFromMs } from '../lib/dates';
import { fmtMin, uid } from '../lib/format';
import { changeTask, defaultSettings, logEntry, withStatus } from '../domain/tasks';
import type { Client, Data, Settings, Status, Task } from '../domain/types';
import type { Repo } from './repo';

export interface StoreState {
  status: 'loading' | 'ready' | 'error';
  error: string | null;
  data: Data;
}

/**
 * État de l'application en mémoire + persistance optimiste :
 * l'interface est mise à jour immédiatement, l'écriture part en arrière-plan.
 */
export class AppStore {
  state: StoreState = { status: 'loading', error: null, data: { clients: [], tasks: [], settings: defaultSettings() } };
  private listeners = new Set<() => void>();
  private pending = 0;
  private refreshTimer: ReturnType<typeof setTimeout> | undefined;
  private unsubscribe?: () => void;
  private generation = 0;

  constructor(readonly repo: Repo, private onError: (message: string) => void) {}

  subscribe = (l: () => void) => {
    this.listeners.add(l);
    return () => { this.listeners.delete(l); };
  };
  getSnapshot = () => this.state;

  private set(patch: Partial<StoreState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach(l => l());
  }
  private setData(patch: Partial<Data>) {
    this.set({ data: { ...this.state.data, ...patch } });
  }

  async init() {
    const gen = ++this.generation;
    try {
      const data = await this.repo.load();
      if (gen !== this.generation) return; // démonté entre-temps
      this.set({ status: 'ready', data, error: null });
      this.unsubscribe = this.repo.subscribe?.(() => this.scheduleRefresh());
    } catch (e) {
      if (gen !== this.generation) return;
      this.set({ status: 'error', error: e instanceof Error ? e.message : String(e) });
    }
  }
  dispose() {
    this.generation++;
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    clearTimeout(this.refreshTimer);
  }

  /** Recharge après un changement distant, une fois nos propres écritures terminées. */
  private scheduleRefresh() {
    clearTimeout(this.refreshTimer);
    this.refreshTimer = setTimeout(async () => {
      if (this.pending > 0) return this.scheduleRefresh();
      try {
        this.set({ data: await this.repo.load() });
      } catch (e) {
        console.error(e);
      }
    }, 600);
  }

  private persist(p: Promise<void>) {
    this.pending++;
    p.catch(e => this.onError(`Enregistrement impossible : ${e instanceof Error ? e.message : e}`))
      .finally(() => { this.pending--; });
  }

  get data() { return this.state.data; }
  clientName = (id: string) => this.data.clients.find(c => c.id === id)?.name ?? 'Sans dossier';
  task = (id: string) => this.data.tasks.find(t => t.id === id);

  /* ---------- Tâches ---------- */
  upsertTasks(tasks: Task[]) {
    if (!tasks.length) return;
    const now = Date.now();
    const stamped = tasks.map(t => ({ ...t, updatedAt: now }));
    const map = new Map(this.data.tasks.map(t => [t.id, t]));
    stamped.forEach(t => map.set(t.id, t));
    this.setData({ tasks: [...map.values()] });
    this.persist(this.repo.upsertTasks(stamped));
  }

  /** Modifie une tâche (journalise les changements, gère la récurrence). Renvoie l'occurrence suivante créée. */
  updateTask(id: string, patch: Partial<Task>): Task | null {
    const t = this.task(id);
    if (!t) return null;
    const { task, spawned } = changeTask(t, patch, this.clientName);
    this.upsertTasks(spawned ? [task, spawned] : [task]);
    if (task.status === 'done' && this.data.settings.timer?.taskId === id) this.stopTimer();
    return spawned;
  }

  setStatus(id: string, status: Status) {
    return this.updateTask(id, { status });
  }

  deleteTasks(ids: string[]) {
    const set = new Set(ids);
    this.setData({ tasks: this.data.tasks.filter(t => !set.has(t.id)) });
    if (this.data.settings.timer && set.has(this.data.settings.timer.taskId)) this.setSettings({ timer: null });
    this.persist(this.repo.deleteTasks(ids));
  }

  /* ---------- Dossiers ---------- */
  upsertClient(c: Client) {
    const map = new Map(this.data.clients.map(x => [x.id, x]));
    map.set(c.id, c);
    this.setData({ clients: [...map.values()] });
    this.persist(this.repo.upsertClients([c]));
  }

  deleteClient(id: string) {
    const taskIds = this.data.tasks.filter(t => t.clientId === id).map(t => t.id);
    this.deleteTasks(taskIds);
    this.setData({ clients: this.data.clients.filter(c => c.id !== id) });
    this.persist(this.repo.deleteClients([id]));
  }

  /* ---------- Réglages & chrono ---------- */
  setSettings(patch: Partial<Settings>) {
    const settings = { ...this.data.settings, ...patch };
    this.setData({ settings });
    this.persist(this.repo.saveSettings(settings));
  }

  startTimer(taskId: string) {
    if (this.data.settings.timer) this.stopTimer();
    const t = this.task(taskId);
    if (!t) return;
    if (t.status === 'todo') this.upsertTasks([withStatus(t, 'doing').task]);
    this.setSettings({ timer: { taskId, start: Date.now() } });
  }

  /** Arrête le chrono et enregistre le temps. Renvoie les minutes ajoutées. */
  stopTimer(): number {
    const tm = this.data.settings.timer;
    if (!tm) return 0;
    this.setSettings({ timer: null });
    const t = this.task(tm.taskId);
    const minutes = Math.round((Date.now() - tm.start) / 60000);
    if (t && minutes >= 1) {
      this.upsertTasks([{
        ...t,
        timeEntries: [...t.timeEntries, { id: uid(), date: isoFromMs(tm.start), minutes, note: 'Chrono' }],
        log: [...t.log, logEntry(`Temps ajouté (chrono) : ${fmtMin(minutes)}`)],
      }]);
      return minutes;
    }
    return 0;
  }

  /* ---------- Import / démo / remise à zéro ---------- */
  async replaceAll(data: Data) {
    this.setData(data);
    this.pending++;
    try {
      await this.repo.replaceAll(data);
    } finally {
      this.pending--;
    }
  }
}
