// ---------- auth / fetch helpers ----------

const token = localStorage.getItem('keystone_token');
const user = JSON.parse(localStorage.getItem('keystone_user') || 'null');

if (!token || !user) {
  window.location.href = '/index.html';
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
      ...(options.headers || {})
    }
  });
  if (res.status === 401) {
    signOut();
    return;
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message || ('Request failed (' + res.status + ')'));
  }
  return body;
}

function signOut() {
  localStorage.removeItem('keystone_token');
  localStorage.removeItem('keystone_user');
  window.location.href = '/index.html';
}

// ---------- icons (inline SVG, no external library) ----------

const ICON_PATHS = {
  board: '<rect x="3" y="3" width="7" height="18" rx="1.5"/><rect x="14" y="3" width="7" height="11" rx="1.5"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  logout: '<path d="M15 17l5-5-5-5M20 12H9M12 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>',
  pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  building: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 17l-5-5-9 8"/>',
  video: '<rect x="2" y="5" width="14" height="14" rx="2"/><path d="M16 10l6-3v10l-6-3z"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  inbox: '<path d="M3 13l3-8h12l3 8v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 13h5l1 3h6l1-3h5"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>'
};

function icon(name, size = 16) {
  return `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ''}</svg>`;
}

function fillIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach(el => {
    if (!el.dataset.filled) {
      el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon));
      el.dataset.filled = '1';
    }
  });
}

// ---------- small UI helpers ----------

function toast(message, isError) {
  const el = document.createElement('div');
  el.className = 'toast' + (isError ? ' error' : ' success');
  el.innerHTML = `${icon(isError ? 'alert' : 'check', 18)}<span>${escapeHtml(message)}</span>`;
  document.getElementById('toastStack').appendChild(el);
  setTimeout(() => el.classList.add('leaving'), 3400);
  setTimeout(() => el.remove(), 3800);
}

function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function initials(name) {
  if (!name) return '?';
  return name.replace(/\(.*?\)/g, '').trim().split(/\s+/).slice(0, 2).map(p => p[0].toUpperCase()).join('');
}

// Stable colour per person, so the same technician always gets the same avatar colour.
function avatarColor(name) {
  const palette = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#db2777', '#7c3aed', '#2563eb', '#dc2626'];
  let h = 0;
  for (const c of (name || '')) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return palette[h % palette.length];
}

function avatar(name, size = 'sm') {
  return `<span class="avatar avatar-${size}" style="background:${avatarColor(name)}">${escapeHtml(initials(name))}</span>`;
}

