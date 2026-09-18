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

function toast(message, isError) {
  const el = document.createElement('div');
  el.className = 'toast' + (isError ? ' error' : '');
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// ---------- shell ----------

document.getElementById('roleTag').textContent = user.role;
document.getElementById('whoTag').textContent = user.name;

// Only dispatchers/managers get the dashboard + "new work order" in the sidebar nav sense of scope,
// but everyone can still raise a request (customers raise their own).
if (user.role !== 'DISPATCHER' && user.role !== 'MANAGER') {
  document.getElementById('navDashboard').classList.add('hidden');
}
if (user.role === 'TECHNICIAN') {
  document.getElementById('newWorkOrderBtn').classList.add('hidden');
}

function showView(view) {
  document.getElementById('viewBoard').classList.toggle('hidden', view !== 'board');
  document.getElementById('viewDashboard').classList.toggle('hidden', view !== 'dashboard');
  document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.view === view));
  if (view === 'dashboard') loadDashboard();
}

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

async function loadBoard() {
  try {
    workOrders = await api('/api/work-orders');
    renderBoard();
  } catch (err) {
    toast(err.message, true);
  }
}

function renderBoard() {
  const board = document.getElementById('board');
  board.innerHTML = '';

  COLUMNS.forEach(col => {
    const items = workOrders.filter(w => w.status === col.key);
    const colEl = document.createElement('div');
    colEl.className = 'board-col';
    colEl.innerHTML = `
      <div class="board-col-header">
        <span>${col.label}</span>
        <span class="count-badge">${items.length}</span>
      </div>
      <div class="col-body"></div>
    `;
    const body = colEl.querySelector('.col-body');
    if (items.length === 0) {
      body.innerHTML = '<div class="empty-col">No jobs</div>';
    } else {
      items.forEach(w => body.appendChild(renderCard(w)));
    }
    board.appendChild(colEl);
  });
}

function renderCard(w) {
  const card = document.createElement('div');
  card.className = 'wo-card' + (w.overdue ? ' overdue' : '');
  card.onclick = () => openDetailModal(w.id);
  card.innerHTML = `
    <div class="wo-code">${w.code}</div>
    <div class="wo-title">${escapeHtml(w.title)}</div>
    <span class="badge badge-${w.priority}">${w.priority}</span>
    <div class="wo-meta">
      ${escapeHtml(w.siteName)} · ${escapeHtml(w.customerName)}<br>
      ${w.assignedToName ? 'Tech: ' + escapeHtml(w.assignedToName) : 'Unassigned'}
      ${w.overdue ? '<br><span style="color:var(--red)">SLA overdue</span>' : ''}
    </div>
  `;
  return card;
}

function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ---------- create work order ----------

async function openCreateModal() {
  document.getElementById('createModalBackdrop').classList.remove('hidden');
  const customerSelect = document.getElementById('createCustomer');
  const siteSelect = document.getElementById('createSite');
  customerSelect.innerHTML = '';
  siteSelect.innerHTML = '';

  try {
    const customers = await api('/api/customers');
    customers.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      customerSelect.appendChild(opt);
    });
    await loadSitesFor(customerSelect.value);
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
}

document.getElementById('createForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/api/work-orders', {
      method: 'POST',
      body: JSON.stringify({
        customerId: Number(document.getElementById('createCustomer').value),
        siteId: Number(document.getElementById('createSite').value),
        title: document.getElementById('createTitle').value,
        description: document.getElementById('createDescription').value,
        priority: document.getElementById('createPriority').value
      })
    });
    closeCreateModal();
    toast('Work order raised');
    loadBoard();
  } catch (err) {
    toast(err.message, true);
  }
});

// ---------- detail modal ----------

let technicianCache = null;

async function openDetailModal(id) {
  const backdrop = document.getElementById('detailModalBackdrop');
  const body = document.getElementById('detailModalBody');
  backdrop.classList.remove('hidden');
  body.innerHTML = '<p>Loading…</p>';

  try {
    const w = await api('/api/work-orders/' + id);
    body.innerHTML = renderDetail(w);
    wireDetailActions(w);
  } catch (err) {
    body.innerHTML = '<p>' + escapeHtml(err.message) + '</p>';
  }
}

