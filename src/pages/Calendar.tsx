import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { PageHeader } from '../components/PageHeader';
import { useTaskNav } from '../components/useTaskNav';
import { useData } from '../data/StoreContext';
import { addDays, addMonths, capitalize, monthName, parse, startOfWeek, today } from '../lib/dates';
import { usePref } from '../lib/usePref';
import { byDue, clientCode, isOverdue } from '../domain/tasks';
import type { Task } from '../domain/types';

export function CalendarPage() {
  const { tasks, clients } = useData();
  const nav = useTaskNav();
  const ref = today();
  const [p, setP] = usePref('calendar', { month: ref.slice(0, 7), client: '' });
  const month = p.month;
  const first = parse(`${month}-01`);
  const start = startOfWeek(`${month}-01`);

  const byDay = useMemo(() => {
    const m = new Map<string, Task[]>();
    tasks.filter(t => t.dueDate && (!p.client || t.clientId === p.client))
      .forEach(t => m.set(t.dueDate, [...(m.get(t.dueDate) ?? []), t]));
    m.forEach(list => list.sort(byDue));
    return m;
  }, [tasks, p.client]);

  const cells: string[] = [];
  for (let i = 0; i < 42; i++) {
    const d = addDays(start, i);
    if (i === 35 && d.slice(0, 7) !== month) break;
    cells.push(d);
  }
  const move = (n: number) => setP({ ...p, month: addMonths(`${month}-01`, n).slice(0, 7) });
  const code = (id: string) => clientCode(clients.find(c => c.id === id));

  return (
    <div className="page wide">
      <PageHeader
        title={capitalize(`${monthName(first.getMonth())} ${first.getFullYear()}`)}
        subtitle="Clique sur un jour pour y ajouter une tâche."
        actions={<>
          <select value={p.client} onChange={e => setP({ ...p, client: e.target.value })}>
            <option value="">Tous les dossiers</option>
            {[...clients].sort((a, b) => a.name.localeCompare(b.name, 'fr')).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="segmented">
            <button onClick={() => move(-1)} aria-label="Mois précédent"><ChevronLeft size={15} /></button>
            <button onClick={() => setP({ ...p, month: ref.slice(0, 7) })}>Aujourd’hui</button>
            <button onClick={() => move(1)} aria-label="Mois suivant"><ChevronRight size={15} /></button>
          </div>
        </>}
      />
      <div className="calendar">
        {['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'].map(d => <div key={d} className="cal-head">{d}</div>)}
        {cells.map(d => {
          const items = byDay.get(d) ?? [];
          return (
            <div key={d} className={`cal-day ${d.slice(0, 7) !== month ? 'out' : ''} ${d === ref ? 'today' : ''} ${d < ref ? 'past' : ''}`}
              onClick={() => nav.openNew({ dueDate: d, clientId: p.client })}>
              <span className="cal-num">{+d.slice(8)}</span>
              {items.slice(0, 4).map(t => (
                <button key={t.id} className={`cal-ev ${t.status === 'done' ? 'done' : isOverdue(t) ? 'late' : `s-${t.status}`}`}
                  title={t.title} onClick={e => { e.stopPropagation(); nav.open(t.id); }}>
                  <i />{t.clientId && <span className="cal-code">{code(t.clientId)}</span>}<span className="ellipsis">{t.title}</span>
                </button>
              ))}
              {items.length > 4 && <span className="cal-more">+ {items.length - 4} autres</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
