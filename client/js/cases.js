// ====================================================
// CASES.JS
// ====================================================
//requireAuth();
renderSidebar('cases.html');

const user = JSON.parse(localStorage.getItem('user') || '{}');
const ta = document.getElementById('topbar-avatar');
if (ta) ta.textContent = (user.name || 'A').charAt(0);

let currentPage = 1, totalPages = 1, statusFilter = '', debounceTimer;

function setStatusFilter(status) {
    statusFilter = status;
    document.querySelectorAll('#status-filters .btn').forEach(b => b.className = 'btn btn-secondary btn-sm');
    const activeBtn = document.getElementById(status ? `filter-${status}` : 'filter-all');
    if (activeBtn) activeBtn.className = 'btn btn-primary btn-sm';
    loadCases(1);
}

async function loadCases(page = 1) {
    currentPage = page;
    const search = document.getElementById('search-input')?.value || '';
    const priority = document.getElementById('filter-priority')?.value || '';
    const caseType = document.getElementById('filter-type')?.value || '';
    const tbody = document.getElementById('cases-tbody');
    tbody.innerHTML = '<tr><td colspan="9"><div class="loading-overlay"><div class="spinner"></div></div></td></tr>';

    try {
        const data = await api.get('/cases', { search, status: statusFilter, priority, caseType, page, limit: 10 });
        totalPages = data.pages;
        document.getElementById('count-text').textContent = `${data.count} cases found`;

        if (!data.cases.length) {
            tbody.innerHTML = '<tr><td colspan="9"><div class="empty-state"><div class="empty-icon">📁</div><h3>No cases found</h3><p>Create your first case to get started.</p></div></td></tr>';
            document.getElementById('pagination').innerHTML = '';
            return;
        }

        tbody.innerHTML = data.cases.map(c => `
      <tr>
        <td><span style="font-family:monospace;font-size:12px;color:var(--gold);">${c.caseNumber}</span></td>
        <td>
          <div style="font-weight:600;font-size:13px;">${c.title}</div>
          <div style="font-size:11px;color:var(--text-muted);">${c.caseType}</div>
        </td>
        <td>
          ${c.clientId ? `<div style="font-size:13px;">${c.clientId.name}</div><div style="font-size:11px;color:var(--text-muted);">${c.clientId.phone}</div>` : '<span style="color:var(--text-muted);">—</span>'}
        </td>
        <td><span class="badge badge-ongoing">${c.caseType}</span></td>
        <td><span class="badge ${getBadgeClass(c.status)}">${c.status}</span></td>
        <td><span class="badge ${getBadgeClass(c.priority)}">${c.priority}</span></td>
        <td style="color:${c.nextHearingDate && new Date(c.nextHearingDate) < new Date(Date.now() + 7 * 86400000) ? 'var(--accent-orange)' : 'var(--text-secondary)'};">${formatDate(c.nextHearingDate)}</td>
        <td style="color:var(--text-secondary);font-size:13px;">${c.courtName || '—'}</td>
        <td>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-secondary btn-sm btn-icon" onclick="editCase(${JSON.stringify(c).replace(/"/g, '&quot;')})" title="Edit">✏️</button>
            <button class="btn btn-danger btn-sm btn-icon" onclick="deleteCase('${c._id}','${c.title}')" title="Delete">🗑️</button>
          </div>
        </td>
      </tr>`).join('');

        renderPagination(document.getElementById('pagination'), currentPage, totalPages, loadCases);
    } catch (error) {
        showToast('Failed to load cases: ' + error.message, 'error');
        tbody.innerHTML = '<tr><td colspan="9"><div class="empty-state"><span>⚠️</span><h3>Error</h3></div></td></tr>';
    }
}

function filterCases() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => loadCases(1), 400);
}

async function loadClientOptions(selectedId = '') {
    try {
        const data = await api.get('/clients', { limit: 200 });
        const sel = document.getElementById('cs-client');
        sel.innerHTML = '<option value="">-- Select Client --</option>' +
            data.clients.map(c => `<option value="${c._id}" ${c._id === selectedId ? 'selected' : ''}>${c.name}</option>`).join('');
    } catch (e) { /* silent */ }
}

