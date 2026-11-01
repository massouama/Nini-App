'use strict';

/* =========================================================================
   Icônes
   ========================================================================= */
const ICONS = {
  dash: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  tasks: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  report: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  settings: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  play: '<path d="M7 4l13 8-13 8z"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="1.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  left: '<path d="M15 18l-6-6 6-6"/>',
  right: '<path d="M9 18l6-6-6-6"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  print: '<path d="M6 9V2h12v7"/><rect x="6" y="14" width="12" height="8"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  kanban: '<rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="4" height="8" rx="1"/>',
  alert: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  wand: '<path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M15 9h.01M17.8 6.2L19 5M3 21l9-9M12.2 6.2L11 5"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  archive: '<path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/>',
  hourglass: '<path d="M5 22h14M5 2h14M17 22v-4.2a2 2 0 0 0-.6-1.4L12 12l-4.4 4.4a2 2 0 0 0-.6 1.4V22M7 2v4.2a2 2 0 0 0 .6 1.4L12 12l4.4-4.4a2 2 0 0 0 .6-1.4V2"/>',
};
const ic = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

const esc = U.esc;
const main = () => U.$('#main');
const opt = (value, text, selected) => `<option value="${esc(value)}"${selected ? ' selected' : ''}>${esc(text)}</option>`;
const byDue = (a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999') || PRIO_RANK[b.priority] - PRIO_RANK[a.priority];
const PRIO_RANK = { low: 0, normal: 1, high: 2, urgent: 3 };
const ui = () => (Store.s.ui ||= {});

/* =========================================================================
   Composants
   ========================================================================= */
function statusPill(s) { return `<span class="st st-${s}"><i aria-hidden="true"></i>${esc(label(STATUSES, s))}</span>`; }
function prioBadge(p) { return p === 'high' || p === 'urgent' ? `<span class="prio pr-${p}">${p === 'urgent' ? 'urgent' : 'prioritaire'}</span>` : ''; }

function dueBadge(t) {
  if (!t.dueDate) return '<span class="due muted">sans échéance</span>';
  if (t.status === 'done') return `<span class="due muted">${U.fmtDateShort(t.dueDate)}</span>`;
  const d = U.daysBetween(U.today(), t.dueDate);
  if (d < 0) return `<span class="due late">${-d} j de retard</span>`;
  if (d === 0) return '<span class="due soon">aujourd’hui</span>';
  if (d === 1) return '<span class="due soon">demain</span>';
  if (d <= 7) return `<span class="due near">dans ${d} j</span>`;
  return `<span class="due">${U.fmtDate(t.dueDate)}</span>`;
}

/* Colonne « échéance » des lignes : date courte + écart en jours. */
function dueCell(t) {
  if (!t.dueDate) return '<span class="t-due none">—</span>';
  const d = U.parse(t.dueDate);
  const n = U.daysBetween(U.today(), t.dueDate);
  const rel = t.status === 'done' ? '' : n < 0 ? `+${-n} j` : n === 0 ? 'auj.' : n <= 14 ? `J-${n}` : '';
  return `<span class="t-due ${T.isOverdue(t) ? 'late' : ''} ${t.status === 'done' ? 'done' : ''}"><b>${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}</b>${rel ? `<small>${rel}</small>` : ''}</span>`;
}

/* Code dossier (saisi, sinon déduit du nom : « Boulangerie Martin » → BOUM). */
function clientCode(c) {
  if (!c) return '—';
  if (c.code) return c.code.toUpperCase();
  const w = c.name.replace(/^(SCI|SARL|SAS|SASU|EURL|SA|Dr|Me)\.?\s+/i, '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z ]/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (!w.length) return '—';
  return (w.length > 1 ? w[0].slice(0, 3) + w[1].slice(0, 1) : w[0].slice(0, 4)).toUpperCase();
}
function clientDot(id) {
  const c = Store.client(id);
  if (!c) return '<span class="cref muted">Hors dossier</span>';
  return `<span class="cref"><span class="code">${esc(clientCode(c))}</span>${esc(c.name)}</span>`;
}

function progress(done, total, cls = '') {
  const p = U.pct(done, total);
  return `<span class="bar ${cls}" title="${done}/${total} (${p} %)"><span style="width:${p}%"></span></span>`;
}

function sec(title, count = null, cls = '') {
  return `<h2 class="sec ${cls}">${title}${count != null ? `<span class="count">${count}</span>` : ''}</h2>`;
}

function taskRow(t, { showClient = true, extra = '' } = {}) {
  const done = t.status === 'done';
  const ckN = t.checklist.filter(c => c.done).length;
  const meta = [
    showClient ? esc(Store.clientName(t.clientId)) : '',
    esc(t.category),
    t.checklist.length ? `${ckN}/${t.checklist.length} étapes` : '',
    T.timeSpent(t) ? U.fmtMin(T.timeSpent(t)) : '',
    t.recurrence ? '↻ ' + esc(label(RECURRENCES, t.recurrence).toLowerCase()) : '',
    extra,
  ].filter(Boolean).join('<span class="sep">·</span>');
  const running = Store.s.timer?.taskId === t.id ? '<span class="rec" title="Chrono en cours"></span>' : '';
  return `<div class="trow ${showClient ? '' : 'no-client'} ${T.isOverdue(t) ? 'is-late' : ''} ${done ? 'is-done' : ''}" data-action="open-task" data-id="${t.id}" tabindex="0">
    <input type="checkbox" class="chk" data-action="toggle-done" data-id="${t.id}" ${done ? 'checked' : ''} title="${done ? 'Rouvrir' : 'Marquer comme terminée'}" aria-label="Terminée">
    ${dueCell(t)}
    ${showClient ? `<span class="t-code">${esc(clientCode(Store.client(t.clientId)))}</span>` : ''}
    <div class="trow-main">
      <div class="trow-title">${running}${esc(t.title)}${prioBadge(t.priority)}</div>
      <div class="trow-meta">${meta}</div>
    </div>
    ${statusPill(t.status)}
  </div>`;
}

function emptyState(text, actions = '') {
  return `<div class="empty"><p>${text}</p>${actions}</div>`;
}

function pageHead(title, sub = '', actions = '') {
  return `<header class="page-head"><div><h1>${title}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</div><div class="head-actions no-print">${actions}</div></header>`;
}

function kpi(value, text, cls = '', action = '') {
  return `<div class="kpi ${cls}" ${action}><div class="kpi-v">${value}</div><div class="kpi-l">${text}</div></div>`;
}

function clientSelect(name, selected, { all = false, none = false, attrs = '' } = {}) {
  return `<select name="${name}" ${attrs}>${all ? opt('', 'Tous les dossiers', !selected) : ''}${none ? opt('', '— Sans dossier —', !selected) : ''}${Store.clients(true).map(c => opt(c.id, c.name + (c.archived ? ' (archivé)' : ''), c.id === selected)).join('')}</select>`;
}

function clientStats(c, year = new Date().getFullYear()) {
  const all = Store.tasks().filter(t => t.clientId === c.id);
  const y = String(year);
  const yearTasks = all.filter(t => (t.dueDate || '').startsWith(y));
  const open = all.filter(T.isOpen);
  const minutesYear = all.reduce((s, t) => s + T.timeIn(t, `${y}-01-01`, `${y}-12-31`), 0);
  return {
    all, open,
    overdue: open.filter(T.isOverdue).length,
    waiting: open.filter(t => t.status === 'waiting').length,
    yearDone: yearTasks.filter(t => t.status === 'done').length,
    yearTotal: yearTasks.length,
    minutesYear,
    next: open.filter(t => t.dueDate).sort(byDue)[0],
  };
}

/* =========================================================================
   Vue : Tableau de bord
   ========================================================================= */
function viewDashboard() {
  const today = U.today();
  const tasks = Store.tasks();
  const name = Store.s.profile.name;
  const dateTitle = U.fmtDate(today, true).replace(/^./, c => c.toUpperCase());
  const sub = name ? `Registre de ${esc(name)}` : 'Registre des dossiers';

  if (!Store.clients().length && !tasks.length) {
    return pageHead(dateTitle, sub) + `<div class="welcome">
      <p class="lede">Le registre est vide.</p>
      <p>Commence par ouvrir tes dossiers clients. Pour chacun, l’app peut poser d’un coup les échéances de l’année (TVA, IS, liasse, AG, DSN, CFE…), que tu suis ensuite ligne par ligne.</p>
      <div class="row-gap">
        <button class="btn primary" data-action="new-client">Ouvrir un premier dossier</button>
        <button class="btn" data-action="load-demo">Voir avec des données d’exemple</button>
      </div></div>`;
  }

  const open = tasks.filter(T.isOpen);
  const overdue = open.filter(T.isOverdue).sort(byDue);
  const in7 = U.addDays(today, 7);
  const upcoming = open.filter(t => t.dueDate && t.dueDate >= today && t.dueDate <= U.addDays(today, 14)).sort(byDue);
  const week = open.filter(t => t.dueDate && t.dueDate >= today && t.dueDate <= in7);
  const waiting = open.filter(t => t.status === 'waiting').sort((a, b) => (a.waitingSince || 0) - (b.waitingSince || 0));
  const doing = open.filter(t => t.status === 'doing').sort(byDue);
  const mStart = today.slice(0, 8) + '01', mEnd = U.endOfMonth(today);
  const doneMonth = tasks.filter(t => t.status === 'done' && t.completedAt && U.isoFromMs(t.completedAt) >= mStart).length;
  const timeMonth = tasks.reduce((s, t) => s + T.timeIn(t, mStart, mEnd), 0);

  const list = (arr, empty, max = 8, opts = () => ({})) => arr.length
    ? `<div class="tlist">${arr.slice(0, max).map(t => taskRow(t, opts(t))).join('')}</div>` + (arr.length > max ? `<a class="more" data-action="goto-tasks" data-f="open">${arr.length - max} de plus →</a>` : '')
    : `<p class="nothing">${empty}</p>`;
  const waitOpts = t => {
    const days = t.waitingSince ? Math.floor((Date.now() - t.waitingSince) / 86400000) : null;
    return { extra: days != null ? `<span class="${days >= 7 ? 'late-t' : ''}">relancé il y a ${days} j</span>` : '' };
  };

  const clients = Store.clients().map(c => ({ c, st: clientStats(c) }))
    .sort((a, b) => b.st.overdue - a.st.overdue || (a.st.next?.dueDate || '9').localeCompare(b.st.next?.dueDate || '9'));

  return pageHead(dateTitle, sub) + `
  <section class="kpis">
    ${kpi(open.length, 'ouvertes', '', 'data-action="goto-tasks" data-f="open"')}
    ${kpi(overdue.length, 'en retard', overdue.length ? 'danger' : '', 'data-action="goto-tasks" data-f="overdue"')}
    ${kpi(week.length, 'à 7 jours', '', 'data-action="goto-tasks" data-f="week"')}
    ${kpi(waiting.length, 'chez le client', '', 'data-action="goto-tasks" data-f="waiting"')}
    ${kpi(doneMonth, `faites en ${U.monthName(+today.slice(5, 7) - 1)}`)}
    ${kpi(U.fmtMin(timeMonth), 'saisies ce mois')}
  </section>
  <div class="grid-2">
    <div>
      <section class="block">${sec('En retard', overdue.length, overdue.length ? 'danger-t' : '')}${list(overdue, 'Aucun retard.')}</section>
      <section class="block">${sec('Les quinze prochains jours', upcoming.length)}${list(upcoming, 'Rien d’échu dans les quinze jours.', 10)}</section>
    </div>
    <div>
      <section class="block">${sec('En cours', doing.length)}${list(doing, 'Aucune tâche commencée.')}</section>
      <section class="block">${sec('En attente du client', waiting.length)}${list(waiting, 'Personne à relancer.', 8, waitOpts)}</section>
    </div>
  </div>
  <section class="block">
    ${sec(`Dossiers — exercice ${new Date().getFullYear()}`)}
    ${clients.length ? `<div class="table-wrap"><table class="table">
      <thead><tr><th>Code</th><th>Dossier</th><th>Échéances de l’année</th><th class="num">Ouvertes</th><th class="num">Retard</th><th>Prochaine échéance</th><th class="num">Temps / budget</th></tr></thead>
      <tbody>${clients.map(({ c, st }) => `<tr class="clickable" data-action="goto" data-href="#/dossier/${c.id}">
        <td><span class="code">${esc(clientCode(c))}</span></td>
        <td>${esc(c.name)}</td>
        <td><div class="prog-cell">${progress(st.yearDone, st.yearTotal)}<span class="mono small">${st.yearDone}/${st.yearTotal}</span></div></td>
        <td class="num">${st.open.length}</td>
        <td class="num">${st.overdue ? `<span class="late-t">${st.overdue}</span>` : '<span class="muted">0</span>'}</td>
        <td>${st.next ? `<span class="small ${T.isOverdue(st.next) ? 'late-t' : ''}">${U.fmtDateShort(st.next.dueDate)}</span> <span class="small">${esc(st.next.title)}</span>` : '<span class="muted small">—</span>'}</td>
        <td class="num">${U.fmtMin(st.minutesYear)}${c.budgetHeures ? `<span class="muted"> / ${c.budgetHeures}h</span>` : ''}</td>
      </tr>`).join('')}</tbody></table></div>` : '<p class="nothing">Aucun dossier actif.</p>'}
  </section>`;
}

/* =========================================================================
   Vue : Tâches (liste + kanban)
   ========================================================================= */
function taskFilters() {
  return (ui().tf ||= { q: '', client: '', status: 'open', category: '', priority: '', due: '', sort: 'due', mode: 'list' });
}

function filterTasks(f, { ignoreStatus = false } = {}) {
  const today = U.today();
  const q = f.q.trim().toLowerCase();
  let list = Store.tasks().filter(t => {
    if (f.client && t.clientId !== f.client) return false;
    if (!ignoreStatus) {
      if (f.status === 'open' && t.status === 'done') return false;
      if (!['open', 'all', ''].includes(f.status) && t.status !== f.status) return false;
    }
    if (f.category && t.category !== f.category) return false;
    if (f.priority && t.priority !== f.priority) return false;
    if (f.due) {
      const d = t.dueDate;
      if (f.due === 'overdue' && !T.isOverdue(t)) return false;
      if (f.due === 'today' && d !== today) return false;
      if (f.due === 'week' && !(d && d >= today && d <= U.addDays(today, 7))) return false;
      if (f.due === 'month' && !(d && d.slice(0, 7) === today.slice(0, 7))) return false;
      if (f.due === 'nodate' && d) return false;
    }
    if (q) {
      const hay = `${t.title} ${t.description} ${Store.clientName(t.clientId)} ${t.category}`.toLowerCase();
      if (!q.split(/\s+/).every(w => hay.includes(w))) return false;
    }
    return true;
  });
  const sorts = {
    due: byDue,
    priority: (a, b) => PRIO_RANK[b.priority] - PRIO_RANK[a.priority] || byDue(a, b),
    client: (a, b) => Store.clientName(a.clientId).localeCompare(Store.clientName(b.clientId), 'fr') || byDue(a, b),
    updated: (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0),
  };
  return list.sort(sorts[f.sort] || byDue);
}

function viewTasks() {
  const f = taskFilters();
  const sel = (name, options, val) => `<select data-filter="${name}">${options.map(([v, t]) => opt(v, t, v === val)).join('')}</select>`;
  return pageHead('Tâches', 'Chaque travail à faire, une ligne', `<button class="btn primary" data-action="new-task">Nouvelle tâche</button>`) + `
  <div class="toolbar card">
    <label class="search">${ic('search')}<input type="search" data-filter="q" placeholder="Rechercher une tâche, un dossier…" value="${esc(f.q)}"></label>
    <select data-filter="client">${opt('', 'Tous les dossiers', !f.client)}${Store.clients(true).map(c => opt(c.id, c.name, c.id === f.client)).join('')}</select>
    ${sel('status', [['open', 'Ouvertes'], ['all', 'Tous statuts'], ...STATUSES.map(s => [s.id, s.label])], f.status)}
    ${sel('due', [['', 'Toutes échéances'], ['overdue', 'En retard'], ['today', 'Aujourd’hui'], ['week', '7 prochains jours'], ['month', 'Ce mois-ci'], ['nodate', 'Sans échéance']], f.due)}
    ${sel('category', [['', 'Toutes catégories'], ...CATEGORIES.map(c => [c, c])], f.category)}
    ${sel('priority', [['', 'Toutes priorités'], ...PRIORITIES.map(p => [p.id, p.label])], f.priority)}
    ${sel('sort', [['due', 'Tri : échéance'], ['priority', 'Tri : priorité'], ['client', 'Tri : dossier'], ['updated', 'Tri : modifiées récemment']], f.sort)}
    <div class="seg">
      <button class="${f.mode === 'list' ? 'on' : ''}" data-action="task-mode" data-mode="list" title="Liste">Liste</button>
      <button class="${f.mode === 'kanban' ? 'on' : ''}" data-action="task-mode" data-mode="kanban" title="Colonnes par statut">Colonnes</button>
    </div>
    <button class="btn ghost small-btn" data-action="reset-filters">Réinitialiser</button>
  </div>
  <div id="task-results">${taskResults()}</div>`;
}

function taskResults() {
  const f = taskFilters();
  if (f.mode === 'kanban') {
    const list = filterTasks(f, { ignoreStatus: true });
    const recent = Date.now() - 14 * 86400000;
    return `<p class="muted small">Glisse les cartes d’une colonne à l’autre pour changer leur statut. La colonne « Terminé » affiche les 14 derniers jours.</p>
    <div class="kanban">${STATUSES.map(s => {
      const cards = list.filter(t => t.status === s.id && (s.id !== 'done' || (t.completedAt || 0) >= recent));
      return `<div class="kcol" data-status="${s.id}">
        <div class="kcol-head">${statusPill(s.id)}<span class="count">${cards.length}</span></div>
        <div class="kcol-body">${cards.map(t => `<div class="kcard ${T.isOverdue(t) ? 'is-late' : ''}" draggable="true" data-action="open-task" data-id="${t.id}">
          <div class="kcard-t">${esc(t.title)}</div>
          <div class="kcard-m">${clientDot(t.clientId)}</div>
          <div class="kcard-f">${dueBadge(t)}${prioBadge(t.priority)}</div>
        </div>`).join('') || '<p class="muted small pad">—</p>'}</div>
      </div>`;
    }).join('')}</div>`;
  }
  const list = filterTasks(f);
  const total = list.reduce((s, t) => s + T.timeSpent(t), 0);
  return `<p class="muted small">${list.length} tâche(s)${total ? ` · ${U.fmtMin(total)} passées` : ''}</p>
    <div class="tlist">${list.length ? list.map(t => taskRow(t)).join('') : emptyState('Aucune tâche ne correspond à ces filtres.')}</div>`;
}

/* =========================================================================
   Vue : Dossiers
   ========================================================================= */
function viewClients() {
  const showArch = !!ui().showArchived;
  const q = (ui().cq || '').toLowerCase();
  const clients = Store.clients(showArch).filter(c => !q || `${c.name} ${clientCode(c)} ${c.siren} ${c.contact} ${c.activite}`.toLowerCase().includes(q));
  return pageHead('Répertoire des dossiers', `${Store.clients().length} dossier(s) actif(s)`, `
      <button class="btn" data-action="gen-all">Poser les échéances…</button>
      <button class="btn primary" data-action="new-client">Nouveau dossier</button>`) + `
    <div class="toolbar">
      <label class="search">${ic('search')}<input type="search" id="client-search" placeholder="Nom, code, SIREN, interlocuteur…" value="${esc(ui().cq || '')}"></label>
      <label class="check"><input type="checkbox" data-action="toggle-archived" ${showArch ? 'checked' : ''}> Inclure les archivés</label>
    </div>
    ${clients.length ? `<div class="table-wrap"><table class="table dir">
      <thead><tr><th>Code</th><th>Dossier</th><th>Forme</th><th>Clôture</th><th>Régime</th><th class="num">Ouvertes</th><th class="num">Retard</th><th class="num">Attente</th><th>Avancement</th><th class="num">Temps / budget</th></tr></thead>
      <tbody>${clients.map(c => {
        const st = clientStats(c);
        const over = c.budgetHeures && st.minutesYear > c.budgetHeures * 60;
        return `<tr class="clickable ${c.archived ? 'archived' : ''}" data-action="goto" data-href="#/dossier/${c.id}">
          <td><span class="code">${esc(clientCode(c))}</span></td>
          <td><b>${esc(c.name)}</b>${c.archived ? ' <span class="muted small">(archivé)</span>' : ''}<div class="muted small">${esc(c.activite || c.contact || '')}</div></td>
          <td>${esc(c.forme)}</td>
          <td class="mono">${esc(fmtCloture(c.cloture))}</td>
          <td class="small">${esc(c.regimeFiscal)} · ${esc({ mensuel: 'TVA mens.', trimestriel: 'TVA trim.', ca12: 'CA12', franchise: 'franchise' }[c.regimeTva] || '')}${c.paie ? ' · paie' : ''}</td>
          <td class="num">${st.open.length}</td>
          <td class="num">${st.overdue ? `<span class="late-t">${st.overdue}</span>` : '<span class="muted">0</span>'}</td>
          <td class="num">${st.waiting || '<span class="muted">0</span>'}</td>
          <td><div class="prog-cell">${progress(st.yearDone, st.yearTotal)}<span class="mono small">${st.yearDone}/${st.yearTotal}</span></div></td>
          <td class="num ${over ? 'late-t' : ''}">${U.fmtMin(st.minutesYear)}${c.budgetHeures ? `<span class="muted"> / ${c.budgetHeures}h</span>` : ''}</td>
        </tr>`;
      }).join('')}</tbody></table></div>` : emptyState(q ? 'Aucun dossier ne correspond.' : 'Aucun dossier pour le moment.', `<button class="btn primary" data-action="new-client">Ouvrir un dossier</button>`)}`;
}

function fmtCloture(c) { return c ? c.split('-').reverse().join('/') : '31/12'; }

function viewClient(id) {
  const c = Store.client(id);
  if (!c) return emptyState('Ce dossier n’existe plus.', '<a class="btn" href="#/dossiers">Retour aux dossiers</a>');
  const st = clientStats(c);
  const tab = ui().clientTab || 'open';
  const tasks = st.all.filter(t => tab === 'open' ? T.isOpen(t) : tab === 'done' ? t.status === 'done' : true)
    .sort(tab === 'done' ? (a, b) => (b.completedAt || 0) - (a.completedAt || 0) : byDue);
  const info = [
    ['SIREN', c.siren], ['Forme', c.forme], ['Activité', c.activite], ['Régime fiscal', c.regimeFiscal === 'IS' ? 'Impôt sur les sociétés' : 'Impôt sur le revenu'],
    ['TVA', label(REGIMES_TVA, c.regimeTva)], ['Clôture', fmtCloture(c.cloture)], ['Paie', c.paie ? 'Oui' : 'Non'],
    ['Contact', c.contact], ['E-mail', c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : ''], ['Téléphone', c.phone ? `<a href="tel:${esc(c.phone)}">${esc(c.phone)}</a>` : ''],
    ['Honoraires annuels', c.honoraires ? U.eur(c.honoraires) : ''], ['Budget temps', c.budgetHeures ? `${c.budgetHeures} h / an` : ''],
  ];
  const tabBtn = (k, txt, n) => `<button class="${tab === k ? 'on' : ''}" data-action="client-tab" data-tab="${k}">${txt} <span class="count">${n}</span></button>`;
  const budgetPct = c.budgetHeures ? U.pct(st.minutesYear, c.budgetHeures * 60) : null;

  return `<a href="#/dossiers" class="back no-print">← Répertoire</a>` +
    pageHead(`<span class="code lg">${esc(clientCode(c))}</span> ${esc(c.name)} ${c.archived ? '<span class="muted small">archivé</span>' : ''}`, `${esc(c.forme)} · ${esc(c.activite || 'Activité non renseignée')}`, `
      <button class="btn" data-action="edit-client" data-id="${c.id}">Modifier</button>
      <button class="btn" data-action="gen-client" data-id="${c.id}">Poser les échéances…</button>
      <a class="btn" href="#/rapports?client=${c.id}">Rapport</a>
      <button class="btn primary" data-action="new-task" data-client="${c.id}">Tâche</button>`) + `
    <section class="kpis">
      ${kpi(st.open.length, 'Tâches ouvertes')}
      ${kpi(st.overdue, 'En retard', st.overdue ? 'danger' : 'ok')}
      ${kpi(st.waiting, 'En attente client', st.waiting ? 'info' : '')}
      ${kpi(`${st.yearDone}/${st.yearTotal}`, `Échéances ${new Date().getFullYear()} traitées`)}
      ${kpi(U.fmtMin(st.minutesYear), budgetPct != null ? `Temps passé · ${budgetPct} % du budget` : 'Temps passé cette année', budgetPct > 100 ? 'danger' : budgetPct > 80 ? 'warn' : '')}
    </section>
    <div class="grid-side">
      <section class="card">
        <div class="tabs">${tabBtn('open', 'À faire', st.open.length)}${tabBtn('done', 'Terminées', st.all.length - st.open.length)}${tabBtn('all', 'Toutes', st.all.length)}</div>
        <div class="tlist">${tasks.length ? tasks.map(t => taskRow(t, { showClient: false })).join('') : emptyState(tab === 'open' ? 'Rien en cours sur ce dossier.' : 'Aucune tâche.', tab === 'open' && !st.all.length ? `<button class="btn" data-action="gen-client" data-id="${c.id}">Poser les échéances de l’année</button>` : '')}</div>
      </section>
      <aside>
        <section class="card"><h2 class="sec">Fiche dossier</h2>
          <dl class="facts">${info.filter(([, v]) => v).map(([k, v]) => `<dt>${k}</dt><dd>${k === 'E-mail' || k === 'Téléphone' ? v : esc(v)}</dd>`).join('')}</dl>
        </section>
        <section class="card"><h2 class="sec">Notes</h2>
          <textarea class="notes" data-action-input="client-notes" data-id="${c.id}" rows="7" placeholder="Particularités du dossier, accès, habitudes du client…">${esc(c.notes)}</textarea>
          <p class="muted small">Enregistrement automatique.</p>
        </section>
      </aside>
    </div>`;
}

/* =========================================================================
   Vue : Calendrier
   ========================================================================= */
function viewCalendar() {
  const month = ui().calMonth || U.today().slice(0, 7);
  const cf = ui().calClient || '';
  const first = U.parse(month + '-01');
  const start = U.startOfWeek(month + '-01');
  const today = U.today();
  const tasks = Store.tasks().filter(t => t.dueDate && (!cf || t.clientId === cf));
  const byDay = {};
  tasks.forEach(t => (byDay[t.dueDate] ||= []).push(t));
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = U.addDays(start, i);
    if (i === 35 && d.slice(0, 7) !== month) break;
    const items = (byDay[d] || []).sort(byDue);
    cells.push(`<div class="cday ${d.slice(0, 7) !== month ? 'out' : ''} ${d === today ? 'today' : ''}" data-action="cal-day" data-date="${d}">
      <span class="dnum">${+d.slice(8)}</span>
      ${items.slice(0, 4).map(t => `<div class="cev ${t.status === 'done' ? 'done' : T.isOverdue(t) ? 'late' : ''}" data-action="open-task" data-id="${t.id}" title="${esc(Store.clientName(t.clientId) + ' — ' + t.title)}"><b>${esc(clientCode(Store.client(t.clientId)))}</b> ${esc(t.title)}</div>`).join('')}
      ${items.length > 4 ? `<div class="cmore">+ ${items.length - 4}</div>` : ''}
    </div>`);
  }
  return pageHead('Calendrier des échéances', 'Clique sur un jour pour créer une tâche à cette date', `
      <select id="cal-client">${opt('', 'Tous les dossiers', !cf)}${Store.clients(true).map(c => opt(c.id, c.name, c.id === cf)).join('')}</select>`) + `
    <div class="card">
      <div class="cal-nav">
        <button class="icon-btn" data-action="cal-move" data-d="-1" aria-label="Mois précédent">${ic('left')}</button>
        <h2>${U.monthName(first.getMonth())} ${first.getFullYear()}</h2>
        <button class="icon-btn" data-action="cal-move" data-d="1" aria-label="Mois suivant">${ic('right')}</button>
        <button class="btn ghost small-btn" data-action="cal-today">Aujourd’hui</button>
      </div>
      <div class="cal">
        ${['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'].map(d => `<div class="chead">${d}</div>`).join('')}
        ${cells.join('')}
      </div>
    </div>`;
}

/* =========================================================================
   Vue : Rapports
   ========================================================================= */
function reportParams() {
  return (ui().rep ||= { preset: 'month', from: '', to: '', client: '', includeAll: false, showTime: true });
}

function reportRange(r) {
  const t = U.today(), d = U.parse(t), y = d.getFullYear(), m = d.getMonth();
  switch (r.preset) {
    case 'week': { const s = U.startOfWeek(t); return [s, U.addDays(s, 6), 'Semaine du ' + U.fmtDate(s)]; }
    case 'lastweek': { const s = U.addDays(U.startOfWeek(t), -7); return [s, U.addDays(s, 6), 'Semaine du ' + U.fmtDate(s)]; }
    case 'month': return [t.slice(0, 8) + '01', U.endOfMonth(t), `${U.monthName(m)} ${y}`];
    case 'lastmonth': { const s = U.addMonths(t.slice(0, 8) + '01', -1); return [s, U.endOfMonth(s), `${U.monthName(U.parse(s).getMonth())} ${s.slice(0, 4)}`]; }
    case 'quarter': { const q = Math.floor(m / 3); const s = `${y}-${String(q * 3 + 1).padStart(2, '0')}-01`; return [s, U.endOfMonth(U.addMonths(s, 2)), `T${q + 1} ${y}`]; }
    case 'year': return [`${y}-01-01`, `${y}-12-31`, `Année ${y}`];
    default: {
      const from = r.from || t.slice(0, 8) + '01', to = r.to || t;
      return [from, to, `Du ${U.fmtDate(from)} au ${U.fmtDate(to)}`];
    }
  }
}

function computeReport(r) {
  const [from, to, periodLabel] = reportRange(r);
  const tasks = Store.tasks().filter(t => !r.client || t.clientId === r.client);
  const inRange = d => d >= from && d <= to;
  const done = tasks.filter(t => t.status === 'done' && t.completedAt && inRange(U.isoFromMs(t.completedAt)))
    .sort((a, b) => a.completedAt - b.completedAt);
  const remaining = tasks.filter(t => T.isOpen(t) && (r.includeAll || !t.dueDate || t.dueDate <= to)).sort(byDue);
  const worked = tasks.filter(t => T.timeIn(t, from, to) > 0);
  const minutes = tasks.reduce((s, t) => s + T.timeIn(t, from, to), 0);
  const clientIds = [...new Set([...done, ...remaining, ...worked].map(t => t.clientId))];
  const perClient = clientIds.map(id => {
    const c = Store.client(id);
    const rem = remaining.filter(t => t.clientId === id);
    return {
      id, name: c ? c.name : 'Sans dossier', budget: c?.budgetHeures,
      done: done.filter(t => t.clientId === id).length,
      remaining: rem.length, overdue: rem.filter(T.isOverdue).length,
      waiting: rem.filter(t => t.status === 'waiting').length,
      minutes: tasks.filter(t => t.clientId === id).reduce((s, t) => s + T.timeIn(t, from, to), 0),
    };
  }).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  return { from, to, periodLabel, done, remaining, minutes, perClient, overdue: remaining.filter(T.isOverdue) };
}

function viewReports() {
  const r = reportParams();
  const presets = [['week', 'Cette semaine'], ['lastweek', 'Semaine dernière'], ['month', 'Ce mois'], ['lastmonth', 'Mois dernier'], ['quarter', 'Ce trimestre'], ['year', 'Cette année'], ['custom', 'Période personnalisée']];
  return pageHead('Rapports', 'Ce qui a été fait et ce qu’il reste à faire, par période et par dossier', `
      <button class="btn" data-action="report-csv">Export Excel (CSV)</button>
      <button class="btn primary" data-action="print">Imprimer / PDF</button>`) + `
    <div class="toolbar card no-print">
      <select data-rep="preset">${presets.map(([v, t]) => opt(v, t, v === r.preset)).join('')}</select>
      ${r.preset === 'custom' ? `<label class="inline">Du <input type="date" data-rep="from" value="${esc(r.from)}"></label><label class="inline">au <input type="date" data-rep="to" value="${esc(r.to)}"></label>` : ''}
      ${clientSelect('client', r.client, { all: true, attrs: 'data-rep="client"' })}
      <label class="check"><input type="checkbox" data-rep="includeAll" ${r.includeAll ? 'checked' : ''}> Inclure les tâches à échéance après la période</label>
      <label class="check"><input type="checkbox" data-rep="showTime" ${r.showTime ? 'checked' : ''}> Afficher les temps</label>
    </div>
    <div id="report-out">${reportHTML(r)}</div>`;
}

function reportHTML(r) {
  const R = computeReport(r);
  const who = r.client ? Store.clientName(r.client) : 'Tous les dossiers';
  const author = Store.s.profile.name;
  const groupBy = (arr) => {
    const g = {};
    arr.forEach(t => (g[t.clientId] ||= []).push(t));
    return Object.entries(g).sort((a, b) => Store.clientName(a[0]).localeCompare(Store.clientName(b[0]), 'fr'));
  };
  const time = r.showTime;
  const doneTable = R.done.length ? groupBy(R.done).map(([cid, list]) => `
    <h4>${esc(Store.clientName(cid))} <span class="muted">(${list.length})</span></h4>
    <table class="table rep"><thead><tr><th>Terminée le</th><th>Tâche</th><th>Catégorie</th><th>Échéance</th>${time ? '<th class="num">Temps (période)</th>' : ''}</tr></thead>
    <tbody>${list.map(t => `<tr><td>${U.fmtDate(U.isoFromMs(t.completedAt))}</td><td>${esc(t.title)}</td><td>${esc(t.category)}</td><td>${t.dueDate ? U.fmtDate(t.dueDate) : '—'}${t.dueDate && U.isoFromMs(t.completedAt) > t.dueDate ? ' <span class="late-t small">(hors délai)</span>' : ''}</td>${time ? `<td class="num">${U.fmtMin(T.timeIn(t, R.from, R.to))}</td>` : ''}</tr>`).join('')}</tbody></table>`).join('')
    : '<p class="muted">Aucune tâche terminée sur la période.</p>';
  const remTable = R.remaining.length ? groupBy(R.remaining).map(([cid, list]) => `
    <h4>${esc(Store.clientName(cid))} <span class="muted">(${list.length})</span></h4>
    <table class="table rep"><thead><tr><th>Échéance</th><th>Tâche</th><th>Statut</th><th>Priorité</th><th>Avancement</th></tr></thead>
    <tbody>${list.map(t => `<tr class="${T.isOverdue(t) ? 'late-row' : ''}"><td>${t.dueDate ? U.fmtDate(t.dueDate) : '—'}${T.isOverdue(t) ? ` <span class="late-t small">(retard ${U.daysBetween(t.dueDate, U.today())} j)</span>` : ''}</td><td>${esc(t.title)}</td><td>${esc(label(STATUSES, t.status))}</td><td>${esc(label(PRIORITIES, t.priority))}</td><td>${t.checklist.length ? `${t.checklist.filter(c => c.done).length}/${t.checklist.length} étapes` : '—'}</td></tr>`).join('')}</tbody></table>`).join('')
    : '<p class="muted">Rien à faire sur la période.</p>';

  return `<article class="report card">
    <header class="report-head">
      <div><h2>Rapport d’activité</h2><p><b>${esc(R.periodLabel)}</b> · ${esc(who)}</p></div>
      <p class="muted small">Généré le ${U.fmtDate(U.today())}${author ? ' par ' + esc(author) : ''}</p>
    </header>
    <section class="kpis rep-kpis">
      ${kpi(R.done.length, 'Tâches terminées', 'ok')}
      ${kpi(R.remaining.length, 'Restant à faire')}
      ${kpi(R.overdue.length, 'Dont en retard', R.overdue.length ? 'danger' : '')}
      ${kpi(R.remaining.filter(t => t.status === 'waiting').length, 'En attente client', 'info')}
      ${time ? kpi(U.fmtMin(R.minutes), 'Temps passé') : ''}
    </section>
    ${R.perClient.length > 1 || !r.client ? `<h3>Synthèse par dossier</h3>
    <table class="table rep"><thead><tr><th>Dossier</th><th class="num">Terminées</th><th class="num">Restantes</th><th class="num">En retard</th><th class="num">En attente</th>${time ? '<th class="num">Temps</th>' : ''}</tr></thead>
    <tbody>${R.perClient.map(p => `<tr><td>${esc(p.name)}</td><td class="num">${p.done}</td><td class="num">${p.remaining}</td><td class="num">${p.overdue ? `<span class="late-t">${p.overdue}</span>` : 0}</td><td class="num">${p.waiting}</td>${time ? `<td class="num">${U.fmtMin(p.minutes)}</td>` : ''}</tr>`).join('')}
    <tr class="total"><td>Total</td><td class="num">${R.done.length}</td><td class="num">${R.remaining.length}</td><td class="num">${R.overdue.length}</td><td class="num">${R.remaining.filter(t => t.status === 'waiting').length}</td>${time ? `<td class="num">${U.fmtMin(R.minutes)}</td>` : ''}</tr></tbody></table>` : ''}
    <h3 class="sec-done">I. Travaux réalisés</h3>${doneTable}
    <h3 class="sec-todo">II. Reste à faire ${r.includeAll ? '' : `<span class="muted small">(échéance au plus tard le ${U.fmtDate(R.to)} ou sans échéance)</span>`}</h3>${remTable}
  </article>`;
}

/* =========================================================================
   Vue : Paramètres
   ========================================================================= */
function viewSettings() {
  const s = Store.s;
  const size = new Blob([JSON.stringify(s)]).size;
  return pageHead('Paramètres & sauvegardes') + `
    <div class="grid-2">
      <section class="card"><h2 class="sec">Profil</h2>
        <label class="field"><span>Prénom (affiché sur l’accueil et les rapports)</span><input id="profile-name" value="${esc(s.profile.name)}" placeholder="Ex. Nini"></label>
      </section>
      <section class="card"><h2 class="sec">Sauvegarde</h2>
        <p class="small">Les données sont stockées <b>uniquement dans ce navigateur</b> (${(size / 1024).toFixed(0)} Ko). Pense à exporter une sauvegarde régulièrement, et pour passer d’un appareil à un autre.</p>
        <p class="small muted">Dernière sauvegarde : ${s.lastBackup ? U.fmtDateTime(s.lastBackup) : 'jamais'}</p>
        <div class="row-gap">
          <button class="btn primary" data-action="export-json">Exporter une sauvegarde</button>
          <label class="btn">Restaurer une sauvegarde<input type="file" id="import-file" accept="application/json,.json" hidden></label>
        </div>
      </section>
      <section class="card"><h2 class="sec">Exports</h2>
        <div class="row-gap">
          <button class="btn" data-action="export-tasks-csv">Toutes les tâches (CSV)</button>
          <button class="btn" data-action="export-clients-csv">Tous les dossiers (CSV)</button>
        </div>
      </section>
      <section class="card"><h2 class="sec">Données</h2>
        <div class="row-gap">
          <button class="btn" data-action="load-demo">Charger des données de démonstration</button>
          <button class="btn danger" data-action="reset-all">Tout effacer</button>
        </div>
        <p class="small muted">Les échéances générées sont des dates usuelles du calendrier fiscal : elles restent modifiables et sont à vérifier pour chaque dossier.</p>
      </section>
    </div>`;
}

/* =========================================================================
   Modale générique
   ========================================================================= */
const Modal = {
  el: null, handlers: {}, beforeClose: null,
  open(html, { handlers = {}, beforeClose = null, wide = false } = {}) {
    this.el.innerHTML = html;
    this.el.className = wide ? 'wide' : '';
    this.handlers = handlers;
    this.beforeClose = beforeClose;
    if (!this.el.open) this.el.showModal();
    const first = this.el.querySelector('[autofocus]');
    if (first) first.focus();
  },
  close(force = false) {
    if (!force && this.beforeClose && !this.beforeClose()) return;
    this.el.close();
    this.el.innerHTML = '';
    this.handlers = {}; this.beforeClose = null;
  },
};

/* =========================================================================
   Modale : tâche
   ========================================================================= */
function openTask(id, preset = {}) {
  const existing = id ? Store.task(id) : null;
  if (id && !existing) return;
  const draft = existing ? structuredClone(existing) : newTask(preset);
  let dirty = false;
  const form = () => U.$('#tform', Modal.el);

  const sync = () => {
    const f = form(); if (!f) return;
    ['title', 'description', 'clientId', 'category', 'priority', 'dueDate', 'recurrence'].forEach(k => { draft[k] = f.elements[k].value; });
    draft.estimate = f.elements.estimate.value;
    draft._status = f.elements.status.value;
  };

  const html = () => {
    const status = draft._status || draft.status;
    const total = T.timeSpent(draft);
    const ckDone = draft.checklist.filter(c => c.done).length;
    const running = existing && Store.s.timer?.taskId === draft.id;
    return `<form class="modal-card" id="tform" autocomplete="off">
      <header class="modal-head">
        <h2>${existing ? 'Tâche' : 'Nouvelle tâche'} ${existing && T.isOverdue(existing) ? '<span class="late-t small">en retard</span>' : ''}</h2>
        <button type="button" class="icon-btn" data-m="close" aria-label="Fermer">${ic('x')}</button>
      </header>
      <div class="modal-body two">
        <div class="col-main">
          <label class="field"><span>Intitulé *</span><input name="title" value="${esc(draft.title)}" required placeholder="Ex. Saisie des achats de mars" ${existing ? '' : 'autofocus'}></label>
          <label class="field"><span>Description / notes</span><textarea name="description" rows="3" placeholder="Détails, pièces manquantes, consignes…">${esc(draft.description)}</textarea></label>

          <section class="msub">
            <h3>Étapes ${draft.checklist.length ? `<span class="muted small">${ckDone}/${draft.checklist.length}</span>` : ''}</h3>
            ${draft.checklist.length ? progress(ckDone, draft.checklist.length, 'thin') : ''}
            <ul class="cklist">${draft.checklist.map((c, i) => `<li class="${c.done ? 'done' : ''}"><label><input type="checkbox" data-m="ck-toggle" data-i="${i}" ${c.done ? 'checked' : ''}> <span>${esc(c.text)}</span></label><button type="button" class="icon-btn sm" data-m="ck-del" data-i="${i}" aria-label="Supprimer">${ic('x')}</button></li>`).join('')}</ul>
            <div class="inline-add"><input id="ck-new" placeholder="Ajouter une étape…"><button type="button" class="btn small-btn" data-m="ck-add">Ajouter</button></div>
          </section>

          <section class="msub">
            <h3>Temps passé <span class="muted small">${U.fmtMin(total)}${draft.estimate ? ` / ${draft.estimate} h estimées` : ''}</span></h3>
            ${draft.timeEntries.length ? `<ul class="tentries">${draft.timeEntries.slice().sort((a, b) => b.date.localeCompare(a.date)).map(e => `<li><span>${U.fmtDate(e.date)}</span><b>${U.fmtMin(e.minutes)}</b><span class="muted">${esc(e.note || '')}</span><button type="button" class="icon-btn sm" data-m="te-del" data-id="${e.id}" aria-label="Supprimer">${ic('x')}</button></li>`).join('')}</ul>` : ''}
            <div class="inline-add">
              <input type="date" id="te-date" value="${U.today()}">
              <input id="te-dur" placeholder="Durée (1h30, 45…)" size="10">
              <input id="te-note" placeholder="Note (facultatif)">
              <button type="button" class="btn small-btn" data-m="te-add">Ajouter</button>
            </div>
            ${existing ? `<button type="button" class="btn small-btn ${running ? 'danger' : ''}" data-m="timer">${running ? 'Arrêter le chrono' : 'Lancer le chrono'}</button>` : ''}
          </section>

          <section class="msub">
            <h3>Journal</h3>
            <div class="inline-add"><input id="log-new" placeholder="Ajouter un commentaire (appel client, relance, info…)"><button type="button" class="btn small-btn" data-m="log-add">Publier</button></div>
            <ul class="log">${draft.log.slice().reverse().map(l => `<li class="${l.type}"><span class="muted small">${U.fmtDateTime(l.at)}</span><p>${esc(l.text)}</p></li>`).join('') || '<li class="muted small">Aucun historique.</li>'}</ul>
          </section>
        </div>
        <div class="col-side">
          <label class="field"><span>Dossier</span>${clientSelect('clientId', draft.clientId, { none: true })}</label>
          <label class="field"><span>Statut</span><select name="status">${STATUSES.map(s => opt(s.id, s.label, s.id === status)).join('')}</select></label>
          <label class="field"><span>Priorité</span><select name="priority">${PRIORITIES.map(p => opt(p.id, p.label, p.id === draft.priority)).join('')}</select></label>
          <label class="field"><span>Catégorie</span><select name="category">${CATEGORIES.map(c => opt(c, c, c === draft.category)).join('')}</select></label>
          <label class="field"><span>Échéance</span><input type="date" name="dueDate" value="${esc(draft.dueDate)}"></label>
          <label class="field"><span>Temps estimé (heures)</span><input type="number" name="estimate" min="0" step="0.25" value="${esc(draft.estimate)}"></label>
          <label class="field"><span>Récurrence</span><select name="recurrence">${RECURRENCES.map(r => opt(r.id, r.label, r.id === draft.recurrence)).join('')}</select></label>
          ${draft.recurrence ? '<p class="small muted">Une nouvelle tâche est créée automatiquement quand celle-ci est terminée.</p>' : ''}
          ${existing ? `<p class="small muted">Créée le ${U.fmtDateTime(draft.createdAt)}${draft.completedAt ? `<br>Terminée le ${U.fmtDateTime(draft.completedAt)}` : ''}</p>` : ''}
        </div>
      </div>
      <footer class="modal-foot">
        ${existing ? `<button type="button" class="btn ghost danger-t" data-m="delete">Supprimer</button><button type="button" class="btn ghost" data-m="duplicate">Dupliquer</button>` : ''}
        <span class="spacer"></span>
        <button type="button" class="btn" data-m="close">Annuler</button>
        <button type="submit" class="btn primary">Enregistrer</button>
      </footer>
    </form>`;
  };

  const rerender = () => {
    sync();
    const scroll = U.$('.modal-body', Modal.el)?.scrollTop || 0;
    Modal.el.innerHTML = html();
    bind();
    const body = U.$('.modal-body', Modal.el); if (body) body.scrollTop = scroll;
  };

  const save = (close = true) => {
    sync();
    if (!draft.title.trim()) { U.toast('Indique un intitulé pour la tâche.', 'err'); form().elements.title.focus(); return false; }
    draft.title = draft.title.trim();
    const newStatus = draft._status; delete draft._status;
    let spawned = null;
    if (existing) {
      if (existing.dueDate !== draft.dueDate) T.log(draft, `Échéance : ${U.fmtDate(existing.dueDate)} → ${U.fmtDate(draft.dueDate)}`);
      if (existing.priority !== draft.priority) T.log(draft, `Priorité : ${label(PRIORITIES, existing.priority)} → ${label(PRIORITIES, draft.priority)}`);
      if (existing.clientId !== draft.clientId) T.log(draft, `Dossier : ${Store.clientName(existing.clientId)} → ${Store.clientName(draft.clientId)}`);
      spawned = T.setStatus(draft, newStatus);
    } else {
      T.log(draft, 'Tâche créée');
      if (newStatus !== 'todo') spawned = T.setStatus(draft, newStatus);
    }
    Store.upsertTask(draft);
    if (spawned) { Store.upsertTask(spawned); U.toast(`Prochaine occurrence créée pour le ${U.fmtDate(spawned.dueDate)}`); }
    dirty = false;
    if (close) { Modal.close(true); U.toast(existing ? 'Tâche enregistrée' : 'Tâche créée'); }
    render();
    return true;
  };

  const handlers = {
    close: () => Modal.close(),
    'ck-add': () => {
      const inp = U.$('#ck-new', Modal.el); const v = inp.value.trim(); if (!v) return;
      draft.checklist.push({ id: U.uid(), text: v, done: false }); dirty = true; rerender(); U.$('#ck-new', Modal.el).focus();
    },
    'ck-toggle': el => { const c = draft.checklist[+el.dataset.i]; c.done = !c.done; dirty = true; rerender(); },
    'ck-del': el => { draft.checklist.splice(+el.dataset.i, 1); dirty = true; rerender(); },
    'te-add': () => {
      const min = U.parseDuration(U.$('#te-dur', Modal.el).value);
      if (!min) { U.toast('Durée invalide. Exemples : 1h30, 45, 0:30', 'err'); return; }
      const date = U.$('#te-date', Modal.el).value || U.today();
      draft.timeEntries.push({ id: U.uid(), date, minutes: min, note: U.$('#te-note', Modal.el).value.trim() });
      T.log(draft, `Temps ajouté : ${U.fmtMin(min)} (${U.fmtDate(date)})`);
      dirty = true; rerender();
    },
    'te-del': el => { draft.timeEntries = draft.timeEntries.filter(e => e.id !== el.dataset.id); dirty = true; rerender(); },
    'log-add': () => {
      const v = U.$('#log-new', Modal.el).value.trim(); if (!v) return;
      T.log(draft, v, 'comment'); dirty = true; rerender();
    },
    timer: () => {
      if (!save(false)) return;
      Modal.close(true);
      if (Store.s.timer?.taskId === draft.id) stopTimer(); else startTimer(draft.id);
    },
    delete: () => {
      if (!confirm('Supprimer définitivement cette tâche ?')) return;
      Store.deleteTask(draft.id); Modal.close(true); U.toast('Tâche supprimée'); render();
    },
    duplicate: () => {
      sync();
      const copy = newTask({ ...draft, id: U.uid(), status: 'todo', _status: undefined, completedAt: null, waitingSince: null, key: null, nextSpawned: false, timeEntries: [], log: [], createdAt: Date.now(), title: draft.title + ' (copie)', checklist: draft.checklist.map(c => ({ ...c, id: U.uid(), done: false })) });
      delete copy._status;
      T.log(copy, 'Tâche dupliquée');
      Store.upsertTask(copy); Modal.close(true); render(); openTask(copy.id);
    },
  };

  const bind = () => {
    const f = form();
    f.addEventListener('submit', e => { e.preventDefault(); save(); });
    f.addEventListener('input', () => { dirty = true; });
    f.elements.recurrence.addEventListener('change', rerender);
    const enter = (sel, h) => U.$(sel, Modal.el).addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); handlers[h](); } });
    enter('#ck-new', 'ck-add'); enter('#te-dur', 'te-add'); enter('#te-note', 'te-add'); enter('#log-new', 'log-add');
  };

  Modal.open(html(), { handlers, wide: true, beforeClose: () => !dirty || confirm('Fermer sans enregistrer les modifications ?') });
  bind();
}

