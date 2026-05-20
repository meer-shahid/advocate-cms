// ====================================================
// HEARINGS.JS
// ====================================================
//requireAuth();
renderSidebar('hearings.html');

const user = JSON.parse(localStorage.getItem('user') || '{}');
const ta = document.getElementById('topbar-avatar');
if (ta) ta.textContent = (user.name || 'A').charAt(0);

let calendar;

async function loadAll() {
    await Promise.all([loadUpcoming(), loadHearings(), initCalendar()]);
}

async function loadUpcoming() {
    const el = document.getElementById('upcoming-list');
    try {
        const data = await api.get('/hearings/upcoming');
        if (!data.hearings.length) {
            el.innerHTML = '<div class="empty-state" style="padding:20px;font-size:13px;"><div class="empty-icon">📅</div><h3>No upcoming hearings</h3></div>';
            return;
        }
        el.innerHTML = data.hearings.map(h => {
            const days = Math.ceil((new Date(h.hearingDate) - new Date()) / 86400000);
            const color = days <= 3 ? 'var(--accent-red)' : days <= 7 ? 'var(--accent-orange)' : 'var(--gold)';
            const cs = h.caseId || {};
            const cl = cs.clientId || {};
            return `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
        <div style="width:40px;height:40px;border-radius:8px;background:rgba(201,162,39,0.1);border:1px solid rgba(201,162,39,0.3);display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;">
          <div style="font-size:13px;font-weight:800;color:${color};">${new Date(h.hearingDate).getDate()}</div>
          <div style="font-size:9px;color:var(--text-muted);text-transform:uppercase;">${new Date(h.hearingDate).toLocaleString('default', { month: 'short' })}</div>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${cs.title || 'Unknown Case'}</div>
          <div style="font-size:11px;color:var(--text-muted);">${h.courtName || '—'} • ${cl.name || '—'}</div>
        </div>
        <span style="font-size:11px;font-weight:700;color:${color};">${days === 0 ? 'Today' : `${days}d`}</span>
      </div>`;
        }).join('');
    } catch (e) { el.innerHTML = '<div class="empty-state" style="padding:20px;"><p>Error loading hearings</p></div>'; }
}

async function loadHearings() {
    const result = document.getElementById('result-filter')?.value || '';
    const el = document.getElementById('hearings-list');
    try {
        const data = await api.get('/hearings', { result, limit: 20 });
        if (!data.hearings.length) {
            el.innerHTML = '<div class="empty-state" style="padding:20px;font-size:13px;"><h3>No hearings</h3></div>';
            return;
        }
        const icons = { Pending: '⏳', Adjourned: '🔄', Completed: '✅', Dismissed: '❌', Decided: '⚖️' };
        el.innerHTML = data.hearings.map(h => {
            const cs = h.caseId || {};
            return `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
        <div style="flex:1;min-width:0;">
          <div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${cs.title || '—'}</div>
          <div style="font-size:11px;color:var(--text-muted);">${formatDate(h.hearingDate)} ${h.hearingTime ? '• ' + h.hearingTime : ''}</div>
        </div>
        <span style="font-size:14px;" title="${h.result}">${icons[h.result] || '⏳'}</span>
        <button class="btn btn-danger btn-sm btn-icon" onclick="deleteHearing('${h._id}')">🗑️</button>
      </div>`;
        }).join('');
    } catch (e) { /* silent */ }
}

async function initCalendar() {
    const calEl = document.getElementById('calendar');
    if (!calEl || typeof FullCalendar === 'undefined') return;
    try {
        const data = await api.get('/hearings', { limit: 200 });
        const events = data.hearings.map(h => ({
            id: h._id,
            title: (h.caseId?.title || 'Hearing').substring(0, 30),
            date: h.hearingDate,
            backgroundColor: h.result === 'Completed' ? '#10b981' : h.result === 'Adjourned' ? '#f59e0b' : '#1a3a6b',
            borderColor: '#c9a227',
            textColor: '#f1f5f9',
            extendedProps: h
        }));

        if (calendar) calendar.destroy();
        calendar = new FullCalendar.Calendar(calEl, {
            initialView: 'dayGridMonth',
            events,
            headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,dayGridWeek' },
            height: 500,
            eventClick: (info) => {
                const h = info.event.extendedProps;
                editHearing(h);
            },
            dateClick: (info) => {
                openAddHearing(info.dateStr);
            }
        });
        calendar.render();
    } catch (e) { /* silent */ }
}

