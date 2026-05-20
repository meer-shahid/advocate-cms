// ====================================================
// DASHBOARD.JS — Dashboard stats, charts, calendar
// ====================================================

//requireAuth();
renderSidebar('dashboard.html');

// Welcome message based on time
const hour = new Date().getHours();
const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
const user = JSON.parse(localStorage.getItem('user') || '{}');
const el = document.getElementById('welcome-text');
if (el) el.textContent = `${greet}, ${user.name ? user.name.split(' ')[0] : 'Advocate'}! Here's your practice overview.`;

// Update topbar
const tb = document.getElementById('topbar-avatar');
const tn = document.getElementById('topbar-name');
if (tb) tb.textContent = (user.name || 'A').charAt(0);
if (tn) tn.textContent = user.name || 'Advocate';

// Chart instances
let statusChart, typeChart, calendar;

async function loadDashboard() {
    try {
        const data = await api.get('/dashboard/stats');
        renderStats(data.stats);
        renderCharts(data.charts);
        renderUpcomingHearings(data.upcomingHearingsList || []);
        renderActivityFeed(data.recentNotifications || []);
        initCalendar(data.upcomingHearingsList || []);
        if (data.stats.unreadNotifications > 0) {
            document.getElementById('notif-dot').style.display = 'block';
        }
        loadNotifications();
    } catch (error) {
        showToast('Failed to load dashboard: ' + error.message, 'error');
    }
}

function renderStats(stats) {
    document.getElementById('stat-clients').textContent = stats.totalClients;
    document.getElementById('stat-cases').textContent = stats.activeCases;
    document.getElementById('stat-cases-sub').textContent = `of ${stats.totalCases} total`;
    document.getElementById('stat-hearings').textContent = stats.upcomingHearings;
    document.getElementById('stat-pending').textContent = formatCurrency(stats.pendingPayments);
    document.getElementById('stat-revenue').textContent = formatCurrency(stats.totalRevenue);
    document.getElementById('stat-clients-change').textContent = `↑ ${stats.newClientsThisMonth} this month`;
}

function renderCharts(charts) {
    const palette = ['#c9a227', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b', '#06b6d4', '#84cc16'];

    // Status Chart (Pie)
    const statusEl = document.getElementById('statusChart');
    if (statusEl) {
        const labels = charts.casesByStatus.map(s => s._id);
        const values = charts.casesByStatus.map(s => s.count);
        if (statusChart) statusChart.destroy();
        statusChart = new Chart(statusEl, {
            type: 'doughnut',
            data: {
                labels: labels.length ? labels : ['No cases yet'],
                datasets: [{ data: values.length ? values : [1], backgroundColor: palette, borderWidth: 0, hoverOffset: 6 }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 12, padding: 16 } }
                },
                cutout: '65%'
            }
        });
    }

    // Type Chart (Bar)
    const typeEl = document.getElementById('typeChart');
    if (typeEl) {
        const labels = charts.casesByType.map(s => s._id);
        const values = charts.casesByType.map(s => s.count);
        if (typeChart) typeChart.destroy();
        typeChart = new Chart(typeEl, {
            type: 'bar',
            data: {
                labels: labels.length ? labels : ['Civil', 'Criminal', 'Family'],
                datasets: [{
                    label: 'Cases',
                    data: values.length ? values : [0, 0, 0],
                    backgroundColor: 'rgba(201,162,39,0.6)',
                    borderColor: '#c9a227',
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
                    y: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.06)' }, beginAtZero: true }
                }
            }
        });
    }
}

