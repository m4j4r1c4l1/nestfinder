import { getSetting } from './api';

const LOG_BUFFER_SIZE = 20;
const FLUSH_INTERVAL = 5000; // 5 seconds

let logBuffer = [];
let flushTimer = null;
let isDebugMode = false;

// Initialize logger with current debug state
export const initLogger = (debugEnabled) => {
    isDebugMode = debugEnabled;
    if (isDebugMode) {
        console.log('[Logger] Debug Mode Enabled');
        // Flush any pending logs immediately
        flushLogs();
    }
};

// Update debug state dynamically
export const setDebugMode = (enabled) => {
    isDebugMode = enabled;
    if (enabled) {
        console.log('[Logger] Debug Mode Switched ON');
        flushLogs();
    } else {
        console.log('[Logger] Debug Mode Switched OFF');
        // Clear buffer when disabled to stop sending
        logBuffer = [];
    }
};

const sendLogs = async (logsToSend) => {
    if (!logsToSend || logsToSend.length === 0) return;

    try {
        const payload = {
            logs: logsToSend,
            platform: navigator.platform,
            userAgent: navigator.userAgent
        };

        // Use fetch directly to avoid circular dependency with api.js if it uses logger
        await fetch('/api/debug/logs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
    } catch (err) {
        // Fallback to console if upload fails, but don't loop infinite errors
        console.error('[Logger] Failed to upload logs', err);
    }
};

const flushLogs = () => {
    if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
    }

    if (logBuffer.length > 0 && isDebugMode) {
        const batch = [...logBuffer];
        logBuffer = [];
        sendLogs(batch);
    }
};

const queueLog = (level, ...args) => {
    // Always print to console
    const originalConsole = window.console[level] || window.console.log;
    // originalConsole.apply(window.console, args); // Optional: let the original call happen naturally if we just hook

    if (!isDebugMode) return;

    const message = args.map(arg => {
        if (arg instanceof Error) return arg.toString() + '\n' + arg.stack;
        if (typeof arg === 'object') return JSON.stringify(arg);
        return String(arg);
    }).join(' ');

    const entry = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`;
    logBuffer.push(entry);

    if (logBuffer.length >= LOG_BUFFER_SIZE) {
        flushLogs();
    } else if (!flushTimer) {
        flushTimer = setTimeout(flushLogs, FLUSH_INTERVAL);
    }
};

// Hook console methods
// Warning: This affects global console. verify if this is desired.
// For now, we prefer explicit usage or a safe wrapper. 
// A safer approach for a "helper" is to export log functions, but users might use console.log directly.
// Let's monkey-patch for "Update 3: user visually identifiable methods for debugging".

const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

export const hookConsole = () => {
    console.log = (...args) => {
        originalLog.apply(console, args);
        queueLog('info', ...args);
    };
    console.warn = (...args) => {
        originalWarn.apply(console, args);
        queueLog('warn', ...args);
    };
    console.error = (...args) => {
        originalError.apply(console, args);
        queueLog('error', ...args);
    };
};