function formatDateTime(v) {
  if (!v) return '—';
  return new Date(v).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(v) {
  const diff = (Date.now() - new Date(v).getTime()) / 60000;
  if (diff < 1) return 'just now';
  if (diff < 60) return Math.round(diff) + ' min ago';
  if (diff < 1440) return Math.round(diff / 60) + ' h ago';
  return Math.round(diff / 1440) + ' d ago';
}

function humanDuration(minutes) {
  const m = Math.abs(minutes);
  if (m < 60) return Math.max(1, Math.round(m)) + ' min';
  if (m < 1440) return Math.round(m / 60) + ' h';
  return Math.round(m / 1440) + ' d';
}

const DONE_STATUSES = ['COMPLETED', 'CLOSED', 'CANCELLED'];

// SLA chip: "Due in 3 h", "Overdue 2 h" or "Done".
function slaChip(w) {
  if (DONE_STATUSES.includes(w.status)) {
    return `<span class="sla-chip sla-done">${icon('check', 12)} ${w.status === 'CANCELLED' ? 'Cancelled' : 'Done'}</span>`;
  }
  if (!w.slaDueAt) return '';
  const mins = (new Date(w.slaDueAt).getTime() - Date.now()) / 60000;
  if (w.overdue || mins < 0) {
    return `<span class="sla-chip sla-over">${icon('alert', 12)} Overdue ${humanDuration(mins)}</span>`;
  }
  const cls = mins < 120 ? 'sla-soon' : 'sla-ok';
  return `<span class="sla-chip ${cls}">${icon('clock', 12)} Due in ${humanDuration(mins)}</span>`;
}

const STATUS_LABELS = {
  NEW: 'New', ASSIGNED: 'Assigned', IN_PROGRESS: 'In progress', ON_HOLD: 'On hold',
  COMPLETED: 'Completed', CLOSED: 'Closed', CANCELLED: 'Cancelled'
};
const PRIORITY_LABELS = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', URGENT: 'Urgent' };

function statusPill(status) {
  return `<span class="status-pill st-${status}"><span class="st-dot"></span>${STATUS_LABELS[status] || status}</span>`;
}

function priorityBadge(p) {
  return `<span class="badge badge-${p}">${icon('flag', 11)} ${PRIORITY_LABELS[p] || p}</span>`;
}

// ---------- shell ----------

const isDispatchOrManager = user.role === 'DISPATCHER' || user.role === 'MANAGER';

document.getElementById('roleTag').textContent = user.role.toLowerCase();
document.getElementById('whoTag').textContent = user.name;
const userAvatarEl = document.getElementById('userAvatar');
userAvatarEl.textContent = initials(user.name);
userAvatarEl.style.background = avatarColor(user.name);

// Each role sees the board framed around their job.
const BOARD_COPY = {
  CUSTOMER:   { eyebrow: 'Customer portal', title: 'My Requests', lede: 'Raise a problem and follow it until it is fixed.', button: 'Raise a complaint' },
  TECHNICIAN: { eyebrow: 'Field work', title: 'My Jobs', lede: 'Jobs assigned to you. Start, update and complete them here.', button: '' },
  DISPATCHER: { eyebrow: 'Dispatch', title: 'Dispatch Board', lede: 'Assign new jobs to technicians and keep every SLA on track.', button: 'New work order' },
  MANAGER:    { eyebrow: 'Operations', title: 'Operations Board', lede: 'Every job across every site, from raised to closed.', button: 'New work order' }
};
const copy = BOARD_COPY[user.role] || BOARD_COPY.DISPATCHER;
document.getElementById('boardEyebrow').textContent = copy.eyebrow;
document.getElementById('boardTitle').textContent = copy.title;
document.getElementById('boardLede').textContent = copy.lede;
document.getElementById('newWorkOrderLabel').textContent = copy.button;
document.getElementById('createTitleText').textContent = user.role === 'CUSTOMER' ? 'Raise a complaint' : 'Raise a work order';
if (user.role === 'CUSTOMER') {
  document.getElementById('createSubmitBtn').lastChild.textContent = ' Raise complaint';
}

if (!isDispatchOrManager) {
  document.getElementById('navDashboard').classList.add('hidden');
}
if (user.role === 'TECHNICIAN') {
  document.getElementById('newWorkOrderBtn').classList.add('hidden');
}
// Only customers raise-and-upload in one go; dispatchers/managers can raise jobs but not upload.
if (user.role !== 'CUSTOMER') {
  document.getElementById('createPhotoBlock').classList.add('hidden');
}

function showView(view) {
  document.getElementById('viewBoard').classList.toggle('hidden', view !== 'board');
  document.getElementById('viewDashboard').classList.toggle('hidden', view !== 'dashboard');
  document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.view === view));
  if (view === 'dashboard') loadDashboard();
}

// Close any modal with Escape.
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!document.getElementById('viewerBackdrop').classList.contains('hidden')) return closeViewer();
  closeDetailModal();
  closeCreateModal();
});
['createModalBackdrop', 'detailModalBackdrop'].forEach(id => {
  document.getElementById(id).addEventListener('mousedown', e => {
    if (e.target.id === id) id === 'createModalBackdrop' ? closeCreateModal() : closeDetailModal();
  });
});

// ---------- board ----------

const COLUMNS = [
  { key: 'NEW', label: 'New' },
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'ON_HOLD', label: 'On Hold' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CLOSED', label: 'Closed' },
  { key: 'CANCELLED', label: 'Cancelled' }
];

let workOrders = [];
let filterText = '';
let filterPriority = '';

async function loadBoard() {
  try {
    workOrders = await api('/api/work-orders');
    renderSummary();
    renderBoard();
  } catch (err) {
    toast(err.message, true);
  }
}

function renderSummary() {
  const open = workOrders.filter(w => !DONE_STATUSES.includes(w.status));
  const stats = [
    { label: 'Open jobs', value: open.length, icon: 'inbox', tone: 'blue' },
    { label: 'Waiting for a technician', value: workOrders.filter(w => w.status === 'NEW').length, icon: 'user', tone: 'amber' },
    { label: 'In progress', value: workOrders.filter(w => w.status === 'IN_PROGRESS' || w.status === 'ON_HOLD').length, icon: 'wrench', tone: 'violet' },
    { label: 'SLA overdue', value: open.filter(w => w.overdue).length, icon: 'alert', tone: 'red' }
  ];
  document.getElementById('summaryStrip').innerHTML = stats.map(s => `
    <div class="summary-card tone-${s.tone}">
      <div class="summary-ico">${icon(s.icon, 18)}</div>
      <div>
        <div class="summary-value">${s.value}</div>
        <div class="summary-label">${s.label}</div>
      </div>
    </div>
  `).join('');
}

