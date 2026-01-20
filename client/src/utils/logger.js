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
            debugLevel: 'default', // default | aggressive | paranoic
            persist: true,  // Controls L2 storage (default true for ring buffer)
            uploadInterval: 5000, // Updated to 5s
            pollInterval: 30000
        };
        this.timers = {
            poll: null,
            upload: null
        };
        this.lastGpsTick = null; // Throttling for Paranoic GPS

        // Load initial logs from storage (L2)
        this._loadFromStorage();

        // Expose to window for console debugging
        if (typeof window !== 'undefined') {
            window.DebugLogger = this;
        }
    }

    getStatus() {
        return {
            enabled: this.config.enabled,
            level: this.config.debugLevel
        };
    }

    init(api) {
        this.api = api;
        this.isInitialized = true;
        this.log('System', 'DebugLogger initialized', this.config);

        // Start polling for remote debug status as fallback
        this._startPolling();
    }

    /**
     * ASAP Sync (Task 113): External trigger from WebSocket listeners
     */
    _handleSocketUpdate(message) {
        if (message.type === 'debug_update' || message.global) {
            // Internal bypass: If it's a global setting update, we check anyway.
            // If it's a specific userId, only react if it's ours.
            if (!message.global && message.userId && message.userId !== this.userId) return;

            this.log('System', 'Received ASAP debug update signal via WS');
            this._checkStatus();
        }
    }

    async _checkStatus() {
        try {
            const token = localStorage.getItem('nestfinder_user_token');
            if (!token) return;

            // Task 113: Ensure we use the correct API_URL for status checks
            const baseUrl = import.meta.env.VITE_API_URL || '/api';
            const url = `${baseUrl}/debug/status`;

            const currentLevel = this.config.debugLevel;
            if (currentLevel !== 'default') {
                this.log('System', `Checking remote debug status (ASAP Sync)...`, { url });
            }

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                const isActive = data.active === true;
                const newLevel = data.debug_level || 'default';

                let changed = false;
                if (isActive !== this.config.enabled) {
                    this.config.enabled = isActive;
                    this.log('System', `Remote debug status changed: ${isActive ? 'ENABLED' : 'DISABLED'}`);
                    changed = true;

                    if (isActive) {
                        this._logSystemInfo(); // Task #107: Initial Debug Packet
                        this.log('Debug', 'Next, the relation of live events -and pending if any- for this Debug Session:');
                        this._startUpload();
                    } else {
                        this._stopUpload();
                        // Task #31: Clear logs when disabled for default level
                        if (this.config.debugLevel === 'default') {
                            this.clear();
                        }
                    }
                }

                if (newLevel !== this.config.debugLevel) {
                    this.log('System', `Debug level changed: ${this.config.debugLevel} -> ${newLevel}`);
                    this.config.debugLevel = newLevel;
                    changed = true;
                }

                if (changed) {
                    // Update internal state or emit event
                    window.dispatchEvent(new CustomEvent('debug_status_updated', {
                        detail: { enabled: this.config.enabled, level: this.config.debugLevel }
                    }));
                }
            } else if (res.status === 401 || res.status === 403) {
                // Task #25: If unauthorized/forbidden, disable locally
                if (this.config.enabled) {
                    this.log('System', `Access denied (${res.status}): Disabling debug mode.`);
                    this.config.enabled = false;
                    this._stopUpload();
                    window.dispatchEvent(new CustomEvent('debug_status_updated', {
                        detail: { enabled: false, level: this.config.debugLevel }
                    }));
                }
            }
        } catch (e) {
            // Enhanced error reporting (Task #105)
            const currentLevel = this.config.debugLevel;
            if (currentLevel === 'paranoic') {
                console.error(`${LOG_PREFIX} [System] Status check failed:`, e);
            } else if (currentLevel === 'aggressive') {
                console.warn(`${LOG_PREFIX} [System] Status check failed: ${e.message}`);
            }
            // 'default' remains silent to avoid console noise for regular users
        }
    }

    _startPolling() {
        if (this.timers.poll) clearInterval(this.timers.poll);
        this._checkStatus(); // Check immediately
        this.timers.poll = setInterval(() => this._checkStatus(), this.config.pollInterval);
    }

    _startUpload() {
        if (this.timers.upload) clearInterval(this.timers.upload);
        // Trigger immediate upload of whatever is pending (e.g. initial packet)
        this.upload();
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
     * Gathers and logs initial system state (Task #107)
     */
    _logSystemInfo() {
        if (!typeof window === 'undefined') return;

        const info = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screen: `${window.screen.width}x${window.screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            route: window.location.pathname,
            localTime: new Date().toLocaleString('en-GB', { timeZone: 'Europe/Paris' }) + ' CET',
            memory: performance?.memory ? {
                totalJS: Math.round(performance.memory.totalJSHeapSize / 1048576) + 'MB',
                usedJS: Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB'
            } : 'N/A'
        };

        this.log('System', 'Debug Mode Activated (Initial Status)', info);
    }

    /**
     * Internal log entry creation
     */
    _entry(level, category, message, data = null) {
        // Task #106: Filter internal upload noise
        const internalMsgs = ['Uploading logs to server...', 'Logs uploaded successfully'];
        if (category === 'System' && internalMsgs.includes(message)) {
            return;
        }

        const entry = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            ts: new Date().toISOString(),
            level,
            category: category || 'General',
            msg: message,
            data,
            dl: this.config.debugLevel // Capture the source debug level (d=default, a=aggressive, p=paranoic)
        };

        // Task #31: Conditional buffering based on level
        // Default level: Only buffer when enabled. Aggressive/Paranoic: Always buffer.
        const shouldBuffer = this.config.enabled || this.config.debugLevel !== 'default';

        if (shouldBuffer) {
            // 1. Add to internal buffer
            this.logs.push(entry);
            if (this.logs.length > MAX_LOGS) this.logs.shift();

            // 2. Persist (L2)
            this._saveToStorage();
        }

        // 3. Console Output (L1) & Filtering
        const currentLevel = this.config.debugLevel;
        const isError = level === 'error' || level === 'warn';

        // Verbosity check
        let shouldShow = isError; // Errors always show
        if (!shouldShow && this.config.enabled) {
            if (currentLevel === 'paranoic') {
                // Optimization: Throttle RawGPS ticks to prevent spam
                if (category === 'RawGPS' && data?.latitude && data?.longitude) {
                    const last = this.lastGpsTick;
                    const now = Date.now();
                    const distMoved = last ? Math.sqrt(Math.pow(data.latitude - last.lat, 2) + Math.pow(data.longitude - last.lon, 2)) : 1;

                    // Only log if moved significantly or every 10s
                    if (last && distMoved < 0.0001 && (now - last.ts < 10000)) return;
                    this.lastGpsTick = { lat: data.latitude, lon: data.longitude, ts: now };
                }
                shouldShow = true;
            }
            else if (currentLevel === 'aggressive') {
                // In aggressive, hide high-frequency or raw data categories
                const rawCategories = ['RawMap', 'RawGPS', 'RawPayload'];
                shouldShow = !rawCategories.includes(category);
            } else {
                // Default: Major categories + Interaction
                const majorCategories = ['System', 'Auth', 'Home', 'MapView', 'API', 'Interaction'];
                shouldShow = majorCategories.includes(category);
            }
        }

        if (shouldShow) {
            const style = level === 'error' ? 'color: #ef4444; font-weight: bold' :
                level === 'warn' ? 'color: #f59e0b; font-weight: bold' :
                    currentLevel === 'paranoic' ? 'color: #ef4444; font-weight: bold' :
                        currentLevel === 'aggressive' ? 'color: #a855f7; font-weight: bold' :
                            'color: #3b82f6; font-weight: bold';

            const args = [`%c${LOG_PREFIX} [${category}]`, style, message];
            if (data) args.push(data);

            const fn = console[level] || console.log;
            fn(...args);
        }
    }

    log(category, message, data) { this._entry('info', category, message, data); }
    warn(category, message, data) { this._entry('warn', category, message, data); }
    error(category, message, data) { this._entry('error', category, message, data); }
    debug(category, message, data) { this._entry('debug', category, message, data); }

    setUserId(id) {
        this.userId = id;
        this.log('System', `User ID set: ${id}`);
    }

    /**
     * L3: Upload Logs to Server
     */
    async upload() {
        const toUpload = this.logs.filter(l => !l.uploaded);
        if (toUpload.length === 0) return { success: false, message: 'No new logs to upload' };

        try {
            // Task #106: Dedup - We don't log "Uploading..." to avoid infinite loops if it fails
            // this.log('System', 'Uploading logs to server...'); 

            const response = await fetch('/api/debug/logs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('nestfinder_user_token') || ''}`
                },
                body: JSON.stringify({
                    logs: toUpload,
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                    timestamp: new Date().toISOString(),
                    userId: this.userId
                })
            });

            if (!response.ok) {
                // If 403, it means we are no longer allowed to upload.
                // Stop the interval and trigger a status check update.
                if (response.status === 403) {
                    const errData = await response.json().catch(() => ({}));
                    console.warn(LOG_PREFIX, `Upload Forbidden (${errData.code || 'UNKNOWN'}): Stopping auto-upload.`);
                    this._stopUpload();
                    this._checkStatus(); // Force status sync
                    throw new Error(`Upload failed (403): ${errData.error || 'Forbidden'}`);
                }
                throw new Error(`Upload failed: ${response.status}`);
            }

            const result = await response.json();

            // Mark as uploaded and prune old uploaded logs to keep storage clean
            toUpload.forEach(l => l.uploaded = true);

            // Optional: Prune uploaded logs if they are too old or buffer is large
            // keep it simple for now, _entry already handles MAX_LOGS

            this._saveToStorage();

            return result;
        } catch (e) {
            // Avoid logging the error to L3 if it's an upload error to prevent recursion
            console.error(LOG_PREFIX, 'Failed to upload logs', e);
            throw e;
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