/* =========================================================================
   Modale : dossier
   ========================================================================= */
function openClient(id) {
  const existing = id ? Store.client(id) : null;
  const c = existing ? { ...existing } : newClient();
  const f = (name, lbl, input) => `<label class="field"><span>${lbl}</span>${input}</label>`;
  const inp = (name, attrs = '') => `<input name="${name}" value="${esc(c[name])}" ${attrs}>`;
  Modal.open(`<form class="modal-card" id="cform" autocomplete="off">
    <header class="modal-head"><h2>${existing ? 'Modifier le dossier' : 'Nouveau dossier'}</h2><button type="button" class="icon-btn" data-m="close" aria-label="Fermer">${ic('x')}</button></header>
    <div class="modal-body">
      <div class="form-grid">
        ${f('name', 'Nom / raison sociale *', inp('name', 'required autofocus placeholder="Ex. Boulangerie Martin"'))}
        ${f('code', 'Code dossier', inp('code', 'maxlength="8" placeholder="' + esc(clientCode({ name: c.name || 'Nouveau' })) + ' (auto)" style="text-transform:uppercase"'))}
        ${f('siren', 'SIREN', inp('siren', 'inputmode="numeric" placeholder="123 456 789"'))}
        ${f('forme', 'Forme juridique', `<select name="forme">${FORMES.map(x => opt(x, x, x === c.forme)).join('')}</select>`)}
        ${f('activite', 'Activité', inp('activite', 'placeholder="Ex. Boulangerie-pâtisserie"'))}
        ${f('regimeFiscal', 'Imposition des bénéfices', `<select name="regimeFiscal">${opt('IS', 'Impôt sur les sociétés (IS)', c.regimeFiscal === 'IS')}${opt('IR', 'Impôt sur le revenu (IR)', c.regimeFiscal === 'IR')}</select>`)}
        ${f('cloture', 'Date de clôture (JJ/MM)', `<input name="cloture" value="${esc(fmtCloture(c.cloture))}" pattern="\\d{1,2}/\\d{1,2}" placeholder="31/12">`)}
        ${f('regimeTva', 'Régime de TVA', `<select name="regimeTva">${REGIMES_TVA.map(r => opt(r.id, r.label, r.id === c.regimeTva)).join('')}</select>`)}
        ${f('jourTva', 'Jour limite de dépôt TVA', `<input type="number" name="jourTva" min="1" max="28" value="${esc(c.jourTva)}">`)}
        ${f('contact', 'Interlocuteur', inp('contact', 'placeholder="Nom du dirigeant"'))}
        ${f('email', 'E-mail', inp('email', 'type="email"'))}
        ${f('phone', 'Téléphone', inp('phone', 'type="tel"'))}
        ${f('honoraires', 'Honoraires annuels (€)', inp('honoraires', 'type="number" min="0" step="1"'))}
        ${f('budgetHeures', 'Budget temps annuel (heures)', inp('budgetHeures', 'type="number" min="0" step="1"'))}
        <label class="check field-check"><input type="checkbox" name="paie" ${c.paie ? 'checked' : ''}> Gestion de la paie (DSN mensuelle)</label>
      </div>
      <label class="field"><span>Notes</span><textarea name="notes" rows="3">${esc(c.notes)}</textarea></label>
    </div>
    <footer class="modal-foot">
      ${existing ? `<button type="button" class="btn ghost danger-t" data-m="delete">Supprimer</button><button type="button" class="btn ghost" data-m="archive">${c.archived ? 'Désarchiver' : 'Archiver'}</button>` : ''}
      <span class="spacer"></span>
      <button type="button" class="btn" data-m="close">Annuler</button>
      <button type="submit" class="btn primary">${existing ? 'Enregistrer' : 'Créer le dossier'}</button>
    </footer>
  </form>`, {
    handlers: {
      close: () => Modal.close(true),
      delete: () => {
        const n = Store.tasks().filter(t => t.clientId === c.id).length;
        if (!confirm(`Supprimer le dossier « ${c.name} » et ses ${n} tâche(s) ? Cette action est définitive.\n\nAstuce : tu peux plutôt l’archiver.`)) return;
        Store.deleteClient(c.id); Modal.close(true); U.toast('Dossier supprimé'); location.hash = '#/dossiers';
      },
      archive: () => { const x = Store.client(c.id); x.archived = !x.archived; Store.upsertClient(x); Modal.close(true); U.toast(x.archived ? 'Dossier archivé' : 'Dossier réactivé'); render(); },
    },
  });
  U.$('#cform').addEventListener('submit', e => {
    e.preventDefault();
    const el = e.target.elements;
    const out = { ...c };
    ['name', 'code', 'siren', 'forme', 'activite', 'regimeFiscal', 'regimeTva', 'contact', 'email', 'phone', 'honoraires', 'budgetHeures', 'notes'].forEach(k => { out[k] = el[k].value.trim(); });
    out.jourTva = parseInt(el.jourTva.value, 10) || 19;
    out.paie = el.paie.checked;
    const m = el.cloture.value.trim().match(/^(\d{1,2})\/(\d{1,2})$/);
    out.cloture = m ? `${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : '12-31';
    if (!out.name) return;
    Store.upsertClient(out);
    Modal.close(true);
    if (!existing) {
      U.toast('Dossier créé');
      location.hash = `#/dossier/${out.id}`;
      if (confirm('Poser maintenant les échéances de l’année pour ce dossier (TVA, IS, liasse, AG…) ?')) openGenerator([out.id]);
    } else { U.toast('Dossier enregistré'); render(); }
  });
}

