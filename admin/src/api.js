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

        // Detect server unavailable (502/503/504) - dispatch event for toast
        if (response.status === 502 || response.status === 503 || response.status === 504) {
            window.dispatchEvent(new CustomEvent('server:unavailable', { detail: { status: response.status } }));
            throw new Error('Server is restarting. Please wait...');
        }

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            // Check if it looks like a 502/503/504 error page
            if (text.includes('<title>502') || text.includes('<title>503') || text.includes('<title>504')) {
                window.dispatchEvent(new CustomEvent('server:unavailable', { detail: { status: response.status } }));
                throw new Error('Server is restarting. Please wait...');
            }
            if (!response.ok) {
                throw new Error(`Server Error (${response.status}): ${response.statusText || 'Unknown Connection Error'}`);
            }
            return text;
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

    getUserLogs(userId) {
        return this.fetch(`/debug/users/${userId}/logs`);
    },

    async downloadLogs(userId) {
        const response = await fetch(`${API_URL}/debug/users/${userId}/logs/download`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });
        if (!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nestfinder_logs_${userId}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    },


    deleteAllLogs() {
        return this.fetch('/debug/logs', { method: 'DELETE' });
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
    },

    // ========== DB File Management ==========

    getDBFiles() {
        return this.fetch('/admin/db/files');
    },

    deleteDBFile(filename) {
        return this.fetch(`/admin/db/files/${encodeURIComponent(filename)}`, {
            method: 'DELETE'
        });
    },

    async uploadDBFile(file) {
        const response = await fetch(`${API_URL}/admin/db/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
            body: file
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || 'Upload failed');
        }
        return await response.json();
    },

    async downloadDBFile(filename) {
        const response = await fetch(`${API_URL}/admin/db/files/${encodeURIComponent(filename)}/download`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });
        if (!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    },

    async restoreFromFile(filename) {
        const response = await fetch(`${API_URL}/admin/db/restore/${encodeURIComponent(filename)}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || 'Restore failed');
        }
        return await response.json();
    },

    // ========== Backup Schedule (Task #8) ==========

    getBackupSchedule() {
        return this.fetch('/admin/db/backup-schedule');
    },

    setBackupSchedule(time, intervalDays, startDate, retentionDays, corruptRetentionDays, uploadRetentionDays, enabled) {
        return this.fetch('/admin/db/backup-schedule', {
            method: 'PUT',
            body: JSON.stringify({ time, intervalDays, startDate, retentionDays, corruptRetentionDays, uploadRetentionDays, enabled })
        });
    },

    createBackupNow() {
        return this.fetch('/admin/db/backup-now', { method: 'POST' });
    },

    submitFeedback(type, text, rating) {
        // Use the public feedback endpoint (same as client)
        // We don't have a userId context easily, so we can omit it or send 'admin-crash'
        return this.fetch('/admin/feedback', {
            method: 'POST',
            body: JSON.stringify({
                type,
                txt: text,
                rating,
                // user_id: 'admin' // server might strip this if valid user check fails, but allowed for anon
            })
        });
    }
};
