export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/** Durées stockées en minutes. */
export const fmtMin = (m: number) => {
  m = Math.round(m || 0);
  if (!m) return '0h';
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (!h) return `${mm} min`;
  return mm ? `${h}h${String(mm).padStart(2, '0')}` : `${h}h`;
};

/** Accepte « 1h30 », « 1:30 », « 1.5h », « 45 », « 45min ». Renvoie des minutes ou null. */
export const parseDuration = (input: string): number | null => {
  const s = String(input || '').trim().toLowerCase().replace(',', '.').replace(/\s+/g, '');
  if (!s) return null;
  let m: RegExpMatchArray | null;
  if ((m = s.match(/^(\d+(?:\.\d+)?)h(\d{1,2})?(?:m|min)?$/))) return Math.round(parseFloat(m[1]) * 60 + (m[2] ? +m[2] : 0));
  if ((m = s.match(/^(\d+):(\d{1,2})$/))) return +m[1] * 60 + +m[2];
  if ((m = s.match(/^(\d+)(?:m|min)?$/))) return +m[1];
  return null;
};

export const fmtClock = (ms: number) => {
  const t = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  return `${h ? h + ':' : ''}${String(m).padStart(h ? 2 : 1, '0')}:${String(s).padStart(2, '0')}`;
};

export const eur = (n: string | number) =>
  n === '' || n == null || isNaN(Number(n)) ? '—'
    : Number(n).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

export const plural = (n: number, one: string, many = one + 's') => `${n} ${n > 1 ? many : one}`;
