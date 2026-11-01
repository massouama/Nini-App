import { Cloud, Download, HardDrive, LogOut, Sparkles, Trash2, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { PageHeader, Section } from '../components/PageHeader';
import { useConfirm } from '../components/ui/Confirm';
import { useToast } from '../components/ui/Toasts';
import { useBackup } from '../components/useBackup';
import { RoutineEditor } from '../components/RoutineEditor';
import { SecurityPanel } from '../components/SecurityPanel';
import { logSecurity } from '../lib/securityLog';
import { useData, useStore } from '../data/StoreContext';
import { normalizeData } from '../data/normalize';
import { supabase } from '../data/supabase';
import { fmtDate, fmtDateTime, isoFromMs, today } from '../lib/dates';
import { csv, download, readFile } from '../lib/files';
import { REGIMES_TVA, PRIORITIES, STATUSES, label } from '../domain/constants';
import { demoData } from '../domain/demo';
import { byDue, clientCode, defaultSettings, isOverdue, timeSpent } from '../domain/tasks';

export function SettingsPage({ email }: { email?: string }) {
  const data = useData();
  const store = useStore();
  const toast = useToast();
  const confirm = useConfirm();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(data.settings.profileName);
  useEffect(() => {
    if (name === data.settings.profileName) return;
    const h = setTimeout(() => store.setSettings({ profileName: name.trim() }), 600);
    return () => clearTimeout(h);
  }, [name, data.settings.profileName, store]);

  const size = new Blob([JSON.stringify(data)]).size;
  const nameOf = (id: string) => data.clients.find(c => c.id === id)?.name ?? '';

  const { exportNow: exportJson } = useBackup();
  const importJson = async (file: File) => {
    try {
      const parsed = normalizeData(JSON.parse(await readFile(file)));
      const ok = await confirm({
        title: 'Restaurer cette sauvegarde ?',
        message: `${parsed.clients.length} dossiers et ${parsed.tasks.length} tâches. Les données actuelles seront remplacées.`,
        confirmLabel: 'Restaurer', danger: true,
      });
      if (!ok) return;
      await store.replaceAll(parsed);
      logSecurity('restore', `Sauvegarde restaurée depuis le fichier ${file.name} (${parsed.clients.length} dossiers, ${parsed.tasks.length} tâches)`);
      toast('Sauvegarde restaurée');
    } catch {
      toast('Fichier de sauvegarde invalide.', { tone: 'error' });
    }
  };
  const loadDemo = async () => {
    if (data.tasks.length && !(await confirm({ title: 'Charger les données d’exemple ?', message: 'Tes données actuelles seront remplacées.', confirmLabel: 'Remplacer', danger: true }))) return;
    await store.replaceAll(demoData());
    toast('Données d’exemple chargées');
  };
  const reset = async () => {
    if (!(await confirm({ title: 'Tout effacer ?', message: 'Dossiers, tâches et temps seront supprimés définitivement. Pense à exporter une sauvegarde avant.', confirmLabel: 'Tout effacer', danger: true }))) return;
    await store.replaceAll({ clients: [], tasks: [], settings: { ...defaultSettings(), profileName: data.settings.profileName } });
    toast('Données effacées');
  };
  const exportTasks = () => download(`taches-${today()}.csv`, csv([
    ['Dossier', 'Tâche', 'Catégorie', 'Statut', 'Priorité', 'Échéance', 'Terminée le', 'En retard', 'Temps passé (h)', 'Estimé (h)', 'Description'],
    ...[...data.tasks].sort(byDue).map(t => [nameOf(t.clientId), t.title, t.category, label(STATUSES, t.status), label(PRIORITIES, t.priority),
      t.dueDate ? fmtDate(t.dueDate) : '', t.completedAt ? fmtDate(isoFromMs(t.completedAt)) : '', isOverdue(t) ? 'Oui' : '',
      (timeSpent(t) / 60).toFixed(2).replace('.', ','), t.estimate, t.description]),
  ]), 'text/csv');
  const exportClients = () => download(`dossiers-${today()}.csv`, csv([
    ['Code', 'Nom', 'SIREN', 'Forme', 'Activité', 'Imposition', 'TVA', 'Clôture', 'Paie', 'Contact', 'E-mail', 'Téléphone', 'Honoraires', 'Budget (h)', 'Archivé'],
    ...data.clients.map(c => [clientCode(c), c.name, c.siren, c.forme, c.activite, c.regimeFiscal, label(REGIMES_TVA, c.regimeTva), c.cloture.split('-').reverse().join('/'),
      c.paie ? 'Oui' : 'Non', c.contact, c.email, c.phone, c.honoraires, c.budgetHeures, c.archived ? 'Oui' : '']),
  ]), 'text/csv');

  return (
    <div className="page narrow">
      <PageHeader title="Réglages" />

      <Section title="Sécurité">
        <SecurityPanel />
      </Section>

      <Section title="Profil">
        <label className="field"><span>Prénom (affiché sur l’accueil et les rapports)</span>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nini" />
        </label>
      </Section>

      <Section title="Routine mensuelle">
        <p className="muted small">Chaque mois, « Créer les tâches du mois » (page Répartition) génère ces tâches avec leurs étapes à cocher.
          Les périodes servent aussi à proposer la répartition du temps.</p>
        <RoutineEditor />
      </Section>

      <Section title="Stockage">
        {store.repo.kind === 'supabase' ? (
          <div className="setting-row">
            <Cloud size={18} />
            <div><b>Synchronisée entre tes appareils</b><p className="muted small">Connectée en tant que {email}. Les données sont stockées dans ta base Supabase.</p></div>
            <button className="btn" onClick={() => supabase?.auth.signOut()}><LogOut size={14} /> Se déconnecter</button>
          </div>
        ) : (
          <div className="setting-row">
            <HardDrive size={18} />
            <div><b>Données dans ce navigateur, sur cet appareil</b>
              <p className="muted small">Rien ne quitte cet appareil ({(size / 1024).toFixed(0)} Ko). Pour passer sur un autre appareil :
                exporte une sauvegarde ici, transporte le fichier, puis restaure-le là-bas.</p></div>
          </div>
        )}
      </Section>

      <Section title="Sauvegardes">
        <p className="muted small">Dernière sauvegarde : {data.settings.lastBackup ? fmtDateTime(data.settings.lastBackup) : 'jamais'}</p>
        <div className="row">
          <button className="btn primary" onClick={exportJson}><Download size={15} /> Exporter une sauvegarde</button>
          <button className="btn" onClick={() => fileRef.current?.click()}><Upload size={15} /> Restaurer…</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={e => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = ''; }} />
        </div>
      </Section>

      <Section title="Exports Excel">
        <div className="row">
          <button className="btn" onClick={exportTasks}><Download size={15} /> Toutes les tâches</button>
          <button className="btn" onClick={exportClients}><Download size={15} /> Tous les dossiers</button>
        </div>
      </Section>

      <Section title="Données">
        <div className="row">
          <button className="btn" onClick={loadDemo}><Sparkles size={15} /> Charger des données d’exemple</button>
          <button className="btn danger" onClick={reset}><Trash2 size={15} /> Tout effacer</button>
        </div>
        <p className="muted small">Les échéances proposées sont des dates usuelles du calendrier fiscal : elles restent modifiables et sont à vérifier pour chaque dossier.</p>
      </Section>
    </div>
  );
}
