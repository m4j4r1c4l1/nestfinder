/**
 * Client-Side Debug Logger (Task 9)
 * 
 * Provides 3 levels of observability:
 * L1: Console (Safe wrappers, filtered by verbosity)
 * L2: Durable (Persisted to localStorage for reload survival)
 * L3: Remote (Upload to server for admin access)
 */

const LOG_PREFIX = '[NestFinder]';
const STORAGE_KEY = 'nestfinder_debug_logs';
const MAX_LOGS = 1000;

class DebugLogger {
    constructor() {
        this.logs = [];
        this.isInitialized = false;
        this.config = {
            enabled: false, // Controls L1 console output visibility
            persist: true,  // Controls L2 storage (default true for ring buffer)
            uploadInterval: 10000,
            pollInterval: 30000
        };
        this.timers = {
            poll: null,
            upload: null
        };

        // Load initial logs from storage (L2)
        this._loadFromStorage();

        // Expose to window for console debugging
        if (typeof window !== 'undefined') {
            window.DebugLogger = this;
        }
    }

    init(config = {}) {
        this.config = { ...this.config, ...config };
        this.isInitialized = true;
        this.log('System', 'DebugLogger initialized', this.config);

        // Start polling for remote debug status
        this._startPolling();
    }

    async _checkStatus() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const res = await fetch('/api/debug/status', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const isActive = data.active === true;

                if (isActive !== this.config.enabled) {
                    this.config.enabled = isActive;
                    this.log('System', `Remote debug status changed: ${isActive ? 'ENABLED' : 'DISABLED'}`);

                    if (isActive) this._startUpload();
                    else this._stopUpload();
                }
            }
        } catch (e) {
            // Silent fail on poll
        }
    }

    _startPolling() {
        if (this.timers.poll) clearInterval(this.timers.poll);
        this._checkStatus(); // Check immediately
        this.timers.poll = setInterval(() => this._checkStatus(), this.config.pollInterval);
    }

    _startUpload() {
        if (this.timers.upload) clearInterval(this.timers.upload);
        this.timers.upload = setInterval(() => this.upload(), this.config.uploadInterval);
    }

    _stopUpload() {
        if (this.timers.upload) {
            clearInterval(this.timers.upload);
            this.timers.upload = null;
        }
    }

    _loadFromStorage() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                this.logs = JSON.parse(saved);
                // Prune if needed
                if (this.logs.length > MAX_LOGS) {
                    this.logs = this.logs.slice(-MAX_LOGS);
                }
            }
        } catch (e) {
            console.error(LOG_PREFIX, 'Failed to load logs', e);
        }
    }

    _saveToStorage() {
        if (!this.config.persist) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs));
        } catch (e) {
            console.warn(LOG_PREFIX, 'Failed to save logs', e);
        }
    }

    /**
     * Internal log entry creation
     */
    _entry(level, category, message, data = null) {
        const entry = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            ts: new Date().toISOString(),
            level,
            category: category || 'General',
            msg: message,
            data
        };

        // 1. Add to internal buffer
        this.logs.push(entry);
        if (this.logs.length > MAX_LOGS) this.logs.shift();

        // 2. Persist (L2)
        this._saveToStorage();

        // 3. Console Output (L1)
        // Always output to console if enabled OR if explicitly an error/warn
        // Using a cleaner format
        if (this.config.enabled || level === 'error' || level === 'warn') {
            const style = level === 'error' ? 'color: #ef4444; font-weight: bold' :
                level === 'warn' ? 'color: #f59e0b; font-weight: bold' :
                    'color: #3b82f6; font-weight: bold';

            const args = [`%c${LOG_PREFIX} [${category}]`, style, message];
            if (data) args.push(data);

            // Safe console call
            const fn = console[level] || console.log;
            fn(...args);
        }
    }

    log(category, message, data) { this._entry('info', category, message, data); }
    warn(category, message, data) { this._entry('warn', category, message, data); }
    error(category, message, data) { this._entry('error', category, message, data); }
    debug(category, message, data) { this._entry('debug', category, message, data); }

    /**
     * L3: Upload Logs to Server
     */
    async upload() {
        if (this.logs.length === 0) return { success: false, message: 'No logs to upload' };

        try {
            this.log('System', 'Uploading logs to server...');

            // We use the planned endpoint: POST /api/debug/logs
            // Note: client might not have base URL set, assuming relative path works for proxy
            const response = await fetch('/api/debug/logs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Include token if available in localStorage
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                },
                body: JSON.stringify({
                    logs: this.logs,
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) throw new Error(`Upload failed: ${response.status}`);

            const result = await response.json();
            this.log('System', 'Logs uploaded successfully', result);
            return result;
        } catch (e) {
            this.error('System', 'Failed to upload logs', e);
            throw e; // Re-throw for caller handling
        }
    }

    clear() {
        this.logs = [];
        localStorage.removeItem(STORAGE_KEY);
        this.log('System', 'Logs cleared');
    }

    getDump() {
        return JSON.stringify(this.logs, null, 2);
    }
}

export const logger = new DebugLogger();
export default logger;