function closeDetailModal() {
  document.getElementById('detailModalBackdrop').classList.add('hidden');
}

function renderDetail(w) {
  const history = (w.history || []).slice().reverse().map(h => `
    <div class="history-item">
      <strong>${h.fromStatus || 'RAISED'} → ${h.toStatus}</strong> by ${escapeHtml(h.changedBy)}
      <div>${new Date(h.changedAt).toLocaleString()}${h.note ? ' · ' + escapeHtml(h.note) : ''}</div>
    </div>
  `).join('') || '<div class="history-item">No history yet</div>';

  return `
    <h3>${escapeHtml(w.title)}</h3>
    <div class="modal-sub">${w.code} · <span class="badge badge-${w.priority}">${w.priority}</span> ${w.status}${w.overdue ? ' · <span style="color:var(--red)">SLA overdue</span>' : ''}</div>

    <div class="detail-grid">
      <div class="detail-field"><div class="k">Customer</div><div class="v">${escapeHtml(w.customerName)}</div></div>
      <div class="detail-field"><div class="k">Site</div><div class="v">${escapeHtml(w.siteName)}</div></div>
      <div class="detail-field"><div class="k">Technician</div><div class="v">${escapeHtml(w.assignedToName || 'Unassigned')}</div></div>
      <div class="detail-field"><div class="k">SLA due</div><div class="v">${w.slaDueAt ? new Date(w.slaDueAt).toLocaleString() : '—'}</div></div>
    </div>

    <div class="detail-field" style="margin-bottom:14px;">
      <div class="k">Description</div>
      <div class="v" style="font-weight:400;">${escapeHtml(w.description || '—')}</div>
    </div>

    <div id="assignBlock"></div>
    <div class="status-row" id="statusActions"></div>

    <div class="history-list">
      <div class="k" style="margin-bottom:6px;">Status history</div>
      ${history}
    </div>

    <div class="modal-actions">
      <button type="button" class="btn-ghost" onclick="closeDetailModal()">Close</button>
    </div>
  `;
}