/* =========================================================================
   Modale : générateur d'échéances
   ========================================================================= */
function openGenerator(clientIds) {
  const thisYear = new Date().getFullYear();
  let year = thisYear;
  let checked = null;
  const multi = clientIds.length > 1;

  const items = () => {
    const keys = Obligations.existingKeys();
    return clientIds.flatMap(id => Obligations.forClient(Store.client(id), year))
      .map(o => ({ ...o, exists: keys.has(o.key), past: o.dueDate < U.today() }));
  };

  const html = () => {
    const list = items();
    if (!checked) checked = new Set(list.filter(o => !o.exists && !o.past).map(o => o.key));
    const byClient = {};
    list.forEach(o => (byClient[o.clientId] ||= []).push(o));
    const n = list.filter(o => checked.has(o.key) && !o.exists).length;
    return `<div class="modal-card">
      <header class="modal-head"><h2>Poser les échéances</h2><button type="button" class="icon-btn" data-m="close" aria-label="Fermer">${ic('x')}</button></header>
      <div class="modal-body">
        <div class="toolbar">
          <label class="inline">Année / exercice clos en <select id="gen-year">${[thisYear - 1, thisYear, thisYear + 1].map(y => opt(y, y, y === year)).join('')}</select></label>
          <button class="btn ghost small-btn" data-m="all">Tout cocher</button>
          <button class="btn ghost small-btn" data-m="none">Tout décocher</button>
        </div>
        <p class="small muted">Dates usuelles du calendrier fiscal, à vérifier et ajuster au besoin. Les échéances déjà passées sont décochées par défaut ; celles déjà créées sont grisées.</p>
        ${Object.entries(byClient).map(([cid, arr]) => `
          ${multi ? `<h3 class="gen-client">${clientDot(cid)}</h3>` : ''}
          <ul class="gen-list">${arr.map(o => `<li class="${o.exists ? 'exists' : ''} ${o.past ? 'past' : ''}">
            <label><input type="checkbox" data-m="tog" data-key="${esc(o.key)}" ${o.exists ? 'disabled checked' : checked.has(o.key) ? 'checked' : ''}>
            <span class="gen-date">${U.fmtDate(o.dueDate)}</span><span>${esc(o.title)}</span><span class="muted small">${esc(o.category)}${o.exists ? ' · déjà créée' : ''}</span></label></li>`).join('')}</ul>`).join('') || '<p class="muted">Aucune échéance.</p>'}
      </div>
      <footer class="modal-foot"><span class="spacer"></span><button class="btn" data-m="close">Annuler</button><button class="btn primary" data-m="create" ${n ? '' : 'disabled'}>Créer ${n} tâche(s)</button></footer>
    </div>`;
  };
  const rerender = () => {
    const sc = U.$('.modal-body', Modal.el)?.scrollTop || 0;
    Modal.el.innerHTML = html(); bind();
    U.$('.modal-body', Modal.el).scrollTop = sc;
  };
  const bind = () => U.$('#gen-year', Modal.el).addEventListener('change', e => { year = +e.target.value; checked = null; rerender(); });

  Modal.open(html(), {
    wide: true,
    handlers: {
      close: () => Modal.close(true),
      tog: el => { const k = el.dataset.key; checked.has(k) ? checked.delete(k) : checked.add(k); rerender(); },
      all: () => { items().forEach(o => checked.add(o.key)); rerender(); },
      none: () => { checked.clear(); rerender(); },
      create: () => {
        const list = items().filter(o => checked.has(o.key) && !o.exists);
        list.forEach(o => Store.s.tasks.push(Obligations.toTask(o)));
        Store.save();
        Modal.close(true);
        U.toast(`${list.length} tâche(s) créée(s)`);
        render();
      },
    },
  });
  bind();
}