function matchesFilters(w) {
  if (filterPriority && w.priority !== filterPriority) return false;
  if (!filterText) return true;
  const hay = [w.title, w.code, w.siteName, w.customerName, w.assignedToName].join(' ').toLowerCase();
  return hay.includes(filterText);
}

function renderBoard() {
  const board = document.getElementById('board');
  board.innerHTML = '';
  const visible = workOrders.filter(matchesFilters);

  COLUMNS.forEach(col => {
    const items = visible.filter(w => w.status === col.key);
    const colEl = document.createElement('div');
    colEl.className = 'board-col col-' + col.key;
    colEl.innerHTML = `
      <div class="board-col-header">
        <span class="col-title"><span class="col-dot"></span>${col.label}</span>
        <span class="count-badge">${items.length}</span>
      </div>
      <div class="col-body"></div>
    `;
    const body = colEl.querySelector('.col-body');
    if (items.length === 0) {
      body.innerHTML = '<div class="empty-col">No jobs here</div>';
    } else {
      items.forEach(w => body.appendChild(renderCard(w)));
    }
    board.appendChild(colEl);
  });
}

function renderCard(w) {
  const card = document.createElement('div');
  card.className = 'wo-card pr-' + w.priority + (w.overdue && !DONE_STATUSES.includes(w.status) ? ' overdue' : '');
  card.onclick = () => openDetailModal(w.id);
  card.innerHTML = `
    <div class="wo-top">
      <span class="wo-code">${w.code}</span>
      ${priorityBadge(w.priority)}
    </div>
    <div class="wo-title">${escapeHtml(w.title)}</div>
    <div class="wo-meta">
      <div>${icon('pin', 12)} ${escapeHtml(w.siteName)}</div>
      ${isDispatchOrManager ? `<div>${icon('building', 12)} ${escapeHtml(w.customerName)}</div>` : ''}
    </div>
    <div class="wo-foot">
      ${w.assignedToName
        ? `<span class="wo-tech">${avatar(w.assignedToName, 'xs')} ${escapeHtml(w.assignedToName)}</span>`
        : '<span class="wo-unassigned">Unassigned</span>'}
      ${slaChip(w)}
    </div>
  `;
  return card;
}

document.getElementById('searchInput').addEventListener('input', e => {
  filterText = e.target.value.trim().toLowerCase();
  renderBoard();
});

document.querySelectorAll('#priorityFilter .chip').forEach(chip => {
  chip.onclick = () => {
    document.querySelectorAll('#priorityFilter .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    filterPriority = chip.dataset.priority;
    renderBoard();
  };
});

// ---------- create work order ----------

const COMMON_ISSUES = [
  'AC not cooling', 'Water leak', 'Power / electrical fault', 'Lights not working',
  'Blocked drain', 'Lift not working', 'Appliance broke down', 'Door / lock broken'
];

document.getElementById('issueChips').innerHTML = COMMON_ISSUES
  .map(i => `<button type="button" class="chip" data-issue="${escapeHtml(i)}">${escapeHtml(i)}</button>`).join('');
document.querySelectorAll('#issueChips .chip').forEach(chip => {
  chip.onclick = () => {
    document.querySelectorAll('#issueChips .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const title = document.getElementById('createTitle');
    title.value = chip.dataset.issue;
    title.focus();
  };
});

function syncPriorityPicker() {
  document.querySelectorAll('#priorityPicker .priority-option').forEach(opt => {
    opt.classList.toggle('selected', opt.querySelector('input').checked);
  });
}
document.querySelectorAll('#priorityPicker input').forEach(r => r.addEventListener('change', syncPriorityPicker));
syncPriorityPicker();

// Photo picker: click or drag-and-drop, with a preview of what will be sent.
const createPhoto = document.getElementById('createPhoto');
const dropzone = document.getElementById('createDropzone');
createPhoto.addEventListener('change', () => showCreatePreview(createPhoto.files[0]));
['dragenter', 'dragover'].forEach(ev => dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.add('drag'); }));
['dragleave', 'drop'].forEach(ev => dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.remove('drag'); }));
dropzone.addEventListener('drop', e => {
  if (e.dataTransfer.files.length) {
    createPhoto.files = e.dataTransfer.files;
    showCreatePreview(createPhoto.files[0]);
  }
});

