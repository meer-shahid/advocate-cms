// ====================================================
// CLIENTS.JS
// ====================================================
//requireAuth();
renderSidebar('clients.html');

const user = JSON.parse(localStorage.getItem('user') || '{}');
const ta = document.getElementById('topbar-avatar');
if (ta) ta.textContent = (user.name || 'A').charAt(0);

let currentPage = 1, totalPages = 1, debounceTimer;

async function loadClients(page = 1) {
  currentPage = page;
  const search = document.getElementById('search-input')?.value || '';
  const caseType = document.getElementById('filter-case-type')?.value || '';
  const status = document.getElementById('filter-status')?.value || '';
  const tbody = document.getElementById('clients-tbody');
  tbody.innerHTML = '<tr><td colspan="8"><div class="loading-overlay"><div class="spinner"></div></div></td></tr>';

  try {
    const data = await api.get('/clients', { search, caseType, status, page, limit: 10 });
    totalPages = data.pages;
    document.getElementById('count-text').textContent = `${data.count} clients found`;

    if (!data.clients.length) {
      tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">👥</div><h3>No clients found</h3><p>Add your first client to get started.</p></div></td></tr>';
      document.getElementById('pagination').innerHTML = '';
      return;
    }

    tbody.innerHTML = data.clients.map((c, i) => `
      <tr>
        <td style="color:var(--text-muted);">${(currentPage - 1) * 10 + i + 1}</td>
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="avatar" style="width:32px;height:32px;font-size:12px;">${c.name.charAt(0)}</div>
            <span style="font-weight:600;">${c.name}</span>
          </div>
        </td>
        <td>${c.phone}</td>
        <td style="color:var(--text-secondary);">${c.email || '—'}</td>
        <td><span class="badge badge-ongoing">${c.caseType}</span></td>
        <td><span class="badge ${getBadgeClass(c.status)}">${c.status}</span></td>
        <td style="color:var(--text-muted);">${formatDate(c.createdAt)}</td>
        <td>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-secondary btn-sm btn-icon" onclick="viewClient('${c._id}')" title="View">👁️</button>
            <button class="btn btn-secondary btn-sm btn-icon" onclick="editClient(${JSON.stringify(c).replace(/"/g, '&quot;')})" title="Edit">✏️</button>
            <button class="btn btn-danger btn-sm btn-icon" onclick="deleteClient('${c._id}','${c.name}')" title="Delete">🗑️</button>
          </div>
        </td>
      </tr>`).join('');

    renderPagination(document.getElementById('pagination'), currentPage, totalPages, loadClients);
  } catch (error) {
    showToast('Failed to load clients: ' + error.message, 'error');
    tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><span>⚠️</span><h3>Error loading clients</h3><p>' + error.message + '</p></div></td></tr>';
  }
}

function filterClients() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => loadClients(1), 400);
}

async function viewClient(id) {
  openModal('client-detail-modal');
  document.getElementById('client-detail-body').innerHTML = '<div class="loading-overlay"><div class="spinner"></div></div>';
  try {
    const { client, cases } = await api.get(`/clients/${id}`);
    document.getElementById('client-detail-body').innerHTML = `
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid var(--border);">
        <div class="avatar lg">${client.name.charAt(0)}</div>
        <div>
          <h2 style="font-size:20px;font-weight:700;">${client.name}</h2>
          <div style="color:var(--text-muted);font-size:13px;margin-top:4px;">${client.email || ''} ${client.phone ? '• ' + client.phone : ''}</div>
          <span class="badge ${getBadgeClass(client.status)}" style="margin-top:6px;">${client.status}</span>
        </div>
      </div>
      <div class="form-grid" style="margin-bottom:24px;">
        <div><div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">CASE TYPE</div><div style="font-size:14px;">${client.caseType}</div></div>
        <div><div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">LOCATION</div><div style="font-size:14px;">${[client.city, client.state].filter(Boolean).join(', ') || '—'}</div></div>
        <div><div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">OCCUPATION</div><div style="font-size:14px;">${client.occupation || '—'}</div></div>
        <div><div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">CLIENT SINCE</div><div style="font-size:14px;">${formatDate(client.createdAt)}</div></div>
      </div>
      ${client.notes ? `<div style="background:var(--bg-input);border-radius:8px;padding:12px;margin-bottom:20px;"><div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">NOTES</div><div style="font-size:13px;">${client.notes}</div></div>` : ''}
      <div><div style="font-size:13px;font-weight:700;margin-bottom:12px;">Case History (${cases.length})</div>
      ${cases.length ? cases.map(c => `
        <div style="padding:10px 14px;background:var(--bg-input);border-radius:8px;display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <div><div style="font-size:13px;font-weight:600;">${c.title}</div><div style="font-size:11px;color:var(--text-muted);">${c.caseNumber} • ${c.courtName || '—'}</div></div>
          <span class="badge ${getBadgeClass(c.status)}">${c.status}</span>
        </div>`).join('') : '<div style="color:var(--text-muted);font-size:13px;">No cases found.</div>'}
      </div>`;
  } catch (e) {
    showToast('Failed to load client: ' + e.message, 'error');
    closeModal('client-detail-modal');
  }
}

function editClient(c) {
  document.getElementById('modal-title').textContent = 'Edit Client';
  document.getElementById('edit-id').value = c._id;
  document.getElementById('c-name').value = c.name;
  document.getElementById('c-phone').value = c.phone;
  document.getElementById('c-email').value = c.email || '';
  document.getElementById('c-case-type').value = c.caseType;
  document.getElementById('c-city').value = c.city || '';
  document.getElementById('c-state').value = c.state || '';
  document.getElementById('c-address').value = c.address || '';
  document.getElementById('c-occupation').value = c.occupation || '';
  document.getElementById('c-notes').value = c.notes || '';
  openModal('client-modal');
}

function resetForm() {
  document.getElementById('modal-title').textContent = 'Add New Client';
  document.getElementById('edit-id').value = '';
  ['c-name', 'c-phone', 'c-email', 'c-city', 'c-state', 'c-address', 'c-occupation', 'c-notes'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('c-case-type').value = 'Civil';
}

async function saveClient() {
  const id = document.getElementById('edit-id').value;
  const payload = {
    name: document.getElementById('c-name').value.trim(),
    phone: document.getElementById('c-phone').value.trim(),
    email: document.getElementById('c-email').value.trim(),
    caseType: document.getElementById('c-case-type').value,
    city: document.getElementById('c-city').value.trim(),
    state: document.getElementById('c-state').value.trim(),
    address: document.getElementById('c-address').value.trim(),
    occupation: document.getElementById('c-occupation').value.trim(),
    notes: document.getElementById('c-notes').value.trim()
  };

  if (!payload.name || !payload.phone) { showToast('Name and phone are required.', 'error'); return; }

  const btn = document.getElementById('save-btn');
  btn.disabled = true; btn.textContent = 'Saving...';

  try {
    if (id) await api.put(`/clients/${id}`, payload);
    else await api.post('/clients', payload);
    showToast(`Client ${id ? 'updated' : 'created'} successfully!`, 'success');
    closeModal('client-modal');
    resetForm();
    loadClients(currentPage);
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Save Client';
  }
}

function deleteClient(id, name) {
  confirmAction(`Delete client "<strong>${name}</strong>"?`, async () => {
    try {
      await api.delete(`/clients/${id}`);
      showToast('Client deleted.', 'success');
      loadClients(currentPage);
    } catch (e) { showToast(e.message, 'error'); }
  });
}

// Open add modal fresh
document.querySelector('[onclick*="client-modal"]')?.addEventListener('click', resetForm);

loadClients();