/* =========================================================================
   Chronomètre
   ========================================================================= */
function startTimer(taskId) {
  if (Store.s.timer) stopTimer(true);
  const t = Store.task(taskId); if (!t) return;
  Store.s.timer = { taskId, start: Date.now() };
  if (t.status === 'todo') { T.setStatus(t, 'doing'); Store.upsertTask(t); }
  Store.save();
  U.toast('Chrono lancé');
  render();
}
function stopTimer(silent = false) {
  const tm = Store.s.timer; if (!tm) return;
  Store.s.timer = null;
  const t = Store.task(tm.taskId);
  const min = Math.round((Date.now() - tm.start) / 60000);
  if (t && min >= 1) {
    t.timeEntries.push({ id: U.uid(), date: U.isoFromMs(tm.start), minutes: min, note: 'Chrono' });
    T.log(t, `Temps ajouté (chrono) : ${U.fmtMin(min)}`);
    Store.upsertTask(t);
    if (!silent) U.toast(`${U.fmtMin(min)} ajoutées à « ${t.title} »`);
  } else {
    Store.save();
    if (!silent) U.toast('Chrono arrêté (moins d’une minute, rien d’enregistré)', 'info');
  }
  render();
}
function renderTimer() {
  const box = U.$('#timer-box');
  const tm = Store.s.timer;
  const t = tm && Store.task(tm.taskId);
  if (!t) { box.innerHTML = ''; box.hidden = true; return; }
  box.hidden = false;
  box.innerHTML = `<div class="timer" data-action="open-task" data-id="${t.id}" title="Ouvrir la tâche">
    <span class="rec"></span><div class="timer-txt"><b id="timer-clock">${U.fmtClock(Date.now() - tm.start)}</b><span>${esc(t.title)}</span></div>
    <button class="icon-btn" data-action="stop-timer" title="Arrêter et enregistrer">${ic('stop')}</button></div>`;
}
setInterval(() => {
  const el = U.$('#timer-clock');
  if (el && Store.s.timer) el.textContent = U.fmtClock(Date.now() - Store.s.timer.start);
}, 1000);

