// =============================================
// SIDEBAR.JS — Shared sidebar HTML injector
// =============================================

function renderSidebar(activePage) {
    const nav = [
        { page: 'dashboard.html', icon: '🏛️', label: 'Dashboard', section: 'MAIN' },
        { page: 'clients.html', icon: '👥', label: 'Clients', section: null },
        { page: 'cases.html', icon: '📁', label: 'Cases', section: null },
        { page: 'hearings.html', icon: '📅', label: 'Hearings', section: null },
        { page: 'documents.html', icon: '📄', label: 'Documents', section: 'RECORDS' },
        { page: 'payments.html', icon: '💰', label: 'Payments', section: null },
        { page: 'notes.html', icon: '📝', label: 'Case Notes', section: null },
        { page: 'profile.html', icon: '⚙️', label: 'Settings', section: 'ACCOUNT' }
    ];

    let html = `
    <div class="sidebar-logo">
      <div class="logo-icon">⚖️</div>
      <div>
        <div class="logo-text">Advocate CMS</div>
        <div class="logo-sub">Legal Management</div>
      </div>
    </div>
    <nav class="sidebar-nav">`;

    let currentSection = null;
    nav.forEach(item => {
        if (item.section && item.section !== currentSection) {
            currentSection = item.section;
            html += `<div class="nav-section-title">${item.section}</div>`;
        }
        const isActive = activePage === item.page;
        html += `
      <a href="${item.page}" class="nav-item ${isActive ? 'active' : ''}" data-page="${item.page}">
        <span class="nav-icon">${item.icon}</span>
        <span>${item.label}</span>
      </a>`;
    });

    html += `
    </nav>
    <div class="sidebar-footer">
      <div class="user-profile-mini" onclick="window.location.href='profile.html'">
        <div class="avatar" id="sidebar-avatar">A</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:600;color:var(--text-primary);truncate" id="sidebar-user-name">Loading...</div>
          <div style="font-size:11px;color:var(--text-muted);truncate" id="sidebar-user-role">Advocate</div>
        </div>
        <span style="font-size:16px;color:var(--text-muted);">⚙️</span>
      </div>
      <button onclick="logout()" class="btn btn-secondary btn-sm btn-full" style="margin-top:8px;font-size:12px;">
        🚪 Logout
      </button>
    </div>`;

    const container = document.getElementById('sidebar');
    if (container) container.innerHTML = html;
}
