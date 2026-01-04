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

    blockUser(userId) {
        return this.fetch(`/admin/users/${userId}/block`, {
            method: 'PUT',
        });
    },

    unblockUser(userId) {
        return this.fetch(`/admin/users/${userId}/unblock`, {
            method: 'PUT',
        });
    },

    updateUserTrustScore(userId, score) {
        return this.fetch(`/admin/users/${userId}/trust-score`, {
            method: 'PUT',
            body: JSON.stringify({ trust_score: score }),
        });
    },

    getNotifications() {
        return this.fetch('/admin/notifications');
    },

    getConfirmations() {
        return this.fetch('/admin/confirmations');
    },

    async downloadBackup() {
        const response = await fetch(`${API_URL}/admin/backup`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });
        if (!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nestfinder_backup_${new Date().toISOString().split('T')[0]}.db`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }
};