/* =========================================================================
   Exports
   ========================================================================= */
function tasksCSV(tasks) {
  return U.csv([
    ['Dossier', 'Tâche', 'Catégorie', 'Statut', 'Priorité', 'Échéance', 'Terminée le', 'En retard', 'Temps passé (h)', 'Estimé (h)', 'Description'],
    ...tasks.map(t => [Store.clientName(t.clientId), t.title, t.category, label(STATUSES, t.status), label(PRIORITIES, t.priority),
      t.dueDate ? U.fmtDate(t.dueDate) : '', t.completedAt ? U.fmtDate(U.isoFromMs(t.completedAt)) : '', T.isOverdue(t) ? 'Oui' : '',
      (T.timeSpent(t) / 60).toFixed(2).replace('.', ','), t.estimate, t.description]),
  ]);
}

/* =========================================================================
   Actions (délégation d'événements)
   ========================================================================= */
const Actions = {
  'new-task': el => openTask(null, { clientId: el.dataset.client || (currentRoute().name === 'dossier' ? currentRoute().id : ''), dueDate: el.dataset.date || '' }),
  'open-task': el => openTask(el.dataset.id),
  'toggle-done': (el, e) => {
    e.stopPropagation();
    const t = Store.task(el.dataset.id); if (!t) return;
    const spawned = T.setStatus(t, t.status === 'done' ? 'todo' : 'done');
    if (t.status === 'done' && Store.s.timer?.taskId === t.id) stopTimer(true);
    Store.upsertTask(t);
    if (spawned) { Store.upsertTask(spawned); U.toast(`Terminée · prochaine occurrence le ${U.fmtDate(spawned.dueDate)}`); }
    else U.toast(t.status === 'done' ? 'Tâche terminée' : 'Tâche rouverte', 'info');
    render();
  },
  'new-client': () => openClient(null),
  'edit-client': el => openClient(el.dataset.id),
  'gen-client': el => openGenerator([el.dataset.id]),
  'gen-all': () => {
    const ids = Store.clients().map(c => c.id);
    if (!ids.length) { U.toast('Crée d’abord un dossier.', 'err'); return; }
    openGenerator(ids);
  },
  goto: el => { location.hash = el.dataset.href; },
  'goto-tasks': el => {
    const f = taskFilters();
    Object.assign(f, { q: '', client: '', category: '', priority: '', status: 'open', due: '', mode: 'list' });
    if (el.dataset.f === 'overdue') f.due = 'overdue';
    if (el.dataset.f === 'week') f.due = 'week';
    if (el.dataset.f === 'waiting') f.status = 'waiting';
    Store.save();
    location.hash = '#/taches';
  },
  'task-mode': el => { taskFilters().mode = el.dataset.mode; Store.save(); render(); },
  'reset-filters': () => { const m = taskFilters().mode; ui().tf = null; taskFilters().mode = m; Store.save(); render(); },
  'toggle-archived': () => { ui().showArchived = !ui().showArchived; Store.save(); render(); },
  'client-tab': el => { ui().clientTab = el.dataset.tab; render(); },
  'cal-move': el => { const m = ui().calMonth || U.today().slice(0, 7); ui().calMonth = U.addMonths(m + '-01', +el.dataset.d).slice(0, 7); Store.save(); render(); },
  'cal-today': () => { ui().calMonth = U.today().slice(0, 7); render(); },
  'cal-day': el => openTask(null, { dueDate: el.dataset.date, clientId: ui().calClient || '' }),
  'stop-timer': (el, e) => { e.stopPropagation(); stopTimer(); },
  print: () => window.print(),
  'report-csv': () => {
    const R = computeReport(reportParams());
    const rows = [['Section', 'Dossier', 'Tâche', 'Catégorie', 'Statut', 'Priorité', 'Échéance', 'Terminée le', 'En retard', 'Temps sur la période (h)']];
    R.done.forEach(t => rows.push(['Réalisé', Store.clientName(t.clientId), t.title, t.category, label(STATUSES, t.status), label(PRIORITIES, t.priority), t.dueDate ? U.fmtDate(t.dueDate) : '', U.fmtDate(U.isoFromMs(t.completedAt)), '', (T.timeIn(t, R.from, R.to) / 60).toFixed(2).replace('.', ',')]));
    R.remaining.forEach(t => rows.push(['Reste à faire', Store.clientName(t.clientId), t.title, t.category, label(STATUSES, t.status), label(PRIORITIES, t.priority), t.dueDate ? U.fmtDate(t.dueDate) : '', '', T.isOverdue(t) ? 'Oui' : '', (T.timeIn(t, R.from, R.to) / 60).toFixed(2).replace('.', ',')]));
    U.download(`rapport_${R.from}_${R.to}.csv`, U.csv(rows), 'text/csv');
  },
  'export-json': () => {
    Store.s.lastBackup = Date.now(); Store.save();
    U.download(`nini-sauvegarde-${U.today()}.json`, JSON.stringify(Store.s, null, 2), 'application/json');
    render();
  },
  'export-tasks-csv': () => U.download(`taches-${U.today()}.csv`, tasksCSV(Store.tasks().slice().sort(byDue)), 'text/csv'),
  'export-clients-csv': () => U.download(`dossiers-${U.today()}.csv`, U.csv([
    ['Nom', 'SIREN', 'Forme', 'Activité', 'Imposition', 'TVA', 'Clôture', 'Paie', 'Contact', 'E-mail', 'Téléphone', 'Honoraires', 'Budget (h)', 'Archivé'],
    ...Store.clients(true).map(c => [clientCode(c), c.name, c.siren, c.forme, c.activite, c.regimeFiscal, label(REGIMES_TVA, c.regimeTva), fmtCloture(c.cloture), c.paie ? 'Oui' : 'Non', c.contact, c.email, c.phone, c.honoraires, c.budgetHeures, c.archived ? 'Oui' : '']),
  ]), 'text/csv'),
  'load-demo': () => {
    if (Store.tasks().length && !confirm('Remplacer les données actuelles par les données de démonstration ?')) return;
    loadDemo(); U.toast('Données de démonstration chargées'); location.hash = '#/'; render();
  },
  'reset-all': () => {
    if (!confirm('Effacer TOUTES les données (dossiers, tâches, temps) ? Pense à exporter une sauvegarde avant.')) return;
    if (prompt('Pour confirmer, tape EFFACER') !== 'EFFACER') return;
    Store.s = defaultState(); Store.save(); U.toast('Données effacées', 'info'); location.hash = '#/'; render();
  },
};

