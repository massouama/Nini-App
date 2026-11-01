import { Archive, ArrowLeft, CalendarPlus, FileText, Mail, Pencil, Phone, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDialogs } from '../components/Dialogs';
import { PageHeader, Section } from '../components/PageHeader';
import { QuickAdd } from '../components/QuickAdd';
import { TaskList } from '../components/TaskRow';
import { useConfirm } from '../components/ui/Confirm';
import { useToast } from '../components/ui/Toasts';
import { useTaskNav } from '../components/useTaskNav';
import { useData, useStore } from '../data/StoreContext';
import { eur, fmtMin, pct } from '../lib/format';
import { REGIMES_TVA } from '../domain/constants';
import { clientStats } from '../domain/stats';
import { fmtDays } from '../domain/planning';
import { byDue, clientCode, isOpen } from '../domain/tasks';

export function ClientDetailPage() {
  const { id = '' } = useParams();
  const { clients, tasks } = useData();
  const store = useStore();
  const dialogs = useDialogs();
  const confirm = useConfirm();
  const toast = useToast();
  const navigate = useNavigate();
  const nav = useTaskNav();
  const [tab, setTab] = useState<'open' | 'done'>('open');
  const c = clients.find(x => x.id === id);
  const [notes, setNotes] = useState(c?.notes ?? '');
  useEffect(() => { setNotes(c?.notes ?? ''); /* eslint-disable-next-line */ }, [c?.id]);
  useEffect(() => {
    if (!c || notes === c.notes) return;
    const h = setTimeout(() => store.upsertClient({ ...c, notes }), 700);
    return () => clearTimeout(h);
  }, [notes, c, store]);

  if (!c) {
    return <div className="page narrow"><div className="empty-block"><p>Ce dossier n’existe plus.</p><Link className="btn" to="/dossiers">Retour aux dossiers</Link></div></div>;
  }

  const year = new Date().getFullYear();
  const st = clientStats(c, tasks, year);
  const open = st.all.filter(isOpen).sort(byDue);
  const done = st.all.filter(t => !isOpen(t)).sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
  const budget = Number(c.budgetHeures) * 60;

  const remove = async () => {
    const ok = await confirm({
      title: `Supprimer « ${c.name} » ?`,
      message: <>Le dossier et ses {st.all.length} tâche(s) seront supprimés définitivement. Pour le mettre de côté, tu peux plutôt l’archiver.</>,
      confirmLabel: 'Supprimer', danger: true,
    });
    if (!ok) return;
    store.deleteClient(c.id);
    navigate('/dossiers');
    toast('Dossier supprimé');
  };
  const archive = () => {
    store.upsertClient({ ...c, archived: !c.archived });
    toast(c.archived ? 'Dossier réactivé' : 'Dossier archivé');
  };

  const facts: [string, React.ReactNode][] = [
    ['Manager', c.manager],
    ['Temps alloué', c.joursMois ? `${fmtDays(c.joursMois)} / mois${c.fenetre ? ` (du ${c.fenetre.from} au ${c.fenetre.to})` : ''}` : ''],
    ['TVA au', c.regimeTva !== 'franchise' ? `${c.jourTva} du mois` : ''],
    ['SIREN', c.siren],
    ['Forme', c.forme],
    ['Imposition', c.regimeFiscal === 'IS' ? 'Impôt sur les sociétés' : 'Impôt sur le revenu'],
    ['TVA', REGIMES_TVA.find(r => r.id === c.regimeTva)?.label],
    ['Clôture', c.cloture.split('-').reverse().join('/')],
    ['Paie', c.paie ? 'Oui' : 'Non'],
    ['Honoraires', c.honoraires ? eur(c.honoraires) : ''],
    ['Budget temps', c.budgetHeures ? `${c.budgetHeures} h / an` : ''],
  ];

  return (
    <div className="page">
      <Link to="/dossiers" className="back"><ArrowLeft size={14} /> Dossiers</Link>
      <PageHeader
        title={<span className="title-with-code"><span className="code xl">{clientCode(c)}</span>{c.name}{c.archived && <span className="tag">Archivé</span>}</span>}
        subtitle={[c.forme, c.activite, c.contact].filter(Boolean).join(' · ')}
        actions={<>
          <button className="btn" onClick={() => dialogs.openGenerator([c.id])}><CalendarPlus size={15} /> Poser les échéances</button>
          <Link className="btn" to={`/rapports?dossier=${c.id}`}><FileText size={15} /> Rapport</Link>
          <button className="btn primary" onClick={() => nav.openNew({ clientId: c.id })}><Plus size={15} /> Tâche</button>
        </>}
      />

      <div className="kpi-row">
        <div className="kpi"><b>{st.open.length}</b><span>ouvertes</span></div>
        <div className={`kpi ${st.overdue ? 'late' : ''}`}><b>{st.overdue}</b><span>en retard</span></div>
        <div className="kpi"><b>{st.waiting}</b><span>en attente client</span></div>
        <div className="kpi"><b>{st.yearDone}<small>/{st.yearTotal}</small></b><span>échéances {year} traitées</span></div>
        <div className={`kpi ${budget && st.minutesYear > budget ? 'late' : ''}`}>
          <b>{fmtMin(st.minutesYear)}</b>
          <span>{budget ? `${pct(st.minutesYear, budget)} % du budget` : `passées en ${year}`}</span>
        </div>
      </div>

      <div className="detail-grid">
        <div>
          <div className="tabs">
            <button className={tab === 'open' ? 'on' : ''} onClick={() => setTab('open')}>À faire <span className="count">{open.length}</span></button>
            <button className={tab === 'done' ? 'on' : ''} onClick={() => setTab('done')}>Terminées <span className="count">{done.length}</span></button>
          </div>
          {tab === 'open' ? (
            <>
              <QuickAdd clientId={c.id} placeholder={`Ajouter une tâche pour ${c.name}…`} />
              <TaskList tasks={open} showClient={false} empty={
                st.all.length ? 'Rien en cours sur ce dossier.' :
                  <button className="btn" onClick={() => dialogs.openGenerator([c.id])}><CalendarPlus size={15} /> Poser les échéances de l’année</button>
              } />
            </>
          ) : <TaskList tasks={done} showClient={false} empty="Aucune tâche terminée." />}
        </div>

        <aside className="side-col">
          <Section title="Fiche" aside={<button className="icon-btn" onClick={() => dialogs.openClient(c.id)} title="Modifier"><Pencil size={14} /></button>}>
            <dl className="facts">
              {facts.filter(([, v]) => v).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
            </dl>
            {(c.email || c.phone) && (
              <div className="contact-links">
                {c.email && <a href={`mailto:${c.email}`}><Mail size={14} /> {c.email}</a>}
                {c.phone && <a href={`tel:${c.phone}`}><Phone size={14} /> {c.phone}</a>}
              </div>
            )}
          </Section>
          <Section title="Notes">
            <textarea className="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={6}
              placeholder="Particularités du dossier, accès, habitudes du client…" />
          </Section>
          <div className="side-actions">
            <button className="btn ghost sm" onClick={archive}><Archive size={14} /> {c.archived ? 'Réactiver' : 'Archiver'}</button>
            <button className="btn ghost sm danger" onClick={remove}><Trash2 size={14} /> Supprimer</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