function showCreatePreview(file) {
  const preview = document.getElementById('createPreview');
  if (!file) {
    preview.classList.add('hidden');
    dropzone.classList.remove('hidden');
    preview.innerHTML = '';
    return;
  }
  const isImage = file.type.startsWith('image/');
  preview.innerHTML = `
    ${isImage ? `<img src="${URL.createObjectURL(file)}" alt="">` : `<div class="fp-ico">${icon('video', 22)}</div>`}
    <div class="fp-text">
      <div class="fp-name">${escapeHtml(file.name)}</div>
      <div class="fp-size">${(file.size / 1024 / 1024).toFixed(2)} MB</div>
    </div>
    <button type="button" class="icon-btn" id="createPreviewRemove" aria-label="Remove">${icon('x')}</button>
  `;
  preview.classList.remove('hidden');
  dropzone.classList.add('hidden');
  document.getElementById('createPreviewRemove').onclick = () => {
    createPhoto.value = '';
    showCreatePreview(null);
  };
}

async function openCreateModal() {
  document.getElementById('createModalBackdrop').classList.remove('hidden');
  const customerSelect = document.getElementById('createCustomer');
  customerSelect.innerHTML = '';
  document.getElementById('createSite').innerHTML = '';

  try {
    const customers = await api('/api/customers');
    customers.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      customerSelect.appendChild(opt);
    });
    // A customer login belongs to exactly one company, so there is nothing to choose.
    customerSelect.disabled = user.role === 'CUSTOMER';
    await loadSitesFor(customerSelect.value);
    document.getElementById('createTitle').focus();
  } catch (err) {
    toast(err.message, true);
  }
}

async function loadSitesFor(customerId) {
  const siteSelect = document.getElementById('createSite');
  siteSelect.innerHTML = '';
  if (!customerId) return;
  const sites = await api('/api/customers/' + customerId + '/sites');
  sites.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.name;
    siteSelect.appendChild(opt);
  });
}

document.getElementById('createCustomer').addEventListener('change', (e) => loadSitesFor(e.target.value));

function closeCreateModal() {
  document.getElementById('createModalBackdrop').classList.add('hidden');
  document.getElementById('createForm').reset();
  document.querySelectorAll('#issueChips .chip').forEach(c => c.classList.remove('active'));
  syncPriorityPicker();
  showCreatePreview(null);
}

document.getElementById('createForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const photo = createPhoto.files[0];
  const btn = document.getElementById('createSubmitBtn');
  btn.disabled = true;
  try {
    const created = await api('/api/work-orders', {
      method: 'POST',
      body: JSON.stringify({
        customerId: Number(document.getElementById('createCustomer').value),
        siteId: Number(document.getElementById('createSite').value),
        title: document.getElementById('createTitle').value,
        description: document.getElementById('createDescription').value,
        priority: document.querySelector('#priorityPicker input:checked').value
      })
    });
    closeCreateModal();
    toast((created ? created.code + ' raised' : 'Work order raised') + ' — we\'re on it');
    if (photo && created) {
      try {
        const sent = await sendAttachment(created.id, photo);
        toast('Photo attached: ' + sent.fileName);
      } catch (err) {
        toast('Work order raised, but photo upload failed: ' + err.message, true);
      }
    }
    loadBoard();
  } catch (err) {
    toast(err.message, true);
  } finally {
    btn.disabled = false;
  }
});

// ---------- detail modal ----------

let technicianCache = null;

async function openDetailModal(id) {
  const backdrop = document.getElementById('detailModalBackdrop');
  const body = document.getElementById('detailModalBody');
  backdrop.classList.remove('hidden');
  body.innerHTML = '<div class="loading"><span class="spinner"></span> Loading job…</div>';

  try {
    const w = await api('/api/work-orders/' + id);
    body.innerHTML = renderDetail(w);
    fillIcons(body);
    renderAttachments(w);
    wireDetailActions(w);
  } catch (err) {
    body.innerHTML = '<div class="loading">' + escapeHtml(err.message) + '</div>';
  }
}

function closeDetailModal() {
  document.getElementById('detailModalBackdrop').classList.add('hidden');
}

// Progress bar across the lifecycle. ON_HOLD sits on the "In progress" step.
function renderStepper(status) {
  if (status === 'CANCELLED') {
    return `<div class="cancel-banner">${icon('x', 14)} This job was cancelled.</div>`;
  }
  const steps = [
    { key: 'NEW', label: 'Raised' },
    { key: 'ASSIGNED', label: 'Assigned' },
    { key: 'IN_PROGRESS', label: status === 'ON_HOLD' ? 'On hold' : 'In progress' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'CLOSED', label: 'Closed' }
  ];
  const current = steps.findIndex(s => s.key === (status === 'ON_HOLD' ? 'IN_PROGRESS' : status));
  return `<div class="stepper">${steps.map((s, i) => `
    <div class="step ${i < current ? 'done' : ''} ${i === current ? 'current' : ''} ${i === current && status === 'ON_HOLD' ? 'hold' : ''}">
      <div class="step-dot">${i < current ? icon('check', 12) : i + 1}</div>
      <div class="step-label">${s.label}</div>
    </div>`).join('<div class="step-line"></div>')}</div>`;
}