function openAddCase() {
    document.getElementById('case-modal-title').textContent = 'Add New Case';
    document.getElementById('case-edit-id').value = '';
    ['cs-title', 'cs-court', 'cs-court-num', 'cs-judge', 'cs-opponent', 'cs-opp-lawyer', 'cs-desc', 'cs-relief'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('cs-type').value = 'Civil';
    document.getElementById('cs-status').value = 'Pending';
    document.getElementById('cs-priority').value = 'Medium';
    document.getElementById('cs-fee').value = '';
    document.getElementById('cs-filing-date').value = '';
    document.getElementById('cs-hearing-date').value = '';
    loadClientOptions();
    openModal('case-modal');
}

function editCase(c) {
    document.getElementById('case-modal-title').textContent = 'Edit Case';
    document.getElementById('case-edit-id').value = c._id;
    document.getElementById('cs-title').value = c.title;
    document.getElementById('cs-type').value = c.caseType;
    document.getElementById('cs-status').value = c.status;
    document.getElementById('cs-priority').value = c.priority;
    document.getElementById('cs-court').value = c.courtName || '';
    document.getElementById('cs-court-num').value = c.courtCaseNumber || '';
    document.getElementById('cs-judge').value = c.judgeName || '';
    document.getElementById('cs-opponent').value = c.opponentName || '';
    document.getElementById('cs-opp-lawyer').value = c.opponentLawyer || '';
    document.getElementById('cs-fee').value = c.estimatedFee || '';
    document.getElementById('cs-desc').value = c.description || '';
    document.getElementById('cs-relief').value = c.reliefSought || '';
    document.getElementById('cs-filing-date').value = c.filingDate ? c.filingDate.split('T')[0] : '';
    document.getElementById('cs-hearing-date').value = c.nextHearingDate ? c.nextHearingDate.split('T')[0] : '';
    loadClientOptions(c.clientId?._id || c.clientId);
    openModal('case-modal');
}

async function saveCase() {
    const id = document.getElementById('case-edit-id').value;
    const clientId = document.getElementById('cs-client').value;
    const payload = {
        title: document.getElementById('cs-title').value.trim(),
        caseType: document.getElementById('cs-type').value,
        status: document.getElementById('cs-status').value,
        priority: document.getElementById('cs-priority').value,
        courtName: document.getElementById('cs-court').value.trim(),
        courtCaseNumber: document.getElementById('cs-court-num').value.trim(),
        judgeName: document.getElementById('cs-judge').value.trim(),
        opponentName: document.getElementById('cs-opponent').value.trim(),
        opponentLawyer: document.getElementById('cs-opp-lawyer').value.trim(),
        estimatedFee: parseFloat(document.getElementById('cs-fee').value) || 0,
        description: document.getElementById('cs-desc').value.trim(),
        reliefSought: document.getElementById('cs-relief').value.trim(),
        filingDate: document.getElementById('cs-filing-date').value || undefined,
        nextHearingDate: document.getElementById('cs-hearing-date').value || undefined,
        clientId: clientId || undefined
    };

    if (!payload.title) { showToast('Case title is required.', 'error'); return; }
    if (!id && !clientId) { showToast('Please select a client.', 'error'); return; }

    const btn = document.getElementById('case-save-btn');
    btn.disabled = true; btn.textContent = 'Saving...';
    try {
        if (id) await api.put(`/cases/${id}`, payload);
        else await api.post('/cases', payload);
        showToast(`Case ${id ? 'updated' : 'created'} successfully!`, 'success');
        closeModal('case-modal');
        loadCases(currentPage);
    } catch (e) { showToast(e.message, 'error'); }
    finally { btn.disabled = false; btn.textContent = 'Save Case'; }
}

function deleteCase(id, title) {
    confirmAction(`Delete case "<strong>${title}</strong>"?`, async () => {
        try { await api.delete(`/cases/${id}`); showToast('Case deleted.', 'success'); loadCases(currentPage); }
        catch (e) { showToast(e.message, 'error'); }
    });
}

loadCases();
