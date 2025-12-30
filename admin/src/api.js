const API_URL = import.meta.env.VITE_API_URL || '/api';

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
        // Remove undefined/null/empty values to prevent "undefined" string in URL
        const cleanFilters = Object.fromEntries(
            Object.entries(filters).filter(([_, v]) => v != null && v !== '')
        );
        const params = new URLSearchParams(cleanFilters);
        return this.fetch(`/admin/logs?${params}`);
    },

    getLogActions() {
        return this.fetch('/admin/logs/actions');
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

    deletePoint(pointId) {
        return this.fetch(`/admin/points/${pointId}`, {
            method: 'DELETE',
        });
    },

    changePassword(currentPassword, newPassword) {
        return this.fetch('/admin/password', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword }),
        });
    },

    resetDatabase(target = 'all') {
        return this.fetch('/admin/reset', {
            method: 'POST',
            body: JSON.stringify({ confirm: target.toUpperCase(), target }),
        });
    },

    deleteUser(userId) {
        return this.fetch(`/admin/users/${userId}`, {
            method: 'DELETE',
        });
    },

    getNotifications() {
        return this.fetch('/admin/notifications');
    },

    getConfirmations() {
        return this.fetch('/admin/confirmations');
    }
};
