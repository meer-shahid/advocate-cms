// ====================================================
// API.JS — Central fetch wrapper with JWT injection
// ====================================================

const API_BASE = '/api';

async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
    };

    // For FormData (file uploads), don't set Content-Type — let browser set it
    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers
        });

        // Handle 401 - redirect to login
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'auth.html';
            return;
        }

        const data = await response.json().catch(() => ({ success: false, message: 'Invalid server response' }));

        if (!response.ok) {
            throw new Error(data.message || `HTTP ${response.status}`);
        }

        return data;
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Cannot connect to server. Please ensure the server is running.');
        }
        throw error;
    }
}

// Convenience methods
const api = {
    get: (endpoint, params = {}) => {
        const qs = Object.keys(params).filter(k => params[k] !== undefined && params[k] !== '').map(k => `${k}=${encodeURIComponent(params[k])}`).join('&');
        return apiFetch(qs ? `${endpoint}?${qs}` : endpoint);
    },
    post: (endpoint, body) => apiFetch(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    put: (endpoint, body) => apiFetch(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (endpoint) => apiFetch(endpoint, { method: 'DELETE' }),
    upload: (endpoint, formData) => apiFetch(endpoint, { method: 'POST', body: formData, headers: {} })
};

// Auth guard for protected pages
function requireAuth() {
    if (!localStorage.getItem('token')) {
        window.location.href = 'auth.html';
    }
}