function renderUpcomingHearings(hearings) {
    const container = document.getElementById('upcoming-hearings-list');
    if (!hearings.length) {
        container.innerHTML = '<div class="empty-state" style="padding:24px;"><div class="empty-icon">📅</div><h3>No upcoming hearings</h3><p>Schedule your next hearing from the Hearings page.</p></div>';
        return;
    }

    container.innerHTML = hearings.map(h => {
        const caseData = h.caseId || {};
        const client = (caseData.clientId) || {};
        const days = Math.ceil((new Date(h.hearingDate) - new Date()) / 86400000);
        const urgentColor = days <= 3 ? 'var(--accent-red)' : days <= 7 ? 'var(--accent-orange)' : 'var(--gold)';
        return `
      <div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
        <div style="width:44px;height:44px;border-radius:10px;background:rgba(201,162,39,0.1);border:1px solid rgba(201,162,39,0.3);display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;">
          <div style="font-size:14px;font-weight:800;color:${urgentColor};line-height:1;">${new Date(h.hearingDate).getDate()}</div>
          <div style="font-size:9px;color:var(--text-muted);text-transform:uppercase;">${new Date(h.hearingDate).toLocaleString('default', { month: 'short' })}</div>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${caseData.title || 'Case'}</div>
          <div style="font-size:12px;color:var(--text-muted);">${h.courtName || 'Court'} • ${client.name || '—'}</div>
        </div>
        <span style="font-size:11px;font-weight:600;color:${urgentColor};">${days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}</span>
      </div>`;
    }).join('');
}

function renderActivityFeed(notifications) {
    const container = document.getElementById('activity-list');
    if (!notifications.length) {
        container.innerHTML = '<div class="empty-state" style="padding:24px;"><div class="empty-icon">🔔</div><h3>No recent activity</h3></div>';
        return;
    }

    const icons = { 'Hearing Reminder': '📅', 'Payment Due': '💰', 'Case Update': '📁', 'New Client': '👤', 'System': '⚙️', 'General': 'ℹ️' };
    container.innerHTML = `<div style="padding:0 4px;">` + notifications.map(n => `
    <div class="notif-item ${n.isRead ? '' : 'unread'}" style="border-radius:8px;margin-bottom:4px;">
      <div class="notif-icon">${icons[n.type] || 'ℹ️'}</div>
      <div class="notif-content">
        <div class="notif-title">${n.title}</div>
        <div class="notif-msg">${n.message}</div>
        <div class="notif-time">${timeAgo(n.createdAt)}</div>
      </div>
    </div>`).join('') + `</div>`;
}

function initCalendar(hearings) {
    const calEl = document.getElementById('calendar');
    if (!calEl || typeof FullCalendar === 'undefined') return;

    const events = hearings.map(h => ({
        title: (h.caseId && h.caseId.title) ? h.caseId.title.substring(0, 25) : 'Hearing',
        date: h.hearingDate,
        backgroundColor: '#1a3a6b',
        borderColor: '#c9a227',
        textColor: '#f1f5f9'
    }));

    if (calendar) calendar.destroy();
    calendar = new FullCalendar.Calendar(calEl, {
        initialView: 'dayGridMonth',
        events,
        headerToolbar: { left: 'prev', center: 'title', right: 'next' },
        height: 280,
        eventClick: () => window.location.href = 'hearings.html'
    });
    calendar.render();
}

async function loadNotifications() {
    try {
        const data = await api.get('/notifications', { limit: 5 });
        const list = document.getElementById('notif-list');
        const icons = { 'Hearing Reminder': '📅', 'Payment Due': '💰', 'Case Update': '📁', 'System': '⚙️', 'General': 'ℹ️' };

        if (!data.notifications.length) {
            list.innerHTML = '<div class="empty-state" style="padding:24px;font-size:13px;">No notifications</div>';
            return;
        }

        list.innerHTML = data.notifications.map(n => `
      <div class="notif-item ${n.isRead ? '' : 'unread'}" onclick="markRead('${n._id}')">
        <div class="notif-icon">${icons[n.type] || 'ℹ️'}</div>
        <div class="notif-content">
          <div class="notif-title">${n.title}</div>
          <div class="notif-msg">${n.message}</div>
          <div class="notif-time">${timeAgo(n.createdAt)}</div>
        </div>
      </div>`).join('');
    } catch (e) { /* silent */ }
}

async function markRead(id) {
    try { await api.put(`/notifications/${id}/read`, {}); } catch (e) { /* silent */ }
}

async function markAllRead() {
    try {
        await api.put('/notifications/read-all', {});
        document.getElementById('notif-dot').style.display = 'none';
        showToast('All notifications marked as read.', 'success');
        loadNotifications();
    } catch (e) { /* silent */ }
}

// Init
loadDashboard();
