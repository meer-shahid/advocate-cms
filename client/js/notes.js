// ====================================================
// NOTES.JS
// ====================================================
//requireAuth();
renderSidebar('notes.html');

const user = JSON.parse(localStorage.getItem('user') || '{}');
const ta = document.getElementById('topbar-avatar');
if (ta) ta.textContent = (user.name || 'A').charAt(0);

let allCases = [], selectedCaseId = null;

async function loadCases() {
    try {
        const data = await api.get('/cases', { limit: 200 });
        allCases = data.cases;
        renderCaseList(allCases);
    } catch (e) { showToast('Error loading cases', 'error'); }
}

function renderCaseList(cases) {
    const el = document.getElementById('case-list');
    if (!cases.length) {
        el.innerHTML = '<div class="empty-state" style="padding:20px;"><h3>No cases</h3></div>';
        return;
    }
    el.innerHTML = cases.map(c => `
    <div onclick="selectCase('${c._id}', '${c.title.replace(/'/g, "\\'")}', '${c.caseNumber}')"
      style="padding:10px 12px;border-radius:8px;cursor:pointer;transition:var(--transition);margin-bottom:4px;border:1px solid ${selectedCaseId === c._id ? 'var(--border-gold)' : 'transparent'};background:${selectedCaseId === c._id ? 'rgba(201,162,39,0.08)' : 'transparent'};"
      onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='${selectedCaseId === c._id ? 'rgba(201,162,39,0.08)' : 'transparent'}'">
      <div style="font-size:13px;font-weight:600;color:var(--text-primary);">${c.title.substring(0, 35)}</div>
      <div style="font-size:11px;color:var(--text-muted);">${c.caseNumber} • <span class="badge ${getBadgeClass(c.status)}" style="font-size:9px;">${c.status}</span></div>
    </div>`).join('');
}

function filterCaseList() {
    const q = document.getElementById('case-search').value.toLowerCase();
    renderCaseList(allCases.filter(c => c.title.toLowerCase().includes(q) || c.caseNumber.toLowerCase().includes(q)));
}

function selectCase(id, title, number) {
    selectedCaseId = id;
    document.getElementById('notes-placeholder').classList.add('hidden');
    document.getElementById('notes-panel').classList.remove('hidden');
    document.getElementById('selected-case-title').textContent = `📝 ${title.substring(0, 40)}`;
    renderCaseList(allCases);
    loadNotes();
}

async function loadNotes() {
    if (!selectedCaseId) return;
    const el = document.getElementById('notes-timeline');
    el.innerHTML = '<div class="loading-overlay" style="padding:32px;"><div class="spinner"></div></div>';

    try {
        const data = await api.get(`/notes/${selectedCaseId}`);
        document.getElementById('note-count').textContent = `${data.notes.length} notes`;

        if (!data.notes.length) {
            el.innerHTML = '<div class="empty-state"><div class="empty-icon">📝</div><h3>No notes yet</h3><p>Add the first note for this case.</p></div>';
            return;
        }

        const typeColors = { 'Hearing Update': 'var(--accent-blue)', 'Client Meeting': 'var(--gold)', 'Internal Remark': 'var(--accent-purple)', 'Research Note': 'var(--accent-green)', 'Action Item': 'var(--accent-red)', 'General': 'var(--text-muted)' };
        const impColors = { Normal: 'var(--text-muted)', Important: 'var(--accent-orange)', Critical: 'var(--accent-red)' };

        el.innerHTML = data.notes.map(n => `
      <div class="timeline-item">
        <div class="timeline-dot" style="background:${typeColors[n.type] || 'var(--gold)'};"></div>
        <div class="timeline-content">
          <div class="timeline-time">${timeAgo(n.createdAt)} • ${n.type} ${n.importance !== 'Normal' ? `• <span style="color:${impColors[n.importance]};font-weight:600;">⚠ ${n.importance}</span>` : ''}</div>
          <div class="timeline-desc">${n.content}</div>
          <div style="display:flex;justify-content:flex-end;margin-top:8px;">
            <button class="btn btn-danger btn-sm btn-icon" onclick="deleteNote('${n._id}')" title="Delete">🗑️</button>
          </div>
        </div>
      </div>`).join('');
    } catch (e) { showToast('Error loading notes: ' + e.message, 'error'); }
}

async function addNote() {
    if (!selectedCaseId) { showToast('Select a case first.', 'warning'); return; }
    const content = document.getElementById('note-content').value.trim();
    if (!content) { showToast('Note content cannot be empty.', 'error'); return; }

    const btn = document.getElementById('add-note-btn');
    btn.disabled = true; btn.textContent = 'Adding...';
    try {
        await api.post('/notes', {
            caseId: selectedCaseId,
            content,
            type: document.getElementById('note-type').value,
            importance: document.getElementById('note-importance').value
        });
        document.getElementById('note-content').value = '';
        showToast('Note added successfully!', 'success');
        loadNotes();
    } catch (e) { showToast(e.message, 'error'); }
    finally { btn.disabled = false; btn.textContent = '➕ Add Note'; }
}

function deleteNote(id) {
    confirmAction('Delete this note?', async () => {
        try { await api.delete(`/notes/${id}`); showToast('Note deleted.', 'success'); loadNotes(); }
        catch (e) { showToast(e.message, 'error'); }
    });
}

loadCases();
