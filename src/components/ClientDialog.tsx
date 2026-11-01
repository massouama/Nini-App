import { useEffect, useState, type ReactNode } from 'react';
import { useData, useStore } from '../data/StoreContext';
import { FORMES, REGIMES_TVA } from '../domain/constants';
import { clientCode, newClient } from '../domain/tasks';
import type { Client } from '../domain/types';
import { Dialog } from './ui/Dialog';
import { useToast } from './ui/Toasts';

const toDisplay = (c: string) => (c ? c.split('-').reverse().join('/') : '31/12');

function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return <label className={`field ${wide ? 'wide' : ''}`}><span>{label}</span>{children}</label>;
}

/** Création / modification d'un dossier. `onCreated` reçoit le dossier créé. */
export function ClientDialog({ open, clientId, onClose, onCreated }: {
  open: boolean; clientId?: string | null; onClose: () => void; onCreated?: (c: Client) => void;
}) {
  const store = useStore();
  const { clients } = useData();
  const toast = useToast();
  const existing = clientId ? clients.find(c => c.id === clientId) : undefined;
  const [c, setC] = useState<Client>(newClient());
  const [cloture, setCloture] = useState('31/12');

  useEffect(() => {
    if (!open) return;
    const base = existing ? { ...existing } : newClient();
    setC(base);
    setCloture(toDisplay(base.cloture));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, clientId]);

  const set = <K extends keyof Client>(k: K, v: Client[K]) => setC(prev => ({ ...prev, [k]: v }));
  const text = (k: keyof Client, props: Record<string, unknown> = {}) => (
    <input value={String(c[k] ?? '')} onChange={e => set(k, e.target.value as never)} {...props} />
  );

  const save = () => {
    const name = c.name.trim();
    if (!name) { toast('Indique le nom du dossier.', { tone: 'error' }); return; }
    const m = cloture.trim().match(/^(\d{1,2})\/(\d{1,2})$/);
    const out: Client = {
      ...c, name, code: c.code.trim().toUpperCase(),
      cloture: m ? `${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : '12-31',
      jourTva: Math.min(Math.max(Number(c.jourTva) || 19, 1), 28),
    };
    store.upsertClient(out);
    onClose();
    if (existing) toast('Dossier enregistré');
    else onCreated?.(out);
  };

  return (
    <Dialog open={open} onClose={onClose} size="lg" title={existing ? 'Modifier le dossier' : 'Nouveau dossier'}
      footer={<>
        <span className="spacer" />
        <button className="btn" onClick={onClose}>Annuler</button>
        <button className="btn primary" onClick={save}>{existing ? 'Enregistrer' : 'Créer le dossier'}</button>
      </>}>
      <form className="form-grid" onSubmit={e => { e.preventDefault(); save(); }}>
        <Field label="Nom ou raison sociale" wide>{text('name', { autoFocus: true, placeholder: 'Boulangerie Martin', required: true })}</Field>
        <Field label="Code">{text('code', { placeholder: clientCode({ name: c.name || 'Nouveau', code: '' }), maxLength: 8, style: { textTransform: 'uppercase' } })}</Field>
        <Field label="SIREN">{text('siren', { inputMode: 'numeric', placeholder: '123 456 789' })}</Field>
        <Field label="Forme juridique">
          <select value={c.forme} onChange={e => set('forme', e.target.value)}>{FORMES.map(f => <option key={f}>{f}</option>)}</select>
        </Field>
        <Field label="Activité">{text('activite', { placeholder: 'Boulangerie-pâtisserie' })}</Field>

        <h4 className="form-sec">Fiscalité</h4>
        <Field label="Imposition des bénéfices">
          <select value={c.regimeFiscal} onChange={e => set('regimeFiscal', e.target.value as Client['regimeFiscal'])}>
            <option value="IS">Impôt sur les sociétés (IS)</option>
            <option value="IR">Impôt sur le revenu (IR)</option>
          </select>
        </Field>
        <Field label="Clôture de l’exercice (JJ/MM)"><input value={cloture} onChange={e => setCloture(e.target.value)} placeholder="31/12" /></Field>
        <Field label="Régime de TVA">
          <select value={c.regimeTva} onChange={e => set('regimeTva', e.target.value as Client['regimeTva'])}>
            {REGIMES_TVA.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </Field>
        <Field label="Jour limite de dépôt TVA"><input type="number" min={1} max={28} value={c.jourTva} onChange={e => set('jourTva', Number(e.target.value))} /></Field>
        <label className="switch wide">
          <input type="checkbox" checked={c.paie} onChange={e => set('paie', e.target.checked)} />
          <span>Le cabinet gère la paie (DSN mensuelle)</span>
        </label>

        <h4 className="form-sec">Contact & mission</h4>
        <Field label="Interlocuteur">{text('contact', { placeholder: 'Nom du dirigeant' })}</Field>
        <Field label="E-mail">{text('email', { type: 'email' })}</Field>
        <Field label="Téléphone">{text('phone', { type: 'tel' })}</Field>
        <Field label="Honoraires annuels (€)">{text('honoraires', { type: 'number', min: 0 })}</Field>
        <Field label="Budget temps annuel (heures)">{text('budgetHeures', { type: 'number', min: 0 })}</Field>
        <Field label="Notes" wide><textarea rows={3} value={c.notes} onChange={e => set('notes', e.target.value)} /></Field>
        <button type="submit" hidden />
      </form>
    </Dialog>
  );
}
