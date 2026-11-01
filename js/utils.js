'use strict';

/* Petits utilitaires partagés (dates, formatage, export, notifications). */
const U = {
  $(sel, root = document) { return root.querySelector(sel); },
  $$(sel, root = document) { return [...root.querySelectorAll(sel)]; },

  esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },

  uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); },

  /* ---------- Dates (format ISO AAAA-MM-JJ, heure locale) ---------- */
  iso(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },
  parse(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d || 1); },
  today() { return U.iso(new Date()); },
  addDays(s, n) { const d = U.parse(s); d.setDate(d.getDate() + n); return U.iso(d); },
  addMonths(s, n) {
    const d = U.parse(s); const day = d.getDate();
    d.setDate(1); d.setMonth(d.getMonth() + n);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, last));
    return U.iso(d);
  },
  daysBetween(a, b) { return Math.round((U.parse(b) - U.parse(a)) / 86400000); },
  startOfWeek(s) { const d = U.parse(s); const w = (d.getDay() + 6) % 7; d.setDate(d.getDate() - w); return U.iso(d); },
  endOfMonth(s) { const d = U.parse(s); return U.iso(new Date(d.getFullYear(), d.getMonth() + 1, 0)); },
  monthName(m) { return ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'][m]; },

  fmtDate(s, long = false) {
    if (!s) return '—';
    const opts = long ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' } : { day: 'numeric', month: 'short', year: 'numeric' };
    return U.parse(s).toLocaleDateString('fr-FR', opts);
  },
  fmtDateShort(s) { return s ? U.parse(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'; },
  fmtDateTime(ms) {
    return new Date(ms).toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  },
  isoFromMs(ms) { return U.iso(new Date(ms)); },

  /* ---------- Durées (stockées en minutes) ---------- */
  fmtMin(m) {
    m = Math.round(m || 0);
    if (!m) return '0h';
    const h = Math.floor(m / 60), mm = m % 60;
    if (!h) return `${mm} min`;
    return mm ? `${h}h${String(mm).padStart(2, '0')}` : `${h}h`;
  },
  /** Accepte « 1h30 », « 1:30 », « 1.5h », « 45 », « 45min ». Renvoie des minutes ou null. */
  parseDuration(str) {
    const s = String(str || '').trim().toLowerCase().replace(',', '.').replace(/\s+/g, '');
    if (!s) return null;
    let m;
    if ((m = s.match(/^(\d+(?:\.\d+)?)h(\d{1,2})?(?:m|min)?$/))) return Math.round(parseFloat(m[1]) * 60 + (m[2] ? +m[2] : 0));
    if ((m = s.match(/^(\d+):(\d{1,2})$/))) return +m[1] * 60 + +m[2];
    if ((m = s.match(/^(\d+)(?:m|min)?$/))) return +m[1];
    return null;
  },
  fmtClock(ms) {
    const t = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  },

  eur(n) {
    if (n === '' || n == null || isNaN(n)) return '—';
    return Number(n).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  },
  pct(a, b) { return b ? Math.round((a / b) * 100) : 0; },

  /* ---------- Export ---------- */
  download(filename, content, mime = 'text/plain') {
    const blob = new Blob([content], { type: mime + ';charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  /** CSV au format Excel français (séparateur « ; » + BOM UTF-8). */
  csv(rows) {
    const cell = v => {
      const s = String(v ?? '');
      return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return '﻿' + rows.map(r => r.map(cell).join(';')).join('\r\n');
  },

  toast(msg, type = 'ok') {
    const box = U.$('#toasts');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(() => el.classList.add('out'), 2600);
    setTimeout(() => el.remove(), 3000);
  },

  debounce(fn, ms = 200) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; },
};
