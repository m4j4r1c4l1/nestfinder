/**
 * Client Debug Logger
 * 
 * Provides structured logging with timestamps and tags.
 * Stores logs in localStorage ring buffer and uploads to server when enabled.
 * 
 * Format: DD-MM-YYYY - HH:MM:SS CET/CEST [Module][Action] message
 * 
 * Usage:
 *   import { logger } from './utils/logger';
 *   logger.log('Settings', 'Recovery Key', 'Generated new recovery key');
 */

const MAX_LOGS = 500;
const STORAGE_KEY = 'nestfinder_debug_logs';

// Get CET/CEST timezone label
const getTimezoneLabel = () => {
    const now = new Date();
    const jan = new Date(now.getFullYear(), 0, 1).getTimezoneOffset();
    const jul = new Date(now.getFullYear(), 6, 1).getTimezoneOffset();
    const parisNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
    const parisOffset = (now.getTime() - parisNow.getTime()) / (60 * 1000);
    // Simple check: if offset is different from standard CET (-60), it's DST
    // But easier way: just check if local offset matches Jan (Standard) or Jul (DST)
    return Math.max(jan, jul) !== Math.min(jan, jul) ? 'CEST' : 'CET';
};

// Format timestamp: DD-MM-YYYY - HH:MM:SS CET/CEST
const formatTimestamp = () => {
    const now = new Date();
    // Get time in Paris
    const parisString = now.toLocaleString('en-GB', { timeZone: 'Europe/Paris', hour12: false });
    // parisString is "DD/MM/YYYY, HH:MM:SS"
    const [datePart, timePart] = parisString.split(', ');
    const [day, month, year] = datePart.split('/');

    // Determine DST based on offset comparison (same as before or simplified)
    const unix = now.getTime();
    const jan = new Date(year, 0, 1).getTimezoneOffset();
    const jul = new Date(year, 6, 1).getTimezoneOffset();
    // We can't rely on local offset for remote timezone DST check easily without libraries.
    // But we can check if the Paris string offset matches.
    // Simpler: Just rely on the previous logic for label but apply it to the Correct Time.
    const tz = getTimezoneLabel();

    return `${day}-${month}-${year} - ${timePart} ${tz}`;
};

// Get stored logs
const getLogs = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

// Save logs to localStorage
const saveLogs = (logs) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(-MAX_LOGS)));
    } catch {
        // Storage full or unavailable
    }
};

// Internal state
let _debugEnabled = false;
let _userId = null;
let _uploadInterval = null;

// Logger API
export const logger = {
    /**
     * Set user ID
     */
    setUserId(id) {
        _userId = id;
    },

    /**
     * Log a debug message
     * @param {string} module - Module name (e.g., 'Settings', 'Map', 'API')
     * @param {string} action - Action name (e.g., 'Recovery Key', 'Submit Point')
     * @param {string} message - Log message
     */
    log(module, action, message) {
        // Always log to console in dev or if debug enabled
        if (import.meta.env?.DEV || _debugEnabled) {
            // Console output
            if (import.meta.env?.DEV) console.log(`🐛 [${module}][${action}] ${message}`);
        }

        // Only store if debug enabled or needed for ring buffer
        const timestamp = formatTimestamp();
        const entry = `${timestamp} [${module}][${action}] ${message}`;

        const logs = getLogs();
        logs.push(entry);
        saveLogs(logs);
    },

    /**
     * Get all stored logs
     * @returns {string[]} Array of log entries
     */
    getLogs() {
        return getLogs();
    },

    /**
     * Clear all stored logs
     */
    clear() {
        localStorage.removeItem(STORAGE_KEY);
    },

    /**
     * Upload logs to server
     * @param {object} api - API client instance
     * @returns {Promise<boolean>} Success status
     */
    async upload(api, isCrash = false) {
        const logs = getLogs();
        if (logs.length === 0) return true;

        try {
            await api.post('/debug/logs', {
                logs,
                userId: _userId || api.userId,
                platform: navigator.platform || 'Unknown',
                userAgent: navigator.userAgent,
                isCrash
            });

            // Clear logs after successful upload to prevent duplication
            // We use clear() which removes the item, so getLogs() will return [] next time
            this.clear();

            return true;
        } catch (err) {
            console.error('Failed to upload logs:', err);
            return false;
        }
    },

    /**
     * Check if debug mode is enabled for current user
     * @param {object} api - API client instance
     */
    async checkStatus(api) {
        try {
            const res = await api.get('/debug/status');
            _debugEnabled = res.active;

            // If enabled, start auto-upload
            if (_debugEnabled && !_uploadInterval) {
                _uploadInterval = setInterval(() => this.upload(api), 5000); // Upload every 5s
            } else if (!_debugEnabled && _uploadInterval) {
                clearInterval(_uploadInterval);
                _uploadInterval = null;
            }
            return res.active;
        } catch {
            _debugEnabled = false;
            return false;
        }
    },

    /**
     * Initialize logger
     * @param {object} api - API client instance
     */
    async init(api) {
        if (api.userId) _userId = api.userId;

        // Initial check
        await this.checkStatus(api);

        if (_debugEnabled) {
            this.log('Logger', 'Init', `Debug logging enabled for user ${_userId}`);
        } else {
            // Log startup anyway (will only be stored if we decide to store everything, 
            // but currently log() checks _debugEnabled for console. 
            // For storage, we might want to store it?)
            // actually log() stores to ring buffer ALWAYS.
            this.log('Logger', 'Init', `App started (Debug disabled, User: ${_userId})`);
        }

        // Poll status every 30 seconds to allow dynamic enabling
        // Clear existing interval if re-initializing
        if (window._nestfinder_debug_poll) clearInterval(window._nestfinder_debug_poll);
        window._nestfinder_debug_poll = setInterval(() => this.checkStatus(api), 30000);
    }
};

export default logger;
