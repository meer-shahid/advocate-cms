// ====================================================
// PAYMENTS.JS
// ====================================================
//requireAuth();
renderSidebar('payments.html');

const user = JSON.parse(localStorage.getItem('user') || '{}');
const ta = document.getElementById('topbar-avatar');
if (ta) ta.textContent = (user.name || 'A').charAt(0);

let currentPage = 1;

async function loadStats() {
    try {
        const data = await api.get('/payments/stats');
        const map = {};
        data.stats.forEach(s => { map[s._id] = s; });
        document.getElementById('s-paid').textContent = formatCurrency(map['Paid']?.total || 0);
        document.getElementById('s-pending').textContent = formatCurrency(map['Pending']?.total || 0);
        document.getElementById('s-overdue').textContent = formatCurrency(map['Overdue']?.total || 0);
        const total = data.stats.reduce((a, s) => a + s.count, 0);
        document.getElementById('s-count').textContent = total;
    } catch (e) { /* silent */ }
}

async function loadPayments(page = 1) {
    currentPage = page;
    const status = document.getElementById('filter-status')?.value || '';
    const tbody = document.getElementById('payments-tbody');
    tbody.innerHTML = '<tr><td colspan="9"><div class="loading-overlay"><div class="spinner"></div></div></td></tr>';

    try {
        const data = await api.get('/payments', { status, page, limit: 10 });
        document.getElementById('count-text').textContent = `${data.count} invoices`;

        if (!data.payments.length) {
            tbody.innerHTML = '<tr><td colspan="9"><div class="empty-state"><div class="empty-icon">💰</div><h3>No payments found</h3><p>Create your first invoice.</p></div></td></tr>';
            document.getElementById('pagination').innerHTML = '';
            return;
        }

        tbody.innerHTML = data.payments.map(p => `
      <tr>
        <td><span style="font-family:monospace;font-size:12px;color:var(--gold);">${p.invoiceNumber}</span></td>
        <td style="font-weight:600;">${p.clientId?.name || '—'}</td>
        <td style="font-size:12px;color:var(--text-muted);">${p.caseId?.title?.substring(0, 25) || '—'}</td>
        <td><span class="badge badge-ongoing">${p.paymentType}</span></td>
        <td style="font-weight:700;color:${p.status === 'Paid' ? 'var(--accent-green)' : p.status === 'Overdue' ? 'var(--accent-red)' : 'var(--gold)'};">${formatCurrency(p.amount)}</td>
        <td><span class="badge ${getBadgeClass(p.status)}">${p.status}</span></td>
        <td style="color:var(--text-muted);font-size:13px;">${formatDate(p.dueDate)}</td>
        <td style="color:var(--accent-green);font-size:13px;">${formatDate(p.paidDate)}</td>
        <td>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-secondary btn-sm btn-icon" onclick="editPayment(${JSON.stringify(p).replace(/"/g, '&quot;')})" title="Edit">✏️</button>
            ${p.status !== 'Paid' ? `<button class="btn btn-success btn-sm btn-icon" onclick="markPaid('${p._id}')" title="Mark Paid">✅</button>` : ''}
            <button class="btn btn-danger btn-sm btn-icon" onclick="deletePayment('${p._id}')" title="Delete">🗑️</button>
          </div>
        </td>
      </tr>`).join('');

        renderPagination(document.getElementById('pagination'), currentPage, data.pages, loadPayments);
    } catch (e) {
        showToast('Failed to load payments: ' + e.message, 'error');
    }
}

async function loadDropdowns(selectedClientId = '', selectedCaseId = '') {
    try {
        const [clientData, caseData] = await Promise.all([api.get('/clients', { limit: 200 }), api.get('/cases', { limit: 200 })]);
        document.getElementById('pay-client').innerHTML = '<option value="">-- Select Client --</option>' +
            clientData.clients.map(c => `<option value="${c._id}" ${c._id === selectedClientId ? 'selected' : ''}>${c.name}</option>`).join('');
        document.getElementById('pay-case').innerHTML = '<option value="">-- No Case --</option>' +
            caseData.cases.map(c => `<option value="${c._id}" ${c._id === selectedCaseId ? 'selected' : ''}>${c.caseNumber} — ${c.title.substring(0, 30)}</option>`).join('');
    } catch (e) { /* silent */ }
}

