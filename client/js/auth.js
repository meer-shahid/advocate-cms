// ====================================================
// AUTH.JS — Login, Register, Logout
// ====================================================

// Prevent multiple submissions
let isSubmitting = false;

async function handleLogin() {
    if (isSubmitting) return;

    const email = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value;

    if (!email || !password) {
        showToast('Please enter email and password.', 'error');
        return;
    }

    isSubmitting = true;

    const btn = document.getElementById('login-btn');
    const text = document.getElementById('login-btn-text');
    const spinner = document.getElementById('login-spinner');

    btn.disabled = true;
    text.textContent = 'Signing in...';
    spinner.classList.remove('hidden');

    try {
        const data = await api.post('/auth/login', {
            email,
            password
        });

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        showToast(`Welcome back, ${data.user.name}!`, 'success');

        // Redirect safely
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);

    } catch (error) {
        showToast(error.message || 'Login failed', 'error');
    } finally {
        isSubmitting = false;

        btn.disabled = false;
        text.textContent = 'Sign In';
        spinner.classList.add('hidden');
    }
}

async function handleRegister() {
    if (isSubmitting) return;

    const name = document.getElementById('reg-name')?.value.trim();
    const email = document.getElementById('reg-email')?.value.trim();
    const password = document.getElementById('reg-password')?.value;
    const phone = document.getElementById('reg-phone')?.value.trim();
    const firmName = document.getElementById('reg-firm')?.value.trim();

    if (!name || !email || !password) {
        showToast('Name, email and password are required.', 'error');
        return;
    }

    if (password.length < 6) {
        showToast('Password must be at least 6 characters.', 'error');
        return;
    }

    isSubmitting = true;

    const btn = document.getElementById('reg-btn');
    const text = document.getElementById('reg-btn-text');
    const spinner = document.getElementById('reg-spinner');

    btn.disabled = true;
    text.textContent = 'Creating account...';
    spinner.classList.remove('hidden');

    try {
        const data = await api.post('/auth/register', {
            name,
            email,
            password,
            phone,
            firmName
        });

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        showToast('Account created successfully!', 'success');

        // Redirect safely
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);

    } catch (error) {
        showToast(error.message || 'Registration failed', 'error');
    } finally {
        isSubmitting = false;

        btn.disabled = false;
        text.textContent = 'Create Account';
        spinner.classList.add('hidden');
    }
}

// ENTER key support
document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;

    // Prevent repeated Enter spam
    e.preventDefault();

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm && !loginForm.classList.contains('hidden')) {
        handleLogin();
    } else if (registerForm && !registerForm.classList.contains('hidden')) {
        handleRegister();
    }
});