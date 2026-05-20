// =============================================
// UI.JS — Shared UI utilities for Advocate CMS
// =============================================

// ---------- Toast Notifications ----------
function showToast(message, type = 'info', subtitle = '') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
    <span class="toast-icon">${icons[type] || '💬'}</span>
    <div>
      <div class="toast-message">${message}</div>
      ${subtitle ? `<div class="toast-sub">${subtitle}</div>` : ''}
    </div>
  `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4200);
}

// ---------- Modal Management ----------
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        closeModal(e.target.id);
    }
});

// ---------- Sidebar Toggle (mobile) ----------
function initSidebarToggle() {
    const toggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (!toggle || !sidebar) return;

    toggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !toggle.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });
}

// ---------- Dark / Light Mode Toggle ----------
function initThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon(saved);

    if (btn) {
        btn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            updateThemeIcon(next);
        });
    }
}

function updateThemeIcon(theme) {
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ---------- Notification Panel ----------
function initNotifPanel() {
    const bell = document.getElementById('notif-bell');
    const panel = document.getElementById('notif-panel');
    if (!bell || !panel) return;

    bell.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
        if (!bell.contains(e.target) && !panel.contains(e.target)) {
            panel.classList.remove('open');
        }
    });
}

// ---------- Overlay Spinner ----------
function showOverlay() {
    let el = document.getElementById('overlay-spinner');
    if (!el) {
        el = document.createElement('div');
        el.id = 'overlay-spinner';
        el.className = 'overlay-spinner';
        el.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;gap:16px;">' +
            '<div class="spinner" style="width:40px;height:40px;border-width:3px;"></div>' +
            '<div style="color:var(--text-muted);font-size:14px;">Loading...</div></div>';
        document.body.appendChild(el);
    }
    el.style.display = 'flex';
}

function hideOverlay() {
    const el = document.getElementById('overlay-spinner');
    if (el) el.style.display = 'none';
}

// ---------- Active Nav Link ----------
function setActiveNav() {
    const page = window.location.pathname.split('/').pop();
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });
}

// ---------- Format Utilities ----------
function formatDate(date) {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCurrency(amount) {
    return '₹' + (parseFloat(amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function timeAgo(date) {
    const diff = Date.now() - new Date(date).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'Just now';
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const days = Math.floor(hr / 24);
    if (days < 30) return `${days}d ago`;
    return formatDate(date);
}

function getBadgeClass(status) {
    const map = {
        'Pending': 'badge-pending', 'Ongoing': 'badge-ongoing',
        'Closed': 'badge-closed', 'Won': 'badge-won', 'Lost': 'badge-lost',
        'Paid': 'badge-paid', 'Overdue': 'badge-overdue', 'Partial': 'badge-pending',
        'Active': 'badge-active', 'Inactive': 'badge-inactive',
        'High': 'badge-high', 'Medium': 'badge-medium', 'Low': 'badge-low', 'Urgent': 'badge-urgent'
    };
    return map[status] || 'badge-pending';
}

function getDocIcon(mimetype) {
    if (!mimetype) return '📄';
    if (mimetype.includes('pdf')) return '📕';
    if (mimetype.includes('word') || mimetype.includes('doc')) return '📘';
    if (mimetype.includes('image')) return '🖼️';
    if (mimetype.includes('text')) return '📄';
    return '📎';
}

// ---------- Pagination ----------
function renderPagination(container, currentPage, totalPages, onPageChange) {
    if (totalPages <= 1) { container.innerHTML = ''; return; }
    let html = `<div class="page-info">Page ${currentPage} of ${totalPages}</div>`;
    html += `<button class="page-btn" onclick="(${onPageChange})(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>‹</button>`;

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="(${onPageChange})(${i})">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<span style="color:var(--text-muted);padding:0 4px;">…</span>`;
        }
    }
    html += `<button class="page-btn" onclick="(${onPageChange})(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>›</button>`;
    container.innerHTML = html;
}

// ---------- Confirm Dialog ----------
function confirmAction(message, onConfirm) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.id = 'confirm-modal-dynamic';
    modal.innerHTML = `
    <div class="modal modal-sm">
      <div class="modal-header">
        <span class="modal-title">⚠️ Confirm Action</span>
        <button class="modal-close" onclick="document.getElementById('confirm-modal-dynamic').remove()">✕</button>
      </div>
      <div class="modal-body" style="text-align:center;padding:28px 24px;">
        <div style="font-size:40px;margin-bottom:12px;">🗑️</div>
        <p style="font-size:15px;color:var(--text-primary);margin-bottom:8px;">${message}</p>
        <p style="font-size:13px;color:var(--text-muted);">This action cannot be undone.</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('confirm-modal-dynamic').remove()">Cancel</button>
        <button class="btn btn-danger" id="confirm-yes-btn">Delete</button>
      </div>
    </div>`;
    document.body.appendChild(modal);
    document.getElementById('confirm-yes-btn').addEventListener('click', () => {
        modal.remove();
        onConfirm();
    });
}

// ---------- Sidebar Loader ----------
function loadSidebarUser() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const nameEl = document.getElementById('sidebar-user-name');
    const roleEl = document.getElementById('sidebar-user-role');
    const avatarEl = document.getElementById('sidebar-avatar');

    if (nameEl) nameEl.textContent = user.name || 'Advocate';
    if (roleEl) roleEl.textContent = user.firmName || user.role || 'Law Firm';
    if (avatarEl) avatarEl.textContent = (user.name || 'A').charAt(0).toUpperCase();
}

// ---------- Logout ----------
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'auth.html';
}

// ---------- Init on load ----------
document.addEventListener('DOMContentLoaded', () => {
    initSidebarToggle();
    initThemeToggle();
    initNotifPanel();
    setActiveNav();
    loadSidebarUser();
});
