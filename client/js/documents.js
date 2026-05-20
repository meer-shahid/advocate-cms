// ====================================================
// DOCUMENTS.JS
// ====================================================
//requireAuth();
renderSidebar('documents.html');

const user = JSON.parse(localStorage.getItem('user') || '{}');
const ta = document.getElementById('topbar-avatar');
if (ta) ta.textContent = (user.name || 'A').charAt(0);

let selectedFile = null;

// Drag & Drop
const zone = document.getElementById('upload-zone');
if (zone) {
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', (e) => {
        e.preventDefault(); zone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) { selectedFile = file; document.getElementById('selected-file').textContent = `✓ ${file.name} (${formatFileSize(file.size)})`; }
    });
}

function selectFile(input) {
    if (input.files[0]) {
        selectedFile = input.files[0];
        document.getElementById('selected-file').textContent = `✓ ${selectedFile.name} (${formatFileSize(selectedFile.size)})`;
    }
}

async function loadCaseOptions() {
    try {
        const data = await api.get('/cases', { limit: 200 });
        const sel = document.getElementById('upload-case');
        const filterSel = document.getElementById('filter-case');
        const opts = '<option value="">-- No Case --</option>' + data.cases.map(c => `<option value="${c._id}">${c.caseNumber} — ${c.title.substring(0, 35)}</option>`).join('');
        sel.innerHTML = opts;
        if (filterSel) filterSel.innerHTML = '<option value="">All Cases</option>' + data.cases.map(c => `<option value="${c._id}">${c.caseNumber} — ${c.title.substring(0, 30)}</option>`).join('');
    } catch (e) { /* silent */ }
}

async function loadDocuments(page = 1) {
    const caseId = document.getElementById('filter-case')?.value || '';
    const category = document.getElementById('filter-category')?.value || '';
    const grid = document.getElementById('doc-grid');
    grid.innerHTML = '<div class="loading-overlay" style="grid-column:span 5;"><div class="spinner"></div></div>';

    try {
        const data = await api.get('/documents', { caseId, category, page, limit: 12 });
        document.getElementById('count-text').textContent = `${data.count} documents`;

        if (!data.documents.length) {
            grid.innerHTML = '<div class="empty-state" style="grid-column:span 5;"><div class="empty-icon">📄</div><h3>No documents found</h3><p>Upload your first legal document.</p></div>';
            document.getElementById('pagination').innerHTML = '';
            return;
        }

        grid.innerHTML = data.documents.map(doc => `
      <div class="doc-card">
        <div class="doc-icon">${getDocIcon(doc.mimetype)}</div>
        <div class="doc-name" title="${doc.originalName}">${doc.originalName.substring(0, 22)}${doc.originalName.length > 22 ? '...' : ''}</div>
        <div class="doc-meta">${formatFileSize(doc.size)}</div>
        ${doc.caseId ? `<div class="doc-meta" style="color:var(--gold);margin-top:2px;">${doc.caseId.caseNumber || ''}</div>` : ''}
        <span class="badge badge-ongoing" style="margin-top:6px;font-size:10px;">${doc.category}</span>
        <div class="doc-actions">
          <a href="/api/documents/${doc._id}/download" class="btn btn-secondary btn-sm btn-icon" title="Download" target="_blank">⬇️</a>
          <button class="btn btn-danger btn-sm btn-icon" title="Delete" onclick="deleteDocument('${doc._id}','${doc.originalName.replace(/'/g, "\\'")}')">🗑️</button>
        </div>
        <div style="font-size:10px;color:var(--text-muted);margin-top:6px;">${formatDate(doc.createdAt)}</div>
      </div>`).join('');

        // Pagination
        const totalPages = data.pages;
        const pagination = document.getElementById('pagination');
        if (totalPages <= 1) { pagination.innerHTML = ''; return; }
        pagination.innerHTML = Array.from({ length: totalPages }, (_, i) => `<button class="page-btn ${i + 1 === page ? 'active' : ''}" onclick="loadDocuments(${i + 1})">${i + 1}</button>`).join('');
    } catch (e) {
        showToast('Failed to load documents: ' + e.message, 'error');
        grid.innerHTML = '<div class="empty-state" style="grid-column:span 5;"><span>⚠️</span><h3>Error loading documents</h3></div>';
    }
}

async function uploadDocument() {
    if (!selectedFile) { showToast('Please select a file to upload.', 'error'); return; }

    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('caseId', document.getElementById('upload-case').value);
    formData.append('category', document.getElementById('upload-category').value);
    formData.append('description', document.getElementById('upload-desc').value);

    const btn = document.getElementById('upload-btn');
    btn.disabled = true; btn.textContent = 'Uploading...';

    try {
        await api.upload('/documents/upload', formData);
        showToast('Document uploaded successfully!', 'success');
        closeModal('upload-modal');
        selectedFile = null;
        document.getElementById('selected-file').textContent = '';
        document.getElementById('upload-desc').value = '';
        document.getElementById('file-input').value = '';
        loadDocuments(1);
    } catch (e) { showToast(e.message, 'error'); }
    finally { btn.disabled = false; btn.textContent = '📤 Upload'; }
}

function deleteDocument(id, name) {
    confirmAction(`Delete document "<strong>${name}</strong>"?`, async () => {
        try { await api.delete(`/documents/${id}`); showToast('Document deleted.', 'success'); loadDocuments(1); }
        catch (e) { showToast(e.message, 'error'); }
    });
}

loadCaseOptions();
loadDocuments();