function openAddPayment() {
    document.getElementById('pay-modal-title').textContent = 'New Invoice';
    document.getElementById('pay-edit-id').value = '';
    document.getElementById('pay-amount').value = '';
    document.getElementById('pay-desc').value = '';
    document.getElementById('pay-txn').value = '';
    document.getElementById('pay-due').value = '';
    document.getElementById('pay-paid').value = '';
    document.getElementById('pay-status').value = 'Pending';
    document.getElementById('pay-type').value = 'Consultation Fee';
    document.getElementById('pay-method').value = 'Cash';
    loadDropdowns();
    openModal('payment-modal');
}

function editPayment(p) {
    document.getElementById('pay-modal-title').textContent = 'Edit Payment';
    document.getElementById('pay-edit-id').value = p._id;
    document.getElementById('pay-amount').value = p.amount;
    document.getElementById('pay-desc').value = p.description || '';
    document.getElementById('pay-txn').value = p.transactionId || '';
    document.getElementById('pay-status').value = p.status;
    document.getElementById('pay-type').value = p.paymentType;
    document.getElementById('pay-method').value = p.paymentMethod;
    document.getElementById('pay-due').value = p.dueDate ? new Date(p.dueDate).toISOString().split('T')[0] : '';
    document.getElementById('pay-paid').value = p.paidDate ? new Date(p.paidDate).toISOString().split('T')[0] : '';
    loadDropdowns(p.clientId?._id || p.clientId, p.caseId?._id || p.caseId);
    openModal('payment-modal');
}

async function savePayment() {
    const id = document.getElementById('pay-edit-id').value;
    const clientId = document.getElementById('pay-client').value;
    const payload = {
        clientId: clientId || undefined,
        caseId: document.getElementById('pay-case').value || undefined,
        amount: parseFloat(document.getElementById('pay-amount').value) || 0,
        paymentType: document.getElementById('pay-type').value,
        status: document.getElementById('pay-status').value,
        paymentMethod: document.getElementById('pay-method').value,
        description: document.getElementById('pay-desc').value.trim(),
        transactionId: document.getElementById('pay-txn').value.trim(),
        dueDate: document.getElementById('pay-due').value || undefined,
        paidDate: document.getElementById('pay-paid').value || undefined
    };

    if (!payload.amount) { showToast('Amount is required.', 'error'); return; }
    if (!id && !clientId) { showToast('Please select a client.', 'error'); return; }

    const btn = document.getElementById('pay-save-btn');
    btn.disabled = true; btn.textContent = 'Saving...';
    try {
        if (id) await api.put(`/payments/${id}`, payload);
        else await api.post('/payments', payload);
        showToast(`Payment ${id ? 'updated' : 'created'} successfully!`, 'success');
        closeModal('payment-modal');
        loadPayments(currentPage);
        loadStats();
    } catch (e) { showToast(e.message, 'error'); }
    finally { btn.disabled = false; btn.textContent = 'Save Invoice'; }
}

async function markPaid(id) {
    try {
        await api.put(`/payments/${id}`, { status: 'Paid', paidDate: new Date().toISOString().split('T')[0] });
        showToast('Payment marked as paid!', 'success');
        loadPayments(currentPage); loadStats();
    } catch (e) { showToast(e.message, 'error'); }
}

function deletePayment(id) {
    confirmAction('Delete this payment record?', async () => {
        try { await api.delete(`/payments/${id}`); showToast('Payment deleted.', 'success'); loadPayments(currentPage); loadStats(); }
        catch (e) { showToast(e.message, 'error'); }
    });
}

loadStats();
loadPayments();
