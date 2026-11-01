/** Dates au format ISO « AAAA-MM-JJ », interprétées en heure locale. */
export const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const parse = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d || 1);
};

export const today = () => iso(new Date());
export const isoFromMs = (ms: number) => iso(new Date(ms));

export const addDays = (s: string, n: number) => {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return iso(d);
};

export const addMonths = (s: string, n: number) => {
  const d = parse(s);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return iso(d);
};

/** Remplace le jour du mois (borné au dernier jour du mois). */
export const withDay = (s: string, day: number) => {
  const last = new Date(+s.slice(0, 4), +s.slice(5, 7), 0).getDate();
  return s.slice(0, 8) + String(Math.min(day, last)).padStart(2, '0');
};

export const daysBetween = (a: string, b: string) => Math.round((parse(b).getTime() - parse(a).getTime()) / 86400000);

export const startOfWeek = (s: string) => {
  const d = parse(s);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return iso(d);
};

export const endOfMonth = (s: string) => {
  const d = parse(s);
  return iso(new Date(d.getFullYear(), d.getMonth() + 1, 0));
};

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
export const monthName = (m: number) => MONTHS[m];

export const fmtDate = (s?: string | null, style: 'short' | 'medium' | 'long' = 'medium') => {
  if (!s) return '—';
  const opts: Intl.DateTimeFormatOptions =
    style === 'long' ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
      : style === 'short' ? { day: 'numeric', month: 'short' }
        : { day: 'numeric', month: 'short', year: 'numeric' };
  return parse(s).toLocaleDateString('fr-FR', opts);
};

export const fmtWeekday = (s: string) => parse(s).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

export const fmtDateTime = (ms: number) =>
  new Date(ms).toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
