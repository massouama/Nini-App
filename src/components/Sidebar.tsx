import { CalendarDays, CalendarRange, Cloud, DownloadCloud, FileText, FolderOpen, HardDrive, ListTodo, Pause, Plus, Search, Settings, Sun } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useData, useStore } from '../data/StoreContext';
import { today } from '../lib/dates';
import { fmtClock, fmtMin } from '../lib/format';
import { clientStats } from '../domain/stats';
import { clientCode, isOpen, isOverdue, isStarted } from '../domain/tasks';
import { useToast } from './ui/Toasts';
import { useBackup } from './useBackup';
import { managerColor, managersOf } from './managers';
import { useNow } from './useNow';
import { useTaskNav } from './useTaskNav';

export function Sidebar({ onSearch, open, onNavigate }: { onSearch: () => void; open: boolean; onNavigate: () => void }) {
  const { clients, tasks, settings } = useData();
  const store = useStore();
  const toast = useToast();
  const nav = useTaskNav();
  const ref = today();
  const timerTask = settings.timer ? tasks.find(t => t.id === settings.timer!.taskId) : undefined;
  const now = useNow(!!timerTask);
  const backup = useBackup();
  const todayCount = tasks.filter(t => isOpen(t) && t.status !== 'waiting' && ((t.dueDate && t.dueDate <= ref) || isStarted(t, settings.routine, ref))).length;
  const lateCount = tasks.filter(t => isOverdue(t, ref)).length;
  const active = clients.filter(c => !c.archived).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  const groups = [
    ...managersOf(active).map(m => ({ name: m, color: managerColor(active, m), list: active.filter(c => c.manager.trim() === m) })),
    { name: 'Autres dossiers', color: 'var(--line-strong)', list: active.filter(c => !c.manager.trim()) },
  ].filter(g => g.list.length);

  const link = (to: string, icon: React.ReactNode, text: string, count?: number, tone?: 'late') => (
    <NavLink to={to} end={to === '/'} className="nav-link" onClick={onNavigate}>
      {icon}<span>{text}</span>{count ? <b className={`nav-count ${tone ?? ''}`}>{count}</b> : null}
    </NavLink>
  );

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="side-top">
        <div className="brand"><span className="brand-mark" aria-hidden="true" />Nini</div>
        <button className="search-btn" onClick={onSearch}><Search size={14} /><span>Rechercher</span><kbd>⌘K</kbd></button>
        <button className="btn primary block" onClick={() => { nav.openNew(); onNavigate(); }}><Plus size={15} /> Nouvelle tâche</button>
      </div>

      <nav className="side-nav">
        {link('/', <Sun size={16} />, 'Aujourd’hui', todayCount, lateCount ? 'late' : undefined)}
        {link('/taches', <ListTodo size={16} />, 'Toutes les tâches')}
        {link('/repartition', <CalendarRange size={16} />, 'Répartition')}
        {link('/calendrier', <CalendarDays size={16} />, 'Calendrier')}
        {link('/rapports', <FileText size={16} />, 'Rapports')}
        {link('/dossiers', <FolderOpen size={16} />, 'Dossiers')}
      </nav>

      <div className="side-clients">
        {groups.map(g => (
          <div key={g.name} className="side-group">
            {groups.length > 1 && <div className="side-group-title"><i style={{ background: g.color }} />{g.name}</div>}
            {g.list.map(c => {
              const st = clientStats(c, tasks);
              return (
                <NavLink key={c.id} to={`/dossiers/${c.id}`} className="nav-link client-link" onClick={onNavigate}>
                  <span className="code">{clientCode(c)}</span><span className="ellipsis">{c.name}</span>
                  {st.overdue ? <b className="nav-count late">{st.overdue}</b> : st.open.length ? <b className="nav-count">{st.open.length}</b> : null}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      <div className="side-bottom">
        {backup.due && store.repo.kind === 'local' && (
          <div className="backup-card">
            <DownloadCloud size={16} />
            <div><b>Sauvegarde conseillée</b><span>{backup.days === null ? 'Aucune sauvegarde pour l’instant' : `Dernière il y a ${backup.days} jours`}</span></div>
            <button className="btn sm" onClick={() => { backup.exportNow(); toast('Sauvegarde téléchargée'); }}>Sauvegarder</button>
          </div>
        )}
        {timerTask && settings.timer && (
          <div className="timer-card" onClick={() => nav.open(timerTask.id)} role="button" tabIndex={0}>
            <span className="rec" />
            <div className="timer-txt"><b>{fmtClock(now - settings.timer.start)}</b><span className="ellipsis">{timerTask.title}</span></div>
            <button className="icon-btn" title="Arrêter et enregistrer"
              onClick={e => { e.stopPropagation(); const m = store.stopTimer(); toast(m ? `${fmtMin(m)} enregistrées` : 'Chrono arrêté (moins d’une minute)'); }}>
              <Pause size={14} />
            </button>
          </div>
        )}
        <NavLink to="/reglages" className="nav-link" onClick={onNavigate}>
          <Settings size={16} /><span>Réglages</span>
          <span className="sync" title={store.repo.kind === 'supabase' ? 'Synchronisé (Supabase)' : 'Données dans ce navigateur'}>
            {store.repo.kind === 'supabase' ? <Cloud size={13} /> : <HardDrive size={13} />}
          </span>
        </NavLink>
      </div>
    </aside>
  );
}
