import { CalendarDays, FolderPlus, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader, Section } from '../components/PageHeader';
import { QuickAdd } from '../components/QuickAdd';
import { TaskList } from '../components/TaskRow';
import { useDialogs } from '../components/Dialogs';
import { useData, useStore } from '../data/StoreContext';
import { addDays, capitalize, fmtWeekday, today } from '../lib/dates';
import { plural } from '../lib/format';
import { demoData } from '../domain/demo';
import { byDue, isOpen, isOverdue } from '../domain/tasks';

export function TodayPage() {
  const { clients, tasks, settings } = useData();
  const store = useStore();
  const dialogs = useDialogs();
  const ref = today();

  if (!clients.length && !tasks.length) {
    return (
      <div className="page narrow">
        <div className="welcome">
          <div className="welcome-mark" aria-hidden="true" />
          <h1>Bienvenue{settings.profileName ? `, ${settings.profileName}` : ''}.</h1>
          <p>Ici, chaque dossier client a ses tâches et ses échéances. Commence par créer un dossier : l’app te proposera de poser
            d’un coup les échéances de l’année (TVA, IS, liasse, AG, DSN, CFE…).</p>
          <div className="row">
            <button className="btn primary" onClick={() => dialogs.openClient()}><FolderPlus size={15} /> Créer un premier dossier</button>
            <button className="btn" onClick={() => store.replaceAll(demoData())}><Sparkles size={15} /> Explorer avec des données d’exemple</button>
          </div>
        </div>
      </div>
    );
  }

  const open = tasks.filter(isOpen);
  const active = open.filter(t => t.status !== 'waiting');
  const overdue = active.filter(t => isOverdue(t, ref)).sort(byDue);
  const dueToday = active.filter(t => t.dueDate === ref).sort(byDue);
  const days = Array.from({ length: 7 }, (_, i) => addDays(ref, i + 1));
  const week = days.map(d => ({ day: d, tasks: active.filter(t => t.dueDate === d).sort(byDue) })).filter(g => g.tasks.length);
  const waiting = open.filter(t => t.status === 'waiting').sort((a, b) => (a.waitingSince ?? 0) - (b.waitingSince ?? 0));
  const weekCount = week.reduce((s, g) => s + g.tasks.length, 0);

  const summary = [
    overdue.length ? <Link key="o" className="stat late" to="/taches?f=overdue">{plural(overdue.length, 'en retard', 'en retard')}</Link> : null,
    <span key="t" className="stat">{plural(dueToday.length, 'pour aujourd’hui', 'pour aujourd’hui')}</span>,
    <Link key="w" className="stat" to="/taches?f=week">{weekCount} dans les 7 jours</Link>,
    waiting.length ? <Link key="c" className="stat" to="/taches?f=waiting">{waiting.length} chez le client</Link> : null,
  ].filter(Boolean);

  return (
    <div className="page narrow">
      <PageHeader
        eyebrow={capitalize(fmtWeekday(ref))}
        title="Aujourd’hui"
        subtitle={<span className="stats">{summary}</span>}
      />

      {overdue.length > 0 && (
        <Section title="En retard" count={overdue.length} tone="late">
          <TaskList tasks={overdue} />
        </Section>
      )}

      <Section title="Aujourd’hui" count={dueToday.length}>
        <TaskList tasks={dueToday} empty="Rien d’autre de prévu aujourd’hui." />
        <QuickAdd dueDate={ref} placeholder="Ajouter une tâche pour aujourd’hui…" />
      </Section>

      <Section title="Les 7 prochains jours" count={weekCount} aside={<Link to="/calendrier" className="link-muted"><CalendarDays size={13} /> Calendrier</Link>}>
        {week.length ? week.map(g => (
          <div key={g.day} className="day-group">
            <h3 className="day-title">{g.day === addDays(ref, 1) ? 'Demain' : capitalize(fmtWeekday(g.day))}</h3>
            <TaskList tasks={g.tasks} />
          </div>
        )) : <div className="empty-line">Aucune échéance cette semaine.</div>}
      </Section>

      {waiting.length > 0 && (
        <Section title="En attente du client" count={waiting.length}>
          <TaskList tasks={waiting} extra={t => {
            if (!t.waitingSince) return null;
            const d = Math.floor((Date.now() - t.waitingSince) / 86400000);
            return <span className={d >= 7 ? 'late-text' : ''}>{d ? `relancé il y a ${d} j` : 'relancé aujourd’hui'}</span>;
          }} />
        </Section>
      )}
    </div>
  );
}