document.addEventListener('click', e => {
  // Actions propres aux modales
  if (Modal.el.contains(e.target)) {
    const m = e.target.closest('[data-m]');
    if (m && Modal.handlers[m.dataset.m]) { if (m.tagName !== 'INPUT') e.preventDefault(); Modal.handlers[m.dataset.m](m, e); }
    return;
  }
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const fn = Actions[el.dataset.action];
  if (fn) fn(el, e);
});

document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.trow')) { e.preventDefault(); openTask(e.target.dataset.id); }
  if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !Modal.el.open && !e.target.closest('input,textarea,select')) { e.preventDefault(); openTask(null); }
});

document.addEventListener('input', U.debounce(e => {
  const t = e.target;
  if (t.matches('[data-filter="q"]')) { taskFilters().q = t.value; Store.save(); U.$('#task-results').innerHTML = taskResults(); }
  if (t.id === 'client-search') {
    ui().cq = t.value;
    const pos = t.selectionStart; render();
    const n = U.$('#client-search'); n.focus(); n.setSelectionRange(pos, pos);
  }
  if (t.dataset.actionInput === 'client-notes') { const c = Store.client(t.dataset.id); c.notes = t.value; Store.upsertClient(c); }
  if (t.id === 'profile-name') { Store.s.profile.name = t.value.trim(); Store.save(); }
}, 250));

