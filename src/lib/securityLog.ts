/*
 * Journal de sécurité : trace, sur l'appareil, tout ce qui concerne la sortie de données.
 *  - « blocked »    : une connexion a été tentée et le navigateur l'a bloquée (politique de sécurité de l'app) ;
 *  - « sw-blocked » : le module hors ligne (iPad) a refusé une requête vers l'extérieur ;
 *  - « external »   : une requête vers l'extérieur a réellement eu lieu (ne doit jamais arriver) ;
 *  - « test »       : résultat d'un test du verrou lancé à la main ;
 *  - « export »     : un fichier a été exporté volontairement (sauvegarde, CSV) ;
 *  - « restore »    : une sauvegarde a été restaurée ;
 *  - « start »      : ouverture de l'app, avec l'état du verrou.
 * Le journal est conservé dans le navigateur (1 000 dernières entrées) et ne peut pas être effacé depuis l'app.
 */

export type SecurityKind = 'start' | 'blocked' | 'sw-blocked' | 'external' | 'test' | 'export' | 'restore';
export interface SecurityEvent { at: number; kind: SecurityKind; detail: string }

const KEY = 'nini:securite:v1';
const MAX = 1000;
const listeners = new Set<() => void>();
let cache: SecurityEvent[] | null = null;

function read(): SecurityEvent[] {
  if (cache) return cache;
  try { cache = JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { cache = []; }
  return cache!;
}

export function logSecurity(kind: SecurityKind, detail: string) {
  const list = [...read(), { at: Date.now(), kind, detail }].slice(-MAX);
  cache = list;
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* stockage indisponible */ }
  listeners.forEach(l => l());
}

export const getSecurityLog = () => read();
export function subscribeSecurity(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }

/** Politique de sécurité active dans la page (balise CSP), ou null. */
export function activePolicy(): string | null {
  return document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute('content') ?? null;
}
export const networkLocked = () => /connect-src 'none'/.test(activePolicy() ?? '');

const isExternal = (url: string) => {
  if (!/^https?:/i.test(url)) return false;
  try { return new URL(url).origin !== location.origin; } catch { return true; }
};

/** À appeler au démarrage : journalise l'ouverture et branche les détecteurs. */
export function startSecurityMonitoring() {
  logSecurity('start', networkLocked()
    ? 'Ouverture de l’app — verrou réseau actif (aucune connexion autorisée)'
    : 'Ouverture de l’app — verrou réseau absent (version de développement)');

  // 1. Le navigateur signale chaque tentative bloquée par la politique de sécurité.
  const blockedUrls = new Set<string>();
  document.addEventListener('securitypolicyviolation', e => {
    blockedUrls.add(e.blockedURI);
    logSecurity('blocked', `Bloqué par le navigateur : ${e.blockedURI || 'ressource'} (règle ${e.effectiveDirective || e.violatedDirective})`);
  });

  // 2. Le module hors ligne (iPad) signale les requêtes qu'il refuse.
  navigator.serviceWorker?.addEventListener('message', e => {
    if (e.data?.type === 'nini-blocked') logSecurity('sw-blocked', `Refusé par le module hors ligne : ${e.data.method} ${e.data.url}`);
  });

  // 3. Contrôle indépendant : toute ressource externe vue par le navigateur et qui n'a PAS été bloquée
  //    déclenche une alerte. (Une tentative bloquée laisse une trace vide : 0 octet, durée nulle.)
  try {
    const check = (entries: PerformanceEntryList) => entries.forEach(en => {
      if (!isExternal(en.name)) return;
      setTimeout(() => {
        const r = en as PerformanceResourceTiming;
        const stopped = blockedUrls.has(en.name) || [...blockedUrls].some(u => en.name.startsWith(u));
        if (!stopped || r.responseStart > 0 || r.transferSize > 0) logSecurity('external', `Requête vers l’extérieur détectée : ${en.name}`);
      }, 1000);
    });
    check(performance.getEntriesByType('resource'));
    new PerformanceObserver(list => check(list.getEntries())).observe({ type: 'resource', buffered: false });
  } catch { /* navigateur sans PerformanceObserver */ }
}

/**
 * Test du verrou : tente, un par un, 4 moyens d'envoyer des données vers une adresse qui n'existe pas
 * (domaine réservé « .invalid » : même sans verrou, rien ne pourrait partir) et vérifie que le navigateur bloque chacun.
 */
export async function runLeakTest(): Promise<{ channel: string; blocked: boolean }[]> {
  const host = 'test-fuite.invalid';
  let violations = 0;
  const onViolation = (e: SecurityPolicyViolationEvent) => { if (e.blockedURI.includes(host)) violations++; };
  document.addEventListener('securitypolicyviolation', onViolation);
  const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
  const attempt = async (channel: string, run: () => Promise<unknown> | unknown) => {
    const before = violations;
    let threw = false;
    try { await run(); } catch { threw = true; }
    await wait(250);
    return { channel, blocked: violations > before || threw };
  };
  const results = [
    await attempt('Envoi de données (fetch)', () => fetch(`https://${host}/fetch`, { method: 'POST', body: 'test' })),
    await attempt('Envoi discret (beacon)', () => { navigator.sendBeacon(`https://${host}/beacon`, 'test'); }),
    await attempt('Image pisteur', () => new Promise<void>(res => { const img = new Image(); img.onload = img.onerror = () => res(); img.src = `https://${host}/pixel.png`; setTimeout(res, 800); })),
    await attempt('Connexion permanente (WebSocket)', () => { const ws = new WebSocket(`wss://${host}/ws`); setTimeout(() => ws.close(), 100); }),
  ];
  document.removeEventListener('securitypolicyviolation', onViolation);
  const n = results.filter(r => r.blocked).length;
  logSecurity('test', networkLocked()
    ? `Test du verrou : ${n}/4 tentatives d’envoi bloquées (${results.map(r => `${r.channel} : ${r.blocked ? 'bloqué' : 'NON BLOQUÉ'}`).join(' ; ')})`
    : 'Test du verrou : verrou absent (version de développement)');
  return results;
}
