import { Download, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';
import { useState, useSyncExternalStore } from 'react';
import { fmtDateTime, today } from '../lib/dates';
import { csv, download } from '../lib/files';
import { activePolicy, getSecurityLog, networkLocked, runLeakTest, subscribeSecurity, type SecurityEvent } from '../lib/securityLog';

const LABELS: Record<SecurityEvent['kind'], string> = {
  start: 'Ouverture',
  blocked: 'Bloqué',
  'sw-blocked': 'Refusé',
  external: 'ALERTE',
  test: 'Test',
  export: 'Export',
  restore: 'Restauration',
};

/** Preuve que rien ne sort : état du verrou, test à la demande, journal exportable. */
export function SecurityPanel() {
  const log = useSyncExternalStore(subscribeSecurity, getSecurityLog);
  const [results, setResults] = useState<{ channel: string; blocked: boolean }[] | null>(null);
  const [running, setRunning] = useState(false);
  const locked = networkLocked();
  const external = log.filter(e => e.kind === 'external').length;
  const blocked = log.filter(e => e.kind === 'blocked' || e.kind === 'sw-blocked').length;
  const exports = log.filter(e => e.kind === 'export').length;
  const since = log[0]?.at;

  const test = async () => {
    setRunning(true);
    setResults(await runLeakTest());
    setRunning(false);
  };
  const exportLog = () => download(`nini-journal-securite-${today()}.csv`, csv([
    ['Date', 'Type', 'Détail'],
    ...getSecurityLog().map(e => [fmtDateTime(e.at), LABELS[e.kind], e.detail]),
    [],
    ['Politique de sécurité active', '', activePolicy() ?? 'aucune'],
  ]), 'text/csv');

  return (
    <div className="security">
      <div className={`security-status ${external ? 'alert' : locked ? 'ok' : 'warn'}`}>
        {external ? <ShieldAlert size={22} /> : locked ? <ShieldCheck size={22} /> : <ShieldQuestion size={22} />}
        <div>
          <b>{external ? 'Attention : une connexion vers l’extérieur a été détectée' : locked ? 'Verrou réseau actif : aucune donnée ne peut sortir' : 'Verrou réseau absent (version de développement)'}</b>
          <span>{locked
            ? 'Le navigateur interdit à Nini toute connexion (règle « connect-src ’none’ »). Chaque tentative est bloquée et notée ci-dessous.'
            : 'Utilise Nini.html ou l’app installée sur l’iPad : le verrou y est toujours actif.'}</span>
        </div>
      </div>

      <div className="security-stats">
        <div><b className={external ? 'late-text' : ''}>{external}</b><span>requête vers l’extérieur</span></div>
        <div><b>{blocked}</b><span>tentative{blocked > 1 ? 's' : ''} bloquée{blocked > 1 ? 's' : ''}</span></div>
        <div><b>{exports}</b><span>export{exports > 1 ? 's' : ''} volontaire{exports > 1 ? 's' : ''}</span></div>
      </div>
      {since && <p className="muted small">Journal tenu depuis le {fmtDateTime(since)} sur cet appareil.</p>}

      <div className="row">
        <button className="btn primary" onClick={test} disabled={running}><ShieldCheck size={15} /> {running ? 'Test en cours…' : 'Tester le verrou'}</button>
        <button className="btn" onClick={exportLog}><Download size={15} /> Exporter le journal</button>
      </div>

      {results && (
        <ul className="test-results">
          {results.map(r => (
            <li key={r.channel} className={r.blocked ? 'ok' : 'alert'}>
              <span>{r.blocked ? '✓' : '✕'}</span>{r.channel}<b>{r.blocked ? 'bloqué' : 'non bloqué'}</b>
            </li>
          ))}
        </ul>
      )}

      <details className="security-log">
        <summary>Voir le journal ({log.length} entrées)</summary>
        <ol>
          {[...log].reverse().slice(0, 100).map((e, i) => (
            <li key={i} className={`k-${e.kind}`}>
              <time>{fmtDateTime(e.at)}</time>
              <span className="k">{LABELS[e.kind]}</span>
              <span className="d">{e.detail}</span>
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}
