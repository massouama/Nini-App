import { Command } from 'cmdk';
import { CalendarDays, CalendarRange, FileText, FolderOpen, FolderPlus, Inbox, ListTodo, Pause, Play, Plus, Settings, Sun } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData, useStore } from '../data/StoreContext';
import { fmtMin } from '../lib/format';
import { clientCode, isOpen } from '../domain/tasks';
import { useDialogs } from './Dialogs';
import { DueLabel } from './DueLabel';
import { StatusIcon } from './StatusIcon';
import { useToast } from './ui/Toasts';
import { useTaskNav } from './useTaskNav';

/** Palette ⌘K : aller à une page, retrouver une tâche ou un dossier, lancer une action. */
export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { clients, tasks, settings } = useData();
  const store = useStore();
  const navigate = useNavigate();
  const nav = useTaskNav();
  const dialogs = useDialogs();
  const toast = useToast();
  const [search, setSearch] = useState('');
  useEffect(() => { if (!open) setSearch(''); }, [open]);

  const run = (fn: () => void) => { onOpenChange(false); fn(); };
  const openTasks = useMemo(() => {
    const list = search ? tasks : tasks.filter(isOpen);
    return [...list].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, search ? 200 : 8);
  }, [tasks, search]);
  const timerTask = settings.timer && tasks.find(t => t.id === settings.timer!.taskId);

  return (
    <Command.Dialog open={open} onOpenChange={onOpenChange} label="Palette de commandes" className="palette" overlayClassName="palette-overlay">
      <Command.Input value={search} onValueChange={setSearch} placeholder="Rechercher une tâche, un dossier, une action…" />
      <Command.List>
        <Command.Empty>Aucun résultat.</Command.Empty>
        <Command.Group heading="Actions">
          <Command.Item onSelect={() => run(() => nav.openNew())}><Plus size={15} /> Nouvelle tâche <kbd>N</kbd></Command.Item>
          <Command.Item onSelect={() => run(() => dialogs.openClient())}><FolderPlus size={15} /> Nouveau dossier</Command.Item>
          <Command.Item onSelect={() => run(() => dialogs.openGenerator(clients.filter(c => !c.archived).map(c => c.id)))}><CalendarDays size={15} /> Poser les échéances de tous les dossiers</Command.Item>
          {timerTask && (
            <Command.Item onSelect={() => run(() => { const m = store.stopTimer(); toast(m ? `${fmtMin(m)} enregistrées` : 'Chrono arrêté'); })}>
              <Pause size={15} /> Arrêter le chrono · {timerTask.title}
            </Command.Item>
          )}
        </Command.Group>
        <Command.Group heading="Aller à">
          <Command.Item onSelect={() => run(() => navigate('/'))}><Sun size={15} /> Aujourd’hui</Command.Item>
          <Command.Item onSelect={() => run(() => navigate('/taches'))}><ListTodo size={15} /> Toutes les tâches</Command.Item>
          <Command.Item onSelect={() => run(() => navigate('/dossiers'))}><FolderOpen size={15} /> Dossiers</Command.Item>
          <Command.Item onSelect={() => run(() => navigate('/repartition'))}><CalendarRange size={15} /> Répartition du mois</Command.Item>
          <Command.Item onSelect={() => run(() => navigate('/calendrier'))}><CalendarDays size={15} /> Calendrier</Command.Item>
          <Command.Item onSelect={() => run(() => navigate('/rapports'))}><FileText size={15} /> Rapports</Command.Item>
          <Command.Item onSelect={() => run(() => navigate('/reglages'))}><Settings size={15} /> Réglages</Command.Item>
        </Command.Group>
        <Command.Group heading="Dossiers">
          {clients.filter(c => !c.archived || search).map(c => (
            <Command.Item key={c.id} value={`dossier ${c.name} ${clientCode(c)} ${c.siren}`} onSelect={() => run(() => navigate(`/dossiers/${c.id}`))}>
              <span className="code">{clientCode(c)}</span> {c.name}
            </Command.Item>
          ))}
        </Command.Group>
        <Command.Group heading={search ? 'Tâches' : 'Tâches récentes'}>
          {openTasks.map(t => {
            const c = clients.find(x => x.id === t.clientId);
            return (
              <Command.Item key={t.id} value={`tâche ${t.title} ${c?.name ?? ''} ${t.id}`} onSelect={() => run(() => nav.open(t.id))}>
                <StatusIcon status={t.status} />
                <span className="ellipsis">{t.title}</span>
                <span className="palette-side">{c && <span className="code">{clientCode(c)}</span>}<DueLabel task={t} compact /></span>
              </Command.Item>
            );
          })}
          {!search && timerTask === undefined && null}
        </Command.Group>
        {!search && settings.timer === null && tasks.some(t => t.status === 'doing') && (
          <Command.Group heading="Chrono">
            {tasks.filter(t => t.status === 'doing').slice(0, 4).map(t => (
              <Command.Item key={t.id} value={`chrono ${t.title}`} onSelect={() => run(() => store.startTimer(t.id))}>
                <Play size={15} /> Lancer le chrono · {t.title}
              </Command.Item>
            ))}
          </Command.Group>
        )}
        <Command.Item value="raccourcis aide" disabled className="palette-help"><Inbox size={14} /> Astuce : <kbd>N</kbd> nouvelle tâche · <kbd>⌘K</kbd> cette palette · <kbd>Échap</kbd> fermer</Command.Item>
      </Command.List>
    </Command.Dialog>
  );
}
