import { addDays, iso } from '../lib/dates';

/** Dimanche de Pâques (algorithme grégorien anonyme). */
function easter(year: number) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return iso(new Date(year, month - 1, day));
}

/** Jours fériés en France métropolitaine. */
export function frenchHolidays(year: number): Set<string> {
  const e = easter(year);
  return new Set([
    `${year}-01-01`, addDays(e, 1), `${year}-05-01`, `${year}-05-08`, addDays(e, 39), addDays(e, 50),
    `${year}-07-14`, `${year}-08-15`, `${year}-11-01`, `${year}-11-11`, `${year}-12-25`,
  ]);
}

/** Jours ouvrés (lundi–vendredi hors fériés) d'un mois « AAAA-MM ». */
export function workingDays(month: string): string[] {
  const [y, m] = month.split('-').map(Number);
  const holidays = frenchHolidays(y);
  const out: string[] = [];
  for (let d = new Date(y, m - 1, 1); d.getMonth() === m - 1; d.setDate(d.getDate() + 1)) {
    const s = iso(d);
    if (d.getDay() !== 0 && d.getDay() !== 6 && !holidays.has(s)) out.push(s);
  }
  return out;
}

export const lastWorkingDay = (month: string) => workingDays(month).at(-1)!;