function renderDetail(w) {
  const history = (w.history || []).slice().reverse().map(h => `
    <div class="tl-item">
      <div class="tl-dot st-${h.toStatus}"></div>
      <div class="tl-body">
        <div class="tl-title">${h.fromStatus ? STATUS_LABELS[h.fromStatus] + ' → ' : ''}${STATUS_LABELS[h.toStatus]}</div>
        <div class="tl-meta">${escapeHtml(h.changedBy)} · ${formatDateTime(h.changedAt)}</div>
        ${h.note ? `<div class="tl-note">${escapeHtml(h.note)}</div>` : ''}
      </div>
    </div>
  `).join('') || '<div class="muted">No history yet</div>';

  return `
    <div class="detail-head">
      <div>
        <div class="detail-code">${w.code} ${statusPill(w.status)} ${priorityBadge(w.priority)}</div>
        <h3 class="detail-title">${escapeHtml(w.title)}</h3>
      </div>
      <button type="button" class="icon-btn" onclick="closeDetailModal()" aria-label="Close">${icon('x', 18)}</button>
    </div>

    ${renderStepper(w.status)}

    <div class="detail-layout">
      <div class="detail-main">
        <div class="info-grid">
          <div class="info-item"><span class="info-ico">${icon('building')}</span><div><div class="k">Company</div><div class="v">${escapeHtml(w.customerName)}</div></div></div>
          <div class="info-item"><span class="info-ico">${icon('pin')}</span><div><div class="k">Site</div><div class="v">${escapeHtml(w.siteName)}</div></div></div>
          <div class="info-item"><span class="info-ico">${icon('user')}</span><div><div class="k">Technician</div><div class="v">${w.assignedToName ? avatar(w.assignedToName, 'xs') + ' ' + escapeHtml(w.assignedToName) : '<span class="muted">Not assigned yet</span>'}</div></div></div>
          <div class="info-item"><span class="info-ico">${icon('clock')}</span><div><div class="k">Response deadline</div><div class="v">${formatDateTime(w.slaDueAt)} ${slaChip(w)}</div></div></div>
        </div>

        <div class="section">
          <div class="section-title">Description</div>
          <div class="description ${w.description ? '' : 'muted'}">${escapeHtml(w.description || 'No extra details were given.')}</div>
        </div>

        <div id="assignBlock"></div>
        <div id="actionsBlock"></div>
        <div id="attachBlock"></div>
      </div>

      <aside class="detail-side">
        <div class="section-title">Activity</div>
        <div class="timeline">${history}</div>
        <div class="side-foot muted">Raised ${w.createdAt ? timeAgo(w.createdAt) : ''}</div>
      </aside>
    </div>
  `;
}