document.addEventListener('change', e => {
  const t = e.target;
  if (t.matches('select[data-filter]')) { taskFilters()[t.dataset.filter] = t.value; Store.save(); U.$('#task-results').innerHTML = taskResults(); }
  if (t.matches('[data-rep]')) {
    const r = reportParams();
    r[t.dataset.rep] = t.type === 'checkbox' ? t.checked : t.value;
    if (t.dataset.rep === 'preset' && t.value === 'custom' && !r.from) { r.from = U.today().slice(0, 8) + '01'; r.to = U.today(); }
    Store.save(); render();
  }
  if (t.id === 'cal-client') { ui().calClient = t.value; Store.save(); render(); }
  if (t.id === 'import-file' && t.files[0]) importBackup(t.files[0]);
});

/* Kanban : glisser-déposer */
document.addEventListener('dragstart', e => {
  const card = e.target.closest?.('.kcard'); if (!card) return;
  e.dataTransfer.setData('text/plain', card.dataset.id);
  card.classList.add('dragging');
});
document.addEventListener('dragend', e => e.target.classList?.remove('dragging'));
document.addEventListener('dragover', e => {
  const col = e.target.closest?.('.kcol'); if (!col) return;
  e.preventDefault();
  U.$$('.kcol.over').forEach(c => c !== col && c.classList.remove('over'));
  col.classList.add('over');
});
document.addEventListener('drop', e => {
  const col = e.target.closest?.('.kcol'); if (!col) return;
  e.preventDefault();
  const t = Store.task(e.dataTransfer.getData('text/plain'));
  if (t) {
    const spawned = T.setStatus(t, col.dataset.status);
    Store.upsertTask(t);
    if (spawned) { Store.upsertTask(spawned); U.toast(`Prochaine occurrence créée pour le ${U.fmtDate(spawned.dueDate)}`); }
  }
  render();
});

function importBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data.clients) || !Array.isArray(data.tasks)) throw new Error('format');
      if (!confirm(`Restaurer cette sauvegarde (${data.clients.length} dossiers, ${data.tasks.length} tâches) ? Les données actuelles seront remplacées.`)) return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      Store.load(); U.toast('Sauvegarde restaurée'); render();
    } catch (err) {
      U.toast('Fichier de sauvegarde invalide.', 'err');
    }
  };
  reader.readAsText(file);
}

/* =========================================================================
   Routeur
   ========================================================================= */
function currentRoute() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, query] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  const params = Object.fromEntries(new URLSearchParams(query || ''));
  return { name: parts[0] || 'dashboard', id: parts[1], params };
}

function render() {
  const r = currentRoute();
  const views = {
    dashboard: viewDashboard, taches: viewTasks, dossiers: viewClients, calendrier: viewCalendar,
    rapports: viewReports, parametres: viewSettings, dossier: () => viewClient(r.id),
  };
  if (r.name === 'rapports' && r.params.client !== undefined) {
    reportParams().client = r.params.client; Store.save();
    history.replaceState(null, '', '#/rapports');
  }
  const view = views[r.name] || viewDashboard;
  main().innerHTML = view();
  U.$$('.nav a').forEach(a => a.classList.toggle('active', a.dataset.route === (r.name === 'dossier' ? 'dossiers' : r.name)));
  const late = Store.tasks().filter(T.isOverdue).length;
  const b = U.$('#nav-late'); b.textContent = late; b.hidden = !late;
  renderTimer();
  document.title = `Nini · ${{ dashboard: 'Tableau de bord', taches: 'Tâches', dossiers: 'Dossiers', dossier: Store.client(r.id)?.name || 'Dossier', calendrier: 'Calendrier', rapports: 'Rapports', parametres: 'Paramètres' }[r.name] || 'Suivi'}`;
}

window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });

/* =========================================================================
   Données de démonstration
   ========================================================================= */
function loadDemo() {
  Store.s = defaultState();
  Store.s.profile.name = 'Nini';
  const today = U.today();
  const year = +today.slice(0, 4);
  let seed = 7;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const clients = [
    newClient({ name: 'Boulangerie Martin', siren: '512 345 678', forme: 'SARL', activite: 'Boulangerie-pâtisserie', regimeTva: 'mensuel', jourTva: 19, paie: true, contact: 'Paul Martin', email: 'contact@boulangerie-martin.fr', phone: '01 23 45 67 89', honoraires: 3600, budgetHeures: 45, notes: 'Envoie les relevés bancaires par mail vers le 10 du mois. Caisse enregistreuse certifiée.' }),
    newClient({ name: 'Dupont Conseil', siren: '843 210 987', forme: 'SASU', activite: 'Conseil en management', regimeTva: 'trimestriel', jourTva: 21, cloture: '06-30', contact: 'Claire Dupont', email: 'claire@dupont-conseil.fr', honoraires: 2200, budgetHeures: 22 }),
    newClient({ name: 'Garage Petit', siren: '398 765 432', forme: 'SAS', activite: 'Réparation automobile', regimeTva: 'ca12', jourTva: 17, cloture: '09-30', paie: true, contact: 'Marc Petit', phone: '06 12 34 56 78', honoraires: 4100, budgetHeures: 50, notes: 'Stock de pièces à inventorier chaque fin septembre.' }),
    newClient({ name: 'Dr Sophie Leroy', siren: '901 234 567', forme: 'EI', activite: 'Médecin généraliste (BNC)', regimeFiscal: 'IR', regimeTva: 'franchise', contact: 'Sophie Leroy', email: 's.leroy@exemple.fr', honoraires: 1300, budgetHeures: 12 }),
    newClient({ name: 'SCI Les Tilleuls', siren: '789 456 123', forme: 'SCI', activite: 'Location immobilière', regimeFiscal: 'IR', regimeTva: 'franchise', contact: 'Famille Bernard', honoraires: 800, budgetHeures: 8 }),
  ];
  clients.forEach(c => Store.s.clients.push(c));

  const toMs = (iso, h = 10) => { const d = U.parse(iso); d.setHours(h); return d.getTime(); };
  clients.forEach(c => {
    [year - 1, year].forEach(y => Obligations.forClient(c, y).forEach(o => {
      if (o.dueDate < U.addMonths(today, -8) || o.dueDate > U.addMonths(today, 7)) return;
      const t = Obligations.toTask(o);
      t.createdAt = toMs(U.addDays(o.dueDate, -40));
      if (o.dueDate < today) {
        const late = rnd() < 0.08 && o.dueDate > U.addDays(today, -30);
        if (!late) {
          const doneOn = U.addDays(o.dueDate, -Math.floor(rnd() * 6) - 1);
          t.status = 'done'; t.completedAt = toMs(doneOn, 16);
          t.checklist.forEach(ck => { ck.done = true; });
          t.timeEntries.push({ id: U.uid(), date: doneOn, minutes: 15 * (1 + Math.floor(rnd() * 8)), note: '' });
          T.log(t, 'Statut : À faire → Terminé');
        }
      } else if (o.dueDate < U.addDays(today, 10) && rnd() < 0.4) {
        t.status = 'doing';
        t.timeEntries.push({ id: U.uid(), date: U.addDays(today, -1), minutes: 30, note: '' });
      }
      Store.s.tasks.push(t);
    }));
  });

  const [bm, dc, gp, sl, sci] = clients;
  const manual = [
    { clientId: bm.id, title: 'Saisie des achats et ventes – mois précédent', category: 'Saisie comptable', dueDate: U.addDays(today, 5), recurrence: 'monthly', estimate: 3, priority: 'normal' },
    { clientId: bm.id, title: 'Rapprochement bancaire – mois précédent', category: 'Rapprochement bancaire', dueDate: U.addDays(today, 6), recurrence: 'monthly', estimate: 1 },
    { clientId: gp.id, title: 'Relancer le client : relevés bancaires manquants', category: 'Relance client', dueDate: U.addDays(today, -3), status: 'waiting', priority: 'high', description: 'Relevés Crédit Agricole d’août et septembre manquants.', waitingSince: Date.now() - 9 * 86400000 },
    { clientId: dc.id, title: 'Rendez-vous de présentation des comptes', category: 'Rendez-vous / Conseil', dueDate: U.addDays(today, 9), estimate: 1.5, description: 'Présenter le bilan au 30/06 et discuter de la rémunération / dividendes.' },
    { clientId: sl.id, title: 'Récupérer les relevés SNIR / honoraires rétrocédés', category: 'Relance client', dueDate: U.addDays(today, 12), status: 'waiting', waitingSince: Date.now() - 3 * 86400000 },
    { clientId: sci.id, title: 'Mettre à jour le tableau des loyers et charges', category: 'Saisie comptable', dueDate: U.addDays(today, 20), estimate: 1 },
    { clientId: gp.id, title: 'Inventaire du stock de pièces au 30/09', category: 'Révision / Bilan', dueDate: U.addDays(today, -1), priority: 'urgent', status: 'doing', checklist: ['Recevoir l’état de stock', 'Contrôler les valorisations', 'Passer l’écriture de variation'] },
    { clientId: '', title: 'Mettre à jour la lettre de mission type du cabinet', category: 'Administratif', dueDate: '', priority: 'low' },
  ];
  manual.forEach(m => {
    const t = newTask({ ...m, checklist: (m.checklist || []).map(text => ({ id: U.uid(), text, done: false })) });
    if (m.status === 'doing') t.timeEntries.push({ id: U.uid(), date: U.addDays(today, -2), minutes: 90, note: 'Contrôle des quantités' });
    T.log(t, 'Tâche créée');
    if (m.status === 'waiting') T.log(t, 'Mail de relance envoyé au client', 'comment');
    Store.s.tasks.push(t);
  });
  Store.save();
}

/* =========================================================================
   Démarrage
   ========================================================================= */
Store.load();
Modal.el = U.$('#modal');
Modal.el.addEventListener('cancel', e => { e.preventDefault(); Modal.close(); });
render();
