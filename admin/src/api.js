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

    // Debug logging helper - only logs when debug mode is enabled
    debugLog(...args) {
        if (localStorage.getItem('nestfinder_debug_mode') === 'true') {
            console.log(...args);
        }
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

        if (response.status === 401 || response.status === 403) {
            this.logout();
            window.dispatchEvent(new Event('auth:unauthorized'));
            throw new Error('Session expired. Please log in again.');
        }

        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            if (!response.ok) {
                throw new Error(`Server Error (${response.status}): ${response.statusText || 'Unknown Connection Error'}`);
            }
            return text; // Should not happen for this API but safe fallback
        }

        if (!response.ok) {
            throw new Error(data.error || `request failed with status ${response.status}`);
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
    },

    checkCorruptDB() {
        return this.fetch('/admin/db/corrupt-check');
    },

    async downloadCorruptDB() {
        const response = await fetch(`${API_URL}/admin/db/download-corrupt`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });
        if (!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nestfinder_corrupt_${new Date().toISOString().split('T')[0]}.db`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    },

    async restoreDB(file) {
        const headers = {
            'Authorization': `Bearer ${this.token}`
        };
        // Use raw body for file
        const response = await fetch(`${API_URL}/admin/db/restore`, {
            method: 'POST',
            headers,
            body: file
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || 'Restore failed');
        }
        return await response.json();
    }
};