async function wireDetailActions(w) {
  const isAssignedTechnician = user.role === 'TECHNICIAN' && w.assignedToId && String(w.assignedToId) === String(user.id);
  const isManager = user.role === 'MANAGER';

  // Assign / reassign (dispatcher + manager only, not for finished jobs)
  const assignBlock = document.getElementById('assignBlock');
  if (isDispatchOrManager && !DONE_STATUSES.includes(w.status)) {
    try {
      if (!technicianCache) technicianCache = await api('/api/technicians');
    } catch (err) {
      toast(err.message, true);
      technicianCache = [];
    }
    // Show how busy each technician is, so the dispatcher can pick someone free.
    const activeCount = id => workOrders.filter(o => String(o.assignedToId) === String(id)
      && ['ASSIGNED', 'IN_PROGRESS', 'ON_HOLD'].includes(o.status)).length;

    assignBlock.innerHTML = `
      <div class="section">
        <div class="section-title">${w.assignedToId ? 'Reassign technician' : 'Assign a technician'}</div>
        <div class="tech-list">
          ${technicianCache.map(t => {
            const n = activeCount(t.id);
            const current = String(t.id) === String(w.assignedToId);
            return `
              <button type="button" class="tech-card ${current ? 'current' : ''}" data-tech="${t.id}" ${current ? 'disabled' : ''}>
                ${avatar(t.name, 'md')}
                <span class="tech-text">
                  <span class="tech-name">${escapeHtml(t.name)}</span>
                  <span class="tech-load ${n === 0 ? 'free' : n >= 3 ? 'busy' : ''}">${n === 0 ? 'Free now' : n + ' active job' + (n > 1 ? 's' : '')}</span>
                </span>
                <span class="tech-action">${current ? icon('check', 14) + ' Assigned' : 'Assign'}</span>
              </button>`;
          }).join('') || '<div class="muted">No technicians found.</div>'}
        </div>
      </div>
    `;
    assignBlock.querySelectorAll('[data-tech]').forEach(btn => {
      btn.onclick = async () => {
        btn.classList.add('working');
        try {
          await api('/api/work-orders/' + w.id + '/assign', {
            method: 'POST',
            body: JSON.stringify({ technicianId: Number(btn.dataset.tech) })
          });
          toast(w.code + ' assigned to ' + btn.querySelector('.tech-name').textContent);
          closeDetailModal();
          loadBoard();
        } catch (err) {
          btn.classList.remove('working');
          toast(err.message, true);
        }
      };
    });
  }

  // Status buttons - what shows depends on current status and the caller's role;
  // the server re-checks all of this regardless of what the UI offers.
  const actions = [];
  if (w.status === 'ASSIGNED' && (isAssignedTechnician || isManager)) {
    actions.push({ label: 'Start work', status: 'IN_PROGRESS', style: 'primary' });
  }
  if (w.status === 'IN_PROGRESS' && (isAssignedTechnician || isManager)) {
    actions.push({ label: 'Mark completed', status: 'COMPLETED', style: 'success' });
    actions.push({ label: 'Put on hold', status: 'ON_HOLD', style: '' });
  }
  if (w.status === 'ON_HOLD' && (isAssignedTechnician || isManager)) {
    actions.push({ label: 'Resume work', status: 'IN_PROGRESS', style: 'primary' });
  }
  if (w.status === 'COMPLETED' && isManager) {
    actions.push({ label: 'Approve & close', status: 'CLOSED', style: 'success' });
    actions.push({ label: 'Reopen', status: 'IN_PROGRESS', style: '' });
  }
  if ((w.status === 'NEW' || w.status === 'ASSIGNED') && isDispatchOrManager) {
    actions.push({ label: 'Cancel job', status: 'CANCELLED', style: 'danger' });
  }

  const actionsBlock = document.getElementById('actionsBlock');
  if (actions.length === 0) {
    actionsBlock.innerHTML = `<div class="section"><div class="hint-box">${icon('clock', 14)} ${waitingText(w)}</div></div>`;
    return;
  }
  actionsBlock.innerHTML = `
    <div class="section">
      <div class="section-title">Update this job</div>
      <input id="statusNote" class="note-input" placeholder="Add a note for this update (optional)" maxlength="300">
      <div class="status-row">
        ${actions.map((a, i) => `<button class="btn-status ${a.style}" data-idx="${i}">${a.label}</button>`).join('')}
      </div>
    </div>
  `;
  actions.forEach((a, i) => {
    actionsBlock.querySelector(`[data-idx="${i}"]`).onclick = async (e) => {
      const note = document.getElementById('statusNote').value.trim();
      e.target.disabled = true;
      try {
        await api('/api/work-orders/' + w.id + '/status', {
          method: 'POST',
          body: JSON.stringify({ toStatus: a.status, note: note || a.label })
        });
        toast(w.code + ' → ' + STATUS_LABELS[a.status]);
        closeDetailModal();
        loadBoard();
      } catch (err) {
        e.target.disabled = false;
        toast(err.message, true);
      }
    };
  });
}

// Friendly line for people who have nothing to click right now.
function waitingText(w) {
  switch (w.status) {
    case 'NEW': return user.role === 'CUSTOMER' ? 'Received. A dispatcher will assign a technician soon.' : 'Waiting to be assigned.';
    case 'ASSIGNED': return 'A technician has been assigned and will start soon.';
    case 'IN_PROGRESS': return 'Work is in progress.';
    case 'ON_HOLD': return 'Work is paused for now.';
    case 'COMPLETED': return 'Work is done. Waiting for a manager to approve and close it.';
    case 'CLOSED': return 'This job is closed.';
    case 'CANCELLED': return 'This job was cancelled.';
    default: return 'No actions available for your role right now.';
  }
}

// ---------- photos / videos ----------
// Customers and technicians can send files; dispatchers and managers can see, download and delete them.
// The server enforces the same rule - this only decides which controls to show.