async function loadCaseOptions(selectedId = '') {
    try {
        const data = await api.get('/cases', { limit: 200 });
        const sel = document.getElementById('h-case');
        sel.innerHTML = '<option value="">-- Select Case --</option>' +
            data.cases.map(c => `<option value="${c._id}" ${c._id === selectedId ? 'selected' : ''}>${c.caseNumber} — ${c.title.substring(0, 40)}</option>`).join('');
    } catch (e) { /* silent */ }
}

function openAddHearing(date = '') {
    document.getElementById('hearing-modal-title').textContent = 'Schedule Hearing';
    document.getElementById('hearing-edit-id').value = '';
    ['h-court', 'h-room', 'h-judge', 'h-purpose', 'h-notes'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('h-time').value = '';
    document.getElementById('h-next').value = '';
    document.getElementById('h-result').value = 'Pending';
    document.getElementById('h-date').value = date;
    loadCaseOptions();
    openModal('hearing-modal');
}

function editHearing(h) {
    document.getElementById('hearing-modal-title').textContent = 'Edit Hearing';
    document.getElementById('hearing-edit-id').value = h._id;
    document.getElementById('h-court').value = h.courtName || '';
    document.getElementById('h-room').value = h.courtRoom || '';
    document.getElementById('h-judge').value = h.judgeName || '';
    document.getElementById('h-purpose').value = h.purpose || '';
    document.getElementById('h-notes').value = h.notes || '';
    document.getElementById('h-time').value = h.hearingTime || '';
    document.getElementById('h-result').value = h.result || 'Pending';
    document.getElementById('h-date').value = h.hearingDate ? new Date(h.hearingDate).toISOString().split('T')[0] : '';
    document.getElementById('h-next').value = h.nextHearingDate ? new Date(h.nextHearingDate).toISOString().split('T')[0] : '';
    loadCaseOptions(h.caseId?._id || h.caseId);
    openModal('hearing-modal');
}

async function saveHearing() {
    const id = document.getElementById('hearing-edit-id').value;
    const payload = {
        caseId: document.getElementById('h-case').value,
        hearingDate: document.getElementById('h-date').value,
        hearingTime: document.getElementById('h-time').value,
        courtName: document.getElementById('h-court').value.trim(),
        courtRoom: document.getElementById('h-room').value.trim(),
        judgeName: document.getElementById('h-judge').value.trim(),
        purpose: document.getElementById('h-purpose').value.trim(),
        notes: document.getElementById('h-notes').value.trim(),
        result: document.getElementById('h-result').value,
        nextHearingDate: document.getElementById('h-next').value || undefined
    };

    if (!payload.hearingDate) { showToast('Hearing date is required.', 'error'); return; }
    if (!id && !payload.caseId) { showToast('Please select a case.', 'error'); return; }

    const btn = document.getElementById('hearing-save-btn');
    btn.disabled = true; btn.textContent = 'Saving...';
    try {
        if (id) await api.put(`/hearings/${id}`, payload);
        else await api.post('/hearings', payload);
        showToast(`Hearing ${id ? 'updated' : 'scheduled'} successfully!`, 'success');
        closeModal('hearing-modal');
        loadAll();
    } catch (e) { showToast(e.message, 'error'); }
    finally { btn.disabled = false; btn.textContent = 'Save Hearing'; }
}

function deleteHearing(id) {
    confirmAction('Delete this hearing?', async () => {
        try { await api.delete(`/hearings/${id}`); showToast('Hearing deleted.', 'success'); loadAll(); }
        catch (e) { showToast(e.message, 'error'); }
    });
}

loadAll();
