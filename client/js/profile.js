// ====================================================
// PROFILE.JS
// ====================================================
//requireAuth();
renderSidebar('profile.html');

async function loadProfile() {
    try {
        const data = await api.get('/auth/me');
        const u = data.user;
        document.getElementById('profile-avatar').textContent = u.name.charAt(0).toUpperCase();
        document.getElementById('profile-name').textContent = u.name;
        document.getElementById('profile-firm').textContent = u.firmName || 'No firm set';
        document.getElementById('profile-role').textContent = u.role;
        document.getElementById('p-name').value = u.name;
        document.getElementById('p-phone').value = u.phone || '';
        document.getElementById('p-email').value = u.email;
        document.getElementById('p-bar').value = u.barCouncilNumber || '';
        document.getElementById('p-firm').value = u.firmName || '';
        document.getElementById('p-spec').value = u.specialization || '';
        document.getElementById('p-address').value = u.address || '';
        document.getElementById('pref-role').textContent = u.role;
        document.getElementById('pref-login').textContent = u.lastLogin ? formatDate(u.lastLogin) : 'First login';
    } catch (e) { showToast('Failed to load profile', 'error'); }
}

async function saveProfile() {
    const btn = document.getElementById('save-profile-btn');
    btn.disabled = true; btn.textContent = 'Saving...';
    try {
        const payload = {
            name: document.getElementById('p-name').value.trim(),
            phone: document.getElementById('p-phone').value.trim(),
            firmName: document.getElementById('p-firm').value.trim(),
            barCouncilNumber: document.getElementById('p-bar').value.trim(),
            specialization: document.getElementById('p-spec').value.trim(),
            address: document.getElementById('p-address').value.trim()
        };
        const data = await api.put('/auth/profile', payload);
        localStorage.setItem('user', JSON.stringify(data.user));
        showToast('Profile updated successfully!', 'success');
        loadSidebarUser();
        document.getElementById('profile-avatar').textContent = payload.name.charAt(0).toUpperCase();
        document.getElementById('profile-name').textContent = payload.name;
        document.getElementById('profile-firm').textContent = payload.firmName || '—';
    } catch (e) { showToast(e.message, 'error'); }
    finally { btn.disabled = false; btn.textContent = '💾 Save Changes'; }
}

async function changePassword() {
    const cur = document.getElementById('p-cur-pass').value;
    const nw = document.getElementById('p-new-pass').value;
    const conf = document.getElementById('p-confirm-pass').value;

    if (!cur || !nw || !conf) { showToast('All fields are required.', 'error'); return; }
    if (nw.length < 6) { showToast('New password must be at least 6 characters.', 'error'); return; }
    if (nw !== conf) { showToast('Passwords do not match.', 'error'); return; }

    const btn = document.getElementById('change-pass-btn');
    btn.disabled = true; btn.textContent = 'Changing...';
    try {
        await api.put('/auth/change-password', { currentPassword: cur, newPassword: nw });
        showToast('Password changed successfully!', 'success');
        document.getElementById('p-cur-pass').value = '';
        document.getElementById('p-new-pass').value = '';
        document.getElementById('p-confirm-pass').value = '';
    } catch (e) { showToast(e.message, 'error'); }
    finally { btn.disabled = false; btn.textContent = '🔒 Change Password'; }
}

function showTab(tab) {
    ['info', 'password', 'preferences'].forEach(t => {
        document.getElementById(`tab-${t}-panel`).classList.toggle('hidden', t !== tab);
        document.getElementById(`tab-${t}`).classList.toggle('active', t === tab);
    });
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeIcon(next);
    document.getElementById('pref-theme-btn').textContent = next === 'dark' ? '🌙 Dark' : '☀️ Light';
}

// Update pref theme button on load
const savedTheme = localStorage.getItem('theme') || 'dark';
const pfBtn = document.getElementById('pref-theme-btn');
if (pfBtn) pfBtn.textContent = savedTheme === 'dark' ? '🌙 Dark' : '☀️ Light';

loadProfile();