function renderAttachments(w) {
  const block = document.getElementById('attachBlock');
  const canUpload = (user.role === 'CUSTOMER' || user.role === 'TECHNICIAN')
    && w.status !== 'CLOSED' && w.status !== 'CANCELLED';

  if (canUpload) {
    // For the technician on an active job this is the proof of work - required before "Mark completed".
    const isProof = user.role === 'TECHNICIAN' && (w.status === 'IN_PROGRESS' || w.status === 'ON_HOLD');
    block.innerHTML = `
      <div class="section">
        <div class="section-title">${isProof ? 'Proof of work <span class="req">*</span>' : 'Add a photo or video'}</div>
        ${isProof ? `<div class="hint-box warn">${icon('alert', 14)} Upload a photo or video of the finished work before you mark this job completed.</div>` : ''}
        <label class="dropzone compact" id="attachDropzone">
          <input type="file" id="attachFile" accept="image/png,image/jpeg,video/mp4">
          <span class="dz-icon">${icon('upload', 20)}</span>
          <span class="dz-text" id="attachFileName"><b>Click to choose</b> or drag a file here</span>
          <span class="dz-hint">PNG, JPEG or MP4 · up to 10MB · only the dispatcher and manager can see it</span>
        </label>
        <div class="upload-row">
          <button type="button" class="btn-accent" id="attachUploadBtn" disabled>${icon('upload', 14)} Upload</button>
        </div>
      </div>
    `;
    const input = document.getElementById('attachFile');
    const zone = document.getElementById('attachDropzone');
    const btn = document.getElementById('attachUploadBtn');
    const onPick = () => {
      const f = input.files[0];
      document.getElementById('attachFileName').innerHTML = f
        ? `${icon(f.type.startsWith('video') ? 'video' : 'image', 14)} <b>${escapeHtml(f.name)}</b> · ${(f.size / 1024 / 1024).toFixed(2)} MB`
        : '<b>Click to choose</b> or drag a file here';
      btn.disabled = !f;
      zone.classList.toggle('has-file', !!f);
    };
    input.addEventListener('change', onPick);
    ['dragenter', 'dragover'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.add('drag'); }));
    ['dragleave', 'drop'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.remove('drag'); }));
    zone.addEventListener('drop', e => { if (e.dataTransfer.files.length) { input.files = e.dataTransfer.files; onPick(); } });
    btn.onclick = () => uploadAttachment(w, input, onPick);
  } else if (isDispatchOrManager) {
    block.innerHTML = `
      <div class="section">
        <div class="section-title">Photos &amp; videos</div>
        <div id="attachList" class="gallery"><div class="muted">Loading…</div></div>
      </div>
    `;
    loadAttachments(w.id);
  }
}

async function uploadAttachment(w, input, onPick) {
  const file = input.files[0];
  if (!file) return;
  const btn = document.getElementById('attachUploadBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner light"></span> Uploading…';
  try {
    const body = await sendAttachment(w.id, file);
    toast('File sent: ' + body.fileName);
    input.value = '';
    onPick();
  } catch (err) {
    toast(err.message, true);
    btn.disabled = false;
  } finally {
    btn.innerHTML = icon('upload', 14) + ' Upload';
  }
}

async function sendAttachment(workOrderId, file) {
  const form = new FormData();
  form.append('workOrderId', workOrderId);
  form.append('file', file);
  // Not using api() here: the browser must set the multipart Content-Type itself.
  const res = await fetch('/api/attachments', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token },
    body: form
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || ('Upload failed (' + res.status + ')'));
  return body;
}

// Downloads go through our API (it checks the role), so fetch with the token and use a local blob URL.
async function fetchAttachmentBlob(id) {
  const res = await fetch('/api/attachments/' + id + '/download', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || ('Download failed (' + res.status + ')'));
  }
  return URL.createObjectURL(await res.blob());
}

