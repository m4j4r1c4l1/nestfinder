const API_URL = import.meta.env.DEV ? '/api' : '/api';

export const adminApi = {
    token: localStorage.getItem('nestfinder_admin_token'),

    setToken(token) {
        this.token = token;
        localStorage.setItem('nestfinder_admin_token', token);
    },

    logout() {
        this.token = null;
        localStorage.removeItem('nestfinder_admin_token');
    },

    async fetch(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Something went wrong');
        }

        return data;
    },

    login(username, password) {
        return this.fetch('/auth/admin/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
    },

    getStats() {
        return this.fetch('/admin/stats');
    },

    getLogs(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.fetch(`/admin/logs?${params}`);
    },

    getSettings() {
        return this.fetch('/settings');
    },

    updateSettings(settings) {
        return this.fetch('/settings', {
            method: 'PUT',
            body: JSON.stringify({ settings }),
        });
    },

    getUsers() {
        return this.fetch('/admin/users');
    },

    getPoints() {
        return this.fetch('/admin/points');
    },

    changePassword(currentPassword, newPassword) {
        return this.fetch('/admin/password', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword }),
        });
    }
};
