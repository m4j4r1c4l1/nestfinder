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
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const tz = getTimezoneLabel();
    return `${day}-${month}-${year} - ${hours}:${minutes}:${seconds} ${tz}`;
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
            const timestamp = formatTimestamp();
            // For console, we want a readable format
            // For storage, we want the timestamped string

            // Console output
            if (import.meta.env?.DEV) console.log(`🐛 [${module}][${action}] ${message}`);
        }

        // Only store if debug enabled (or we can store always and only upload if enabled? 
        // Better to store always in ring buffer so we have history when enabled)
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
    async upload(api) {
        const logs = getLogs();
        if (logs.length === 0) return true;

        try {
            await api.post('/debug/logs', {
                logs,
                userId: _userId || api.userId,
                platform: navigator.platform || 'Unknown',
                userAgent: navigator.userAgent
            });
            // Don't clear logs automatically, let admin clear or ring buffer handle it
            // Or maybe clear uploaded ones? For simplicity, we keep ring buffer.
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