async function loadAttachments(workOrderId) {
  const list = document.getElementById('attachList');
  try {
    const files = await api('/api/attachments?workOrderId=' + workOrderId);
    if (files.length === 0) {
      list.innerHTML = `<div class="empty-gallery">${icon('image', 22)}<span>No photos or videos yet.</span></div>`;
      return;
    }
    list.innerHTML = files.map(f => `
      <div class="media-card">
        <button type="button" class="media-thumb" data-open="${f.id}" data-type="${escapeHtml(f.contentType)}" data-name="${escapeHtml(f.fileName)}">
          <span class="thumb-ph">${icon(f.contentType.startsWith('video') ? 'video' : 'image', 24)}</span>
        </button>
        <div class="media-info">
          <div class="media-name" title="${escapeHtml(f.fileName)}">${escapeHtml(f.fileName)}</div>
          <div class="media-meta">
            <span class="role-chip role-${f.uploadedByRole}">${f.uploadedByRole === 'TECHNICIAN' ? 'Proof' : 'From customer'}</span>
            ${escapeHtml(f.uploadedByName)} · ${timeAgo(f.uploadedAt)}
          </div>
        </div>
        <div class="media-actions">
          <button type="button" class="icon-btn" data-view="${f.id}" title="View">${icon('eye')}</button>
          <button type="button" class="icon-btn danger" data-del="${f.id}" title="Delete">${icon('trash')}</button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('[data-open]').forEach(el => {
      el.onclick = () => openViewer(el.dataset.open, el.dataset.type, el.dataset.name);
      // Load real thumbnails for images in the background.
      if (el.dataset.type.startsWith('image')) {
        fetchAttachmentBlob(el.dataset.open)
          .then(url => { el.innerHTML = `<img src="${url}" alt="">`; })
          .catch(() => {});
      }
    });
    list.querySelectorAll('[data-view]').forEach(b => {
      const t = list.querySelector(`[data-open="${b.dataset.view}"]`);
      b.onclick = () => openViewer(b.dataset.view, t.dataset.type, t.dataset.name);
    });
    list.querySelectorAll('[data-del]').forEach(b => b.onclick = () => deleteAttachment(b.dataset.del, workOrderId));
  } catch (err) {
    list.innerHTML = '<div class="muted">' + escapeHtml(err.message) + '</div>';
  }
}

async function openViewer(id, type, name) {
  const backdrop = document.getElementById('viewerBackdrop');
  const body = document.getElementById('viewerBody');
  backdrop.classList.remove('hidden');
  body.innerHTML = '<div class="loading light"><span class="spinner light"></span> Loading…</div>';
  try {
    const url = await fetchAttachmentBlob(id);
    body.innerHTML = `
      <div class="viewer-bar">
        <span>${escapeHtml(name)}</span>
        <span>
          <a class="btn-ghost small" href="${url}" download="${escapeHtml(name)}">${icon('upload', 14)} Download</a>
          <button type="button" class="icon-btn light" onclick="closeViewer()" aria-label="Close">${icon('x', 18)}</button>
        </span>
      </div>
      ${type.startsWith('video') ? `<video src="${url}" controls autoplay></video>` : `<img src="${url}" alt="">`}
    `;
  } catch (err) {
    closeViewer();
    toast(err.message, true);
  }
}

function closeViewer() {
  document.getElementById('viewerBackdrop').classList.add('hidden');
  document.getElementById('viewerBody').innerHTML = '';
}

async function deleteAttachment(id, workOrderId) {
  if (!confirm('Delete this file? This cannot be undone.')) return;
  try {
    await api('/api/attachments/' + id, { method: 'DELETE' });
    toast('File deleted');
    loadAttachments(workOrderId);
  } catch (err) {
    toast(err.message, true);
  }
}

// ---------- dashboard ----------

async function loadDashboard() {
  try {
    const summary = await api('/api/reports/summary');
    const open = summary.total - (summary.byStatus.CLOSED || 0) - (summary.byStatus.CANCELLED || 0);
    const cards = [
      { label: 'Total work orders', value: summary.total, icon: 'clipboard', tone: 'blue' },
      { label: 'Open / active', value: open, icon: 'wrench', tone: 'violet' },
      { label: 'Overdue (SLA breach)', value: summary.overdue, icon: 'alert', tone: 'red' },
      { label: 'SLA compliance (closed jobs)', value: summary.slaCompliancePct + '%', icon: 'check', tone: 'green' }
    ];
    document.getElementById('statGrid').innerHTML = cards.map(c => `
      <div class="summary-card tone-${c.tone}">
        <div class="summary-ico">${icon(c.icon, 18)}</div>
        <div>
          <div class="summary-value">${c.value}</div>
          <div class="summary-label">${c.label}</div>
        </div>
      </div>
    `).join('');

    const max = Math.max(1, ...Object.values(summary.byStatus));
    document.getElementById('statusBars').innerHTML = Object.entries(summary.byStatus).map(([status, count]) => `
      <div class="bar-row">
        <div class="bar-label">${statusPill(status)}</div>
        <div class="bar-track"><div class="bar-fill st-bg-${status}" style="width:${(count / max) * 100}%"></div></div>
        <div class="bar-count">${count}</div>
      </div>
    `).join('');
  } catch (err) {
    toast(err.message, true);
  }
}

// ---------- init ----------

async function fetchTechniciansIfAllowed() {
  if (isDispatchOrManager) {
    try { technicianCache = await api('/api/technicians'); } catch (e) { /* ignore */ }
  }
}

fillIcons();
fetchTechniciansIfAllowed();
loadBoard();