async function wireDetailActions(w) {
  const isAssignedTechnician = user.role === 'TECHNICIAN' && w.assignedToId && String(w.assignedToId) === String(user.id);
  const isDispatchOrManager = user.role === 'DISPATCHER' || user.role === 'MANAGER';
  const isManager = user.role === 'MANAGER';

  // Assign / reassign block (dispatcher + manager only, not for terminal states)
  const assignBlock = document.getElementById('assignBlock');
  if (isDispatchOrManager && w.status !== 'CLOSED' && w.status !== 'CANCELLED') {
    if (!technicianCache) {
      technicianCache = await api('/api/technicians');
    }
    const placeholder = `<option value="" disabled ${w.assignedToId ? '' : 'selected'}>-- Select technician --</option>`;
    const options = technicianCache.map(t => `<option value="${t.id}" ${String(t.id) === String(w.assignedToId) ? 'selected' : ''}>${escapeHtml(t.name)}</option>`).join('');
    assignBlock.innerHTML = `
      <label>Assign technician</label>
      <div style="display:flex; gap:8px; align-items:center;">
        <select id="assignSelect" style="flex:1;">${placeholder}${options}</select>
        <span id="assignStatus" style="font-size:12px; color:var(--text-dim);">${w.assignedToName ? 'Assigned to ' + escapeHtml(w.assignedToName) : 'Unassigned'}</span>
      </div>
      <div class="modal-sub" style="margin-top:6px;">Picking a name here assigns them right away - no extra button to click.</div>
    `;
    // Assigning happens the moment you pick someone - there's no separate "Assign" button to
    // forget to click, which is what was causing work orders to look assigned but never actually
    // get saved to the assignee.
    document.getElementById('assignSelect').onchange = async (e) => {
      try {
        await api('/api/work-orders/' + w.id + '/assign', {
          method: 'POST',
          body: JSON.stringify({ technicianId: Number(e.target.value) })
        });
        toast('Technician assigned');
        closeDetailModal();
        loadBoard();
      } catch (err) {
        toast(err.message, true);
      }
    };
  }

  // Status transition buttons - what shows depends on current status and the caller's role;
  // the server re-checks all of this regardless of what the UI offers.
  const actions = [];
  if (w.status === 'IN_PROGRESS' && (isAssignedTechnician || isManager)) {
    actions.push({ label: 'Hold', status: 'ON_HOLD', style: '' });
    actions.push({ label: 'Mark Completed', status: 'COMPLETED', style: 'primary' });
  }
  if (w.status === 'ASSIGNED' && (isAssignedTechnician || isManager)) {
    actions.push({ label: 'Start work', status: 'IN_PROGRESS', style: 'primary' });
  }
  if (w.status === 'ON_HOLD' && (isAssignedTechnician || isManager)) {
    actions.push({ label: 'Resume', status: 'IN_PROGRESS', style: 'primary' });
  }
  if (w.status === 'COMPLETED' && isManager) {
    actions.push({ label: 'Close', status: 'CLOSED', style: 'primary' });
    actions.push({ label: 'Reopen', status: 'IN_PROGRESS', style: '' });
  }
  if ((w.status === 'NEW' || w.status === 'ASSIGNED') && isDispatchOrManager) {
    actions.push({ label: 'Cancel', status: 'CANCELLED', style: 'danger' });
  }

  const statusActions = document.getElementById('statusActions');
  statusActions.innerHTML = actions.map((a, i) =>
    `<button class="btn-status ${a.style}" data-idx="${i}">${a.label}</button>`
  ).join('') || '<div class="modal-sub">No actions available for your role at this status.</div>';

  actions.forEach((a, i) => {
    statusActions.querySelector(`[data-idx="${i}"]`).onclick = async () => {
      try {
        await api('/api/work-orders/' + w.id + '/status', {
          method: 'POST',
          body: JSON.stringify({ toStatus: a.status, note: a.label })
        });
        toast('Work order updated');
        closeDetailModal();
        loadBoard();
      } catch (err) {
        toast(err.message, true);
      }
    };
  });
}

// ---------- dashboard ----------

async function loadDashboard() {
  try {
    const summary = await api('/api/reports/summary');
    const grid = document.getElementById('statGrid');
    grid.innerHTML = `
      <div class="stat-card"><div class="stat-label">Total work orders</div><div class="stat-value">${summary.total}</div></div>
      <div class="stat-card"><div class="stat-label">Open / active</div><div class="stat-value">${summary.total - (summary.byStatus.CLOSED || 0) - (summary.byStatus.CANCELLED || 0)}</div></div>
      <div class="stat-card"><div class="stat-label">Overdue (SLA breach)</div><div class="stat-value warn">${summary.overdue}</div></div>
      <div class="stat-card"><div class="stat-label">SLA compliance (closed jobs)</div><div class="stat-value good">${summary.slaCompliancePct}%</div></div>
    `;

    const bars = document.getElementById('statusBars');
    const max = Math.max(1, ...Object.values(summary.byStatus));
    bars.innerHTML = Object.entries(summary.byStatus).map(([status, count]) => `
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
        <div style="width:110px; font-size:12px; color:var(--text-dim);">${status}</div>
        <div style="flex:1; background:var(--bg-card); border-radius:6px; overflow:hidden; height:14px;">
          <div style="height:100%; width:${(count / max) * 100}%; background:var(--accent);"></div>
        </div>
        <div style="width:30px; text-align:right; font-size:12px;">${count}</div>
      </div>
    `).join('');
  } catch (err) {
    toast(err.message, true);
  }
}

// ---------- init ----------

async function fetchTechniciansIfAllowed() {
  if (user.role === 'DISPATCHER' || user.role === 'MANAGER') {
    try { technicianCache = await api('/api/technicians'); } catch (e) { /* ignore */ }
  }
}

fetchTechniciansIfAllowed();
loadBoard();
