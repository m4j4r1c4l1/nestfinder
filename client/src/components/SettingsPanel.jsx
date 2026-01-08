import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { QRCodeCanvas } from 'qrcode.react';

const NOTIFICATION_PREF_KEY = 'nestfinder_notify_settings';
const APP_URL = 'https://m4j4r1c4l1.github.io/nestfinder';

// Status Logic - accepts t function for translations
const getStatus = (score = 0, t) => {
    if (score >= 50) return { name: t?.('settings.statusEagle') || 'Eagle', icon: '🦅', color: '#f59e0b' }; // Amber
    if (score >= 30) return { name: t?.('settings.statusOwl') || 'Owl', icon: '🦉', color: '#8b5cf6' };   // Violet
    if (score >= 10) return { name: t?.('settings.statusSparrow') || 'Sparrow', icon: '🐦', color: '#3b82f6' }; // Blue
    return { name: t?.('settings.statusHatchling') || 'Hatchling', icon: '🥚', color: '#94a3b8' }; // Slate
};

// Recovery Key Section Component
const RecoveryKeySection = ({ t }) => {
    const { user } = useAuth();
    const [recoveryKey, setRecoveryKey] = useState(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showKey, setShowKey] = useState(true);
    const [keyVisible, setKeyVisible] = useState(true);
    const [fadeOpacity, setFadeOpacity] = useState(1);
    const [errorMessage, setErrorMessage] = useState(null);

    // Load recovery key from session storage OR check user object on mount
    useEffect(() => {
        const sessionKey = sessionStorage.getItem('nestfinder_recovery_key_temp');

        if (sessionKey) {
            setRecoveryKey(sessionKey);
            setKeyVisible(false);
            setFadeOpacity(0);
        } else if (user?.has_recovery_key) {
            // User has a key but it's not in session (e.g. fresh login/reload)
            // We can't show the key itself (security), but we show the "Show Key" UI
            // which will likely prompt a re-generation or retrieval if we implemented that flow.
            // Wait, if we can't show the key, we should at least show "Key Generated" state or similar.
            // Actually, for this PoC, if user has key, let's assume they might want to see it?
            // No, we can't retrieve it. We can only "Regenerate" it or "Show" if saved locally.
            // If local session is gone, we can only GENERATE A NEW ONE.
            // But the Requirement says: "Generate Recovery Key must be set to Show Recovery Key".
            // If we can't fetch it, we can't show it.
            // Let's stick strictly to what the user said: "Show Recovery Key button".
            // But clicking it currently just shows current state.
            // If we don't have the key string, we can't show it.
            // Re-reading: "if the account has just been restored... Show Recovery Key".
            // Restoring sets `nestfinder_recovery_key_temp`? NO. It clears it usually.
            // Ah, recovery flow uses a key provided by user. Maybe save THAT key to session?
            // YES. In `handleConfirmRestore`, we should save the inputKey to `nestfinder_recovery_key_temp`.
        }
    }, [user]);



    const generateKey = async () => {
        setLoading(true);
        try {
            // Check if user is authenticated
            if (!api.userId && !api.userToken) {
                throw new Error('Please ensure you are logged in. Try refreshing the page.');
            }

            const result = await api.generateRecoveryKey();
            setRecoveryKey(result.recoveryKey);
            setKeyVisible(true);
            setFadeOpacity(1);
            setShowKey(true);

            // Save to session storage for current session persistence
            sessionStorage.setItem('nestfinder_recovery_key_temp', result.recoveryKey);
        } catch (err) {
            console.error('Failed to generate recovery key:', err);
            setErrorMessage(err.message || 'Failed to generate key. Please try again.');
            // Auto hide error after 10 seconds
            setTimeout(() => setErrorMessage(null), 10000);
        }
        setLoading(false);
    };

    const handleShowKey = () => {
        setKeyVisible(true);
        setFadeOpacity(1);
        setShowKey(true);
    };

    const copyKey = () => {
        if (recoveryKey) {
            navigator.clipboard.writeText(recoveryKey);
            setCopied(true);

            // Hide key after "Copied" message duration (3 seconds)
            setTimeout(() => {
                setCopied(false);
                setFadeOpacity(0);
                setTimeout(() => {
                    setKeyVisible(false);
                    setShowKey(false);
                }, 200); // Wait for fade
            }, 3000);
        }
    };

    return (
        <div style={{
            padding: 'var(--space-3)',
            background: 'var(--color-bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                <div style={{ fontWeight: 500 }}>
                    🔑 {t?.('settings.recoveryKey') || 'Recovery Key'}
                </div>
                {recoveryKey && keyVisible && (
                    <button
                        onClick={() => setShowKey(!showKey)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-text-secondary)',
                            cursor: 'pointer',
                            fontSize: '1rem'
                        }}
                    >
                        {showKey ? '🙉' : '🙈'}
                    </button>
                )}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
                {t?.('settings.recoveryKeyDescription') || 'Save this key to restore your identity on a new device.'}
            </div>

            {recoveryKey ? (
                <div>
                    {keyVisible && (
                        <div style={{
                            padding: 'var(--space-3)',
                            background: 'var(--color-bg-secondary)',
                            borderRadius: 'var(--radius-md)',
                            fontFamily: 'monospace',
                            fontSize: 'var(--font-size-lg)',
                            fontWeight: 600,
                            textAlign: 'center',
                            letterSpacing: '0.05em',
                            color: 'var(--color-primary)', // Restored blue color
                            marginBottom: 'var(--space-2)',
                            opacity: fadeOpacity,
                            transition: 'opacity 0.2s ease-out',
                            cursor: 'pointer',
                            border: '1px solid var(--color-border)'
                        }}
                            onClick={copyKey}
                            title="Click to copy and hide"
                        >
                            {showKey ? recoveryKey : '•••-•••-•••'}
                        </div>
                    )}
                    {keyVisible ? (
                        <button
                            onClick={copyKey}
                            style={{
                                width: '100%',
                                padding: 'var(--space-2)',
                                background: copied ? 'var(--color-confirmed)' : 'var(--color-primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                transition: 'background 0.3s'
                            }}
                        >
                            {copied ? `✓ ${t?.('settings.copied') || 'Copied!'}` : `📋 ${t?.('settings.copyKey') || 'Copy Key'}`}
                        </button>
                    ) : (
                        <button
                            onClick={handleShowKey}
                            style={{
                                width: '100%',
                                padding: 'var(--space-2)',
                                background: 'var(--color-primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                transition: 'background 0.3s'
                            }}
                        >
                            🔑 {t?.('settings.showKey') || 'Show Recovery Key'}
                        </button>
                    )}

                    {/* Usage Instructions - Explicit Options with Animation */}
                    <div style={{
                        marginTop: 'var(--space-3)',
                        animation: 'fadeIn 0.5s ease-out',
                        opacity: 1
                    }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>
                            {t?.('settings.restoreOptionsTitle') || 'To restore your account you have 2 options:'}
                        </div>

                        {[
                            t?.('settings.restoreOption1') || '**Login:** Type your key in **Nickname** field.',
                            t?.('settings.restoreOption2') || '**New:** Restore from section below.'
                        ].map((part, i) => (
                            <div key={i} style={{
                                padding: 'var(--space-3)',
                                background: 'var(--color-bg-secondary)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.75rem',
                                color: 'var(--color-text-secondary)',
                                lineHeight: 1.4,
                                marginBottom: 'var(--space-2)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-2)',
                                animation: 'fadeIn 0.5s ease-out backwards',
                                animationDelay: `${0.2 + (i * 0.1)}s`
                            }}>
                                <span style={{
                                    minWidth: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    background: 'var(--color-primary)',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    fontSize: '0.7rem',
                                    marginTop: '1px'
                                }}>{i + 1}</span>
                                <div>
                                    {part.split('**').map((chunk, j) => j % 2 === 1 ? <strong key={j}>{chunk}</strong> : chunk)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <button
                    onClick={generateKey}
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: 'var(--space-2)',
                        background: copied ? 'var(--color-confirmed)' : 'var(--color-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        opacity: loading ? 0.7 : 1,
                        transition: 'background 0.3s'
                    }}
                >
                    {copied ? `✓ ${t?.('settings.keyGenerated') || 'Key Generated & Copied!'}` : loading ? (t?.('common.loading') || 'Generating...') : `🔑 ${t?.('settings.generateKey') || 'Generate Recovery Key'}`}
                </button>
            )
            }

            {/* Error Badge */}
            {
                errorMessage && (
                    <div style={{
                        padding: 'var(--space-2)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: 'var(--radius-md)',
                        color: '#ef4444',
                        fontSize: '0.85rem',
                        textAlign: 'center',
                        marginTop: 'var(--space-2)',
                        cursor: 'pointer',
                        animation: 'fadeIn 0.3s ease-out'
                    }} onClick={() => setErrorMessage(null)}>
                        ⚠️ {errorMessage}
                    </div>
                )
            }
        </div>
    );
};

// Restore Account Section Component
const RestoreAccountSection = ({ t }) => {
    const { recoverFromKey } = useAuth();
    const [inputKey, setInputKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    // Tap-to-paste handler
    const handleInputClick = async () => {
        // Only attempt paste if input is empty
        if (!inputKey.trim()) {
            try {
                const clipboardText = await navigator.clipboard.readText();
                if (clipboardText && /^\w+-\w+-\w+$/.test(clipboardText.trim().toLowerCase())) {
                    setInputKey(clipboardText.trim().toLowerCase());
                    setError(null);
                }
            } catch (err) {
                // Clipboard access denied - silent fail
                console.log('Clipboard access not available');
            }
        }
    };

    const handleInputChange = (e) => {
        // Smart formatting: lowercase, letters/dashes only, spaces -> dashes
        let val = e.target.value.toLowerCase();

        // Replace spaces/underscores with dashes
        val = val.replace(/[\s_]+/g, '-');

        // Remove invalid chars (keep only a-z and -)
        val = val.replace(/[^a-z-]/g, '');

        // Prevent multiple consecutive dashes
        val = val.replace(/-+/g, '-');

        setInputKey(val);
        setError(null);
    };

    const handleRestoreClick = () => {
        if (!inputKey.trim()) return;

        // Normalize key just in case (though handleInputChange handles most)
        const keyToUse = inputKey.trim().replace(/-+$/, ''); // Remove trailing dashes

        // Check if trying to restore own key
        const currentKey = sessionStorage.getItem('nestfinder_recovery_key_temp');
        if (currentKey && keyToUse === currentKey.toLowerCase()) {
            setError(t?.('settings.sameKeyError') || 'This is your current account\'s recovery key. You are already logged in with this account.');
            return;
        }

        // Skip warning if user already copied their recovery key this session
        if (currentKey) {
            handleConfirmRestore(keyToUse);
            return;
        }

        setShowConfirmDialog(true);
    };

    const handleConfirmRestore = async (keyOverride = null) => {
        setShowConfirmDialog(false);
        setLoading(true);
        setError(null);

        try {
            const keyToUse = keyOverride || inputKey.trim().replace(/-+$/, '');
            await recoverFromKey(keyToUse);
            setSuccess(true);

            // Save the restored key to session storage so the "Show Recovery Key" button works
            sessionStorage.setItem('nestfinder_recovery_key_temp', keyToUse);

            // Reload page to refresh user state
            setTimeout(() => window.location.reload(), 1500);
        } catch (err) {
            setError(t?.('settings.invalidRecoveryKey') || 'Invalid recovery key. Please check and try again.');
        }
        setLoading(false);
    };

    return (
        <div style={{
            padding: 'var(--space-3)',
            background: 'var(--color-bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            marginTop: 'var(--space-3)'
        }}>
            <div style={{ fontWeight: 500, marginBottom: 'var(--space-2)' }}>
                🧿 {t?.('settings.restoreAccount') || 'Restore Account'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
                {t?.('settings.restoreAccountDescription') || 'Enter your 3-word recovery key (spaces or dashes).'}
            </div>

            <input
                type="text"
                value={inputKey}
                onChange={handleInputChange}
                onClick={handleInputClick}
                placeholder={t?.('settings.enterRecoveryKey') || 'word word word'}
                style={{
                    width: '100%',
                    padding: 'var(--space-2)',
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-text)',
                    fontSize: '1rem',
                    textAlign: 'center',
                    fontFamily: 'monospace',
                    letterSpacing: '0.05em',
                    marginBottom: 'var(--space-2)'
                }}
            />

            {error && (
                <div style={{
                    padding: 'var(--space-2)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    color: '#ef4444',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                    marginBottom: 'var(--space-2)'
                }}>
                    {error}
                </div>
            )}

            {success && (
                <div style={{
                    padding: 'var(--space-2)',
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    color: '#22c55e',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                    marginBottom: 'var(--space-2)'
                }}>
                    ✓ {t?.('settings.accountRestored') || 'Account restored! Reloading...'}
                </div>
            )}

            <button
                onClick={handleRestoreClick}
                disabled={loading || !inputKey.trim() || success}
                style={{
                    width: '100%',
                    padding: 'var(--space-2)',
                    background: success ? 'var(--color-confirmed)' : 'var(--color-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    cursor: loading || !inputKey.trim() || success ? 'not-allowed' : 'pointer',
                    opacity: loading || !inputKey.trim() ? 0.7 : 1,
                    transition: 'background 0.3s'
                }}
            >
                {loading ? (t?.('common.loading') || 'Restoring...') : `🔄 ${t?.('settings.restoreButton') || 'Restore Account'}`}
            </button>

            {/* Confirmation Dialog - Portal to body for full-screen blur */}
            {showConfirmDialog && ReactDOM.createPortal(
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000,
                    padding: 'var(--space-4)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)'
                }}>
                    <div style={{
                        background: 'rgba(51, 65, 85, 0.95)',
                        borderRadius: 'var(--radius-xl)',
                        border: '1px solid var(--color-border)',
                        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
                        maxWidth: '400px',
                        width: '100%',
                        overflow: 'hidden',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)'
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: 'var(--space-4)',
                            borderBottom: '1px solid var(--color-border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)'
                        }}>
                            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                            <span style={{
                                fontWeight: 600,
                                fontSize: 'var(--font-size-lg)',
                                color: 'var(--color-text-primary)'
                            }}>
                                {t?.('settings.restoreWarningTitle') || 'Warning'}
                            </span>
                        </div>

                        {/* Body */}
                        <div style={{
                            padding: 'var(--space-4)',
                            color: 'var(--color-text-secondary)',
                            fontSize: 'var(--font-size-sm)',
                            lineHeight: 1.6
                        }}>
                            {t?.('settings.restoreWarningMessage') || 'Restoring another account will disconnect you from your current account. If you haven\'t saved this account\'s recovery key, you will lose access to it permanently. Continue?'}
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: 'var(--space-4)',
                            borderTop: '1px solid var(--color-border)',
                            display: 'flex',
                            gap: 'var(--space-3)',
                            justifyContent: 'flex-end'
                        }}>
                            <button
                                onClick={() => setShowConfirmDialog(false)}
                                style={{
                                    padding: 'var(--space-2) var(--space-4)',
                                    background: 'transparent',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--color-text)',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    transition: 'all 0.2s'
                                }}
                            >
                                {t?.('common.cancel') || 'Cancel'}
                            </button>
                            <button
                                onClick={handleConfirmRestore}
                                style={{
                                    padding: 'var(--space-2) var(--space-4)',
                                    background: 'var(--color-primary)',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    transition: 'all 0.2s'
                                }}
                            >
                                {t?.('settings.restoreConfirmButton') || 'Yes, Restore'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};




// Simple 3-state toggle with dove/chick emoji
// States: left (swipe left to delete), center (both work), right (swipe right to delete)
const DoveToggle = ({ value, onChange }) => {
    const isLeft = value === 'left';
    const isRight = value === 'right';
    const isCenter = value === 'both' || value === 'center' || value === null || value === undefined;

    // Click to select: left third → left, center third → center, right third → right
    const handleClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const thirdWidth = rect.width / 3;

        if (clickX < thirdWidth) {
            onChange('left');
        } else if (clickX > thirdWidth * 2) {
            onChange('right');
        } else {
            onChange('both'); // Center = both
        }
    };

    // Calculate thumb position
    let thumbLeft = 'calc(50% - 50px)'; // Center default
    if (isLeft) thumbLeft = '4px';
    if (isRight) thumbLeft = 'calc(100% - 104px)';

    // Emoji and transform - roller points to where it IS (inverted from before)
    let emoji = <span style={{ fontSize: '1.2rem' }}>🐥</span>; // Chick for center
    let thumbTransform = 'none';
    if (isLeft) {
        emoji = '🕊️';
        thumbTransform = 'none'; // Point LEFT (Outward)
    }
    if (isRight) {
        emoji = '🕊️';
        thumbTransform = 'scaleX(-1)'; // Point RIGHT (Outward)
    }

    // Status messages for the gap areas - REMOVED per user request
    const statusContent = null;

    return (
        <div>
            <div
                onClick={handleClick}
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '42px',
                    boxSizing: 'border-box',
                    boxSizing: 'border-box',
                    background: '#3b82f6',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    userSelect: 'none'
                }}
            >
                {/* Status text in the gap - REMOVED */}
                {null}

                {/* Thumb with roller/chick */}
                <div style={{
                    position: 'absolute',
                    top: '1px',
                    left: thumbLeft,
                    width: '100px',
                    height: '40px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                    transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: thumbTransform
                }}>
                    {emoji}
                </div>
            </div>
        </div>
    );
};


const SwipeControl = ({ value, onChange, labelCenter }) => {
    const trackRef = React.useRef(null);
    const thumbRef = React.useRef(null);
    const [dragOffset, setDragOffset] = useState(null); // Pixel offset from start
    const dragOffsetRef = React.useRef(null); // Mirror for handleEnd closure
    const [trackWidth, setTrackWidth] = useState(300); // Default fallback
    const isDragging = React.useRef(false);
    const startX = React.useRef(0);
    // Stable geometry for the current drag session
    const dragBase = React.useRef(0); // Stable geometry for drag session
    const dragMax = React.useRef(0);
    const watchdogTimer = React.useRef(null); // Safety reset timer

    // Visual Debug Logger (for iOS testing without console)
    const [debugLog, setDebugLog] = useState([]);
    const logRef = React.useRef([]); // Sync source for API sending

    const addLog = (msg) => {
        logRef.current = [...logRef.current.slice(-499), msg]; // Keep 500 in Ref
        setDebugLog(prev => [...prev.slice(-49), msg]); // Keep 50 in UI (performance)
    };

    const wasJustDragging = React.useRef(false); // Track transition for SNAP log
    const moveCount = React.useRef(0); // Count moves in this gesture
    const gestureStartTime = React.useRef(0); // Timestamp when gesture started

    // Helpers to manage watchdog
    const clearWatchdog = () => {
        if (watchdogTimer.current) {
            clearTimeout(watchdogTimer.current);
            watchdogTimer.current = null;
        }
    };

    const startWatchdog = () => {
        clearWatchdog();
        watchdogTimer.current = setTimeout(() => {
            if (isDragging.current) {
                console.log('[SWIPE DEBUG] Watchdog Triggered!');
                addLog('🐶 WATCHDOG');
                handleEnd();
            }
        }, 100); // 100ms silence = instant reset
    };

    // Robust width tracking
    React.useLayoutEffect(() => {
        if (!trackRef.current) return;
        if (trackRef.current.offsetWidth > 0) {
            setTrackWidth(trackRef.current.offsetWidth);
        }
        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                if (entry.contentRect.width > 0) {
                    setTrackWidth(entry.contentRect.width);
                }
            }
        });
        observer.observe(trackRef.current);

        // Global Safety Net: If user releases anywhere (even if we lost capture silently)
        // This handles cases where Android browser swallows events but eventually fires a global up/cancel
        const handleGlobalUp = (e) => {
            if (isDragging.current) {
                console.log('[SWIPE DEBUG] Global UP caught!');
                addLog('GLOB_UP');
                handleEnd();
            }
        };

        window.addEventListener('pointerup', handleGlobalUp);
        window.addEventListener('pointercancel', handleGlobalUp);

        return () => {
            observer.disconnect();
            window.removeEventListener('pointerup', handleGlobalUp);
            window.removeEventListener('pointercancel', handleGlobalUp);
            clearWatchdog(); // Clear watchdog on unmount
        };
    }, []);

    // Touch handlers
    const handleStart = (clientX) => {
        if (!trackRef.current || !thumbRef.current) return;

        // Lock geometry using VISUAL DOM position (WYSIWYG)
        // This fixes stale state issues where logic might think we are Left but visual is Right
        const trackRect = trackRef.current.getBoundingClientRect();
        const thumbRect = thumbRef.current.getBoundingClientRect();

        // Calculate current relative X of the thumb
        // We trust the Visual Position as the source of truth
        const effectiveX = thumbRect.left - trackRect.left;

        const width = trackRect.width || 300; // Use precise rect width
        // Removed SYNC logic to avoid re-render during touch start which kills events on iOS
        const thumb = 100;
        const padding = 4;
        const pRight = width - thumb - padding;

        dragBase.current = effectiveX;
        dragMax.current = pRight;

        console.log('[SWIPE DEBUG] handleStart:', {
            value,
            clientX
        });

        isDragging.current = true;
        startX.current = clientX;
        setDragOffset(0);
        moveCount.current = 0; // Reset move counter
        gestureStartTime.current = Date.now(); // Record start time

        startWatchdog();
    };

    const handleMove = (clientX) => {
        if (!isDragging.current) return;
        moveCount.current++; // Increment move counter
        const delta = clientX - startX.current;
        dragOffsetRef.current = delta; // Update ref for handleEnd
        setDragOffset(delta);

        startWatchdog(); // Reset timer on every move
    };

    const handleEnd = () => {
        clearWatchdog(); // Stop the timer
        try {
            console.log('[SWIPE DEBUG] handleEnd CALLED:', { isDragging: isDragging.current, hasTrack: !!trackRef.current });
            if (!isDragging.current || !trackRef.current) return;
            isDragging.current = false;

            const effectiveWidth = Math.max(trackRef.current.offsetWidth, 200);
            const thumbWidth = 100;
            const padding = 4;

            // Calculate current base position to determine final absolute position
            const posLeft = padding;
            const posRight = effectiveWidth - thumbWidth - padding;
            const posCenter = (effectiveWidth - thumbWidth) / 2;

            let currentBase = posCenter;
            if (value === 'left') currentBase = posLeft;
            else if (value === 'right') currentBase = posRight;

            // Final position of the thumb (left edge)
            const finalPos = currentBase + dragOffsetRef.current;
            const finalCenter = finalPos + (thumbWidth / 2);

            // Zone thresholds (33% split)
            const zoneLeft = effectiveWidth * 0.33;
            const zoneRight = effectiveWidth * 0.66;

            if (finalCenter < zoneLeft) {
                onChange('left');
            } else if (finalCenter > zoneRight) {
                onChange('right');
            } else {
                onChange('both'); // Center/Both
            }

            dragOffsetRef.current = null;
            setDragOffset(null);
            const duration = Date.now() - gestureStartTime.current;
            addLog(`END moves:${moveCount.current} ${duration}ms v:${value || 'both'}`);
        } catch (err) {
            addLog(`ERR: ${err.message}`);
            console.error(err);
        }
    };

    const onPointerDown = (e) => {
        // Capture pointer to track even if it leaves the element
        let hasCap = false;
        try {
            e.target.setPointerCapture(e.pointerId);
            hasCap = e.target.hasPointerCapture(e.pointerId);
        } catch (err) {
            addLog(`CAP_ERR:${err.message}`);
        }
        e.preventDefault();
        addLog('────────────');
        addLog(`DOWN id:${e.pointerId} pri:${e.isPrimary} cap:${hasCap}`);
        addLog(`  btn:${e.buttons} pres:${e.pressure?.toFixed(2) || '?'}`);
        handleStart(e.clientX);
    };

    const onPointerMove = (e) => {
        if (!isDragging.current) return;
        // Log every 10th move to avoid spam, or first move
        if (moveCount.current === 0 || moveCount.current % 20 === 0) {
            const hasCap = e.target.hasPointerCapture?.(e.pointerId) ?? '?';
            addLog(`MOVE #${moveCount.current} x:${Math.round(e.clientX)} cap:${hasCap}`);
        }
        handleMove(e.clientX);
    };

    const onPointerUp = (e) => {
        e.target.releasePointerCapture(e.pointerId);
        addLog(`UP off:${dragOffsetRef.current}`);
        handleEnd();
    };

    const onPointerCancel = (e) => {
        // Handle iOS edge cases where touch is cancelled
        addLog('CANCEL');
        handleEnd();
    };

    const onLostPointerCapture = (e) => {
        // Fallback: fires when capture is lost for ANY reason
        // This ensures handleEnd always runs even if onPointerUp misses
        addLog('LOST');
        if (isDragging.current) {
            handleEnd();
        }
    };

    // Render Logic
    let style = {
        position: 'absolute',
        top: '4px',
        bottom: '4px',
        width: '100px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--color-primary)', // Keeping primary color for now
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.2rem',
        cursor: 'grab',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        transition: dragOffset !== null ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)', // Smooth snap
        left: 0, // Always use 0 and control via transform
        zIndex: 10
    };

    // Calculate Transform
    let translateX = 0;
    // Ensure effective width is never too small to prevent clamping to 0
    const effectiveWidth = Math.max(trackWidth, 200);
    const thumbWidth = 100;
    const padding = 4;

    // Base Positions (px)
    const posLeft = padding;
    const posRight = effectiveWidth - thumbWidth - padding;
    const posCenter = (effectiveWidth - thumbWidth) / 2;

    let currentBase = posCenter; // Default null
    if (value === 'left') currentBase = posLeft;
    else if (value === 'right') currentBase = posRight;

    // Apply Drag
    if (dragOffset !== null) {
        // Use STABLE geometry captured at toggle start
        let rawPos = dragBase.current + dragOffset;

        console.log('[SWIPE DEBUG] Render:', {
            value,
            dragBase: dragBase.current,
            dragMax: dragMax.current,
            dragOffset,
            rawPos,
            clampedPos: Math.max(4, Math.min(dragMax.current, rawPos))
        });

        // Strict Clamping using captured max
        // Left limit is always padding (4)
        rawPos = Math.max(4, Math.min(dragMax.current, rawPos));
        translateX = rawPos;
        wasJustDragging.current = true;
    } else {
        translateX = currentBase;
        // Log only on transition from dragging to snapped
        if (wasJustDragging.current) {
            addLog(`SNAP tx:${Math.round(translateX)} v:${value || 'null'}`);
            wasJustDragging.current = false;
        }
    }

    style.transform = `translateX(${translateX}px)`;

    // Dove Logic
    // If dragging: based on DELTA (dragOffset)
    // If resting: based on VALUE
    let doveContent = '🕊️';
    const isMirrored = <span style={{ transform: 'scaleX(-1)', display: 'inline-block' }}>🕊️</span>;

    if (dragOffset !== null) {
        if (dragOffset > 5) doveContent = isMirrored; // Moving Right -> Face Right
        else if (dragOffset < -5) doveContent = '🕊️'; // Moving Left -> Face Left
        else {
            // Neutral/Deadzone: Keep starting orientation
            if (value === 'left') doveContent = isMirrored;
            else if (value === 'right') doveContent = '🕊️';
            else doveContent = <span style={{ fontSize: '1.2rem' }}>🐥</span>; // Keep hatchling in deadzone
        }
    } else {
        // Resting
        if (value === 'left') doveContent = '🕊️'; // Ready to go Right? No, just stay facing Left (outwards/start)
        else if (value === 'right') doveContent = isMirrored; // Stay facing Right (outwards/end)
        else doveContent = <span style={{ fontSize: '1.2rem' }}>🐥</span>; // Center
    }

    return (
        <div>
            <div
                ref={trackRef}
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '48px',
                    boxSizing: 'border-box',
                    background: 'var(--color-bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    overflow: 'hidden',
                    userSelect: 'none',
                    touchAction: 'none',
                    WebkitUserSelect: 'none', // Safari extra safety
                    cursor: 'grab'
                }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerCancel}
                onLostPointerCapture={onLostPointerCapture}
                draggable="false"
                onDragStart={(e) => e.preventDefault()} // Prevent native drag (Firefox/Desktop)
            >
                {/* Thumb */}
                <div
                    ref={thumbRef}
                    style={{ ...style, touchAction: 'none' }}
                    draggable="false"
                    onDragStart={(e) => e.preventDefault()}
                >
                    {doveContent}
                </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px', marginTop: '4px', color: 'var(--color-text-secondary)', fontSize: '0.7rem' }}>
                <span>← Left</span>
                <span>Right →</span>
            </div>
            {/* Visual Debug Log - REMOVED */}
        </div>
    );
};



const RetentionSlider = ({ value, onChange }) => {

    const trackRef = React.useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragPct, setDragPct] = useState(0);

    // Generate discrete steps for precise control
    // 0: Delete on Read
    // Hours: 1h - 23h
    // Days: 1d - 6d
    // Weeks: 1w - 3w
    // Months: 1m - 12m (1y)
    // Forever
    const steps = React.useMemo(() => {
        const s = [{ val: '0d', label: '0 Hours', short: '0' }];

        // Hours (1-23)
        for (let i = 1; i < 24; i++) s.push({ val: `${i}h`, label: `${i} Hour${i > 1 ? 's' : ''}`, short: `${i}h` });

        // Days (1-6)
        for (let i = 1; i < 7; i++) s.push({ val: `${i}d`, label: `${i} Day${i > 1 ? 's' : ''}`, short: `${i}d` });

        // Weeks (1-3)
        for (let i = 1; i < 4; i++) s.push({ val: `${i}w`, label: `${i} Week${i > 1 ? 's' : ''}`, short: `${i}w` });

        // Months (1-12)
        for (let i = 1; i <= 12; i++) {
            const label = i === 12 ? '1 Year' : `${i} Month${i > 1 ? 's' : ''}`;
            s.push({ val: `${i}m`, label: label, short: i === 12 ? '1y' : `${i}m` });
        }

        s.push({ val: 'forever', label: 'Indefinitely', short: '∞' });
        return s;
    }, []);

    // Get step index from percentage
    const getIndexFromPct = (pct) => {
        return Math.round((pct / 100) * (steps.length - 1));
    };

    // Get percentage from value string
    const getPctFromValue = (v) => {
        if (!v) return 100; // default forever?
        // Normalization for legacy values if needed
        let match = v;
        if (v === '0') match = '0d';

        const index = steps.findIndex(s => s.val === match);
        if (index === -1) {
            // Fallback for custom values not in steps (e.g. 90d -> approx)
            if (v === 'forever') return 100;
            return 50; // default middle
        }
        return (index / (steps.length - 1)) * 100;
    };

    const currentStepIndex = Math.round((dragPct / 100) * (steps.length - 1));
    const currentStep = steps[currentStepIndex] || steps[steps.length - 1];

    // Initialize drag state
    React.useEffect(() => {
        if (!isDragging) {
            setDragPct(getPctFromValue(value));
        }
    }, [value, isDragging, steps]);

    const updateFromClientX = (clientX) => {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        let pct = ((clientX - rect.left) / rect.width) * 100;
        pct = Math.max(0, Math.min(100, pct));

        // Snap to steps immediately for responsive feel
        const rawIndex = (pct / 100) * (steps.length - 1);
        const snappedIndex = Math.round(rawIndex);
        const snappedPct = (snappedIndex / (steps.length - 1)) * 100;

        setDragPct(snappedPct);
    };

    const handleStart = (clientX) => {
        setIsDragging(true);
        updateFromClientX(clientX);
    };

    const handleMove = (clientX) => {
        if (!isDragging) return;
        updateFromClientX(clientX);
    };

    const handleEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);
        const idx = getIndexFromPct(dragPct);
        const step = steps[idx];
        if (step) onChange(step.val);
    };

    // Global listeners
    React.useEffect(() => {
        const onMouseMove = (e) => handleMove(e.clientX);
        const onMouseUp = () => handleEnd();
        const onTouchMove = (e) => handleMove(e.touches[0].clientX);
        const onTouchEnd = () => handleEnd();

        if (isDragging) {
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            document.addEventListener('touchmove', onTouchMove);
            document.addEventListener('touchend', onTouchEnd);
        }
        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('touchend', onTouchEnd);
        };
    }, [isDragging, dragPct]);

    // Info Message
    let infoMessage = `Messages are kept for ${currentStep.label}.`;
    if (currentStep.val === 'forever') infoMessage = 'Messages are kept indefinitely.';
    else if (currentStep.val === '0d') infoMessage = 'Messages will be deleted upon being read.';

    return (
        <div style={{ padding: '0.5rem 0' }}>
            {/* Value Display Box */}
            <div style={{
                textAlign: 'center',
                marginBottom: '0.5rem',
                padding: 'var(--space-3)',
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                minHeight: '60px',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
            }}>
                <span style={{
                    fontWeight: 600,
                    color: 'var(--color-primary)',
                    fontSize: currentStep.short === '∞' ? '2.2rem' : '1.5rem',
                    transition: 'all 0.1s'
                }}>
                    {currentStep.short === '∞' ? '∞' : currentStep.label}
                </span>
            </div>

            {/* Track Container */}
            <div style={{ padding: '0 12px' }}>
                <div
                    ref={trackRef}
                    onMouseDown={(e) => handleStart(e.clientX)}
                    onTouchStart={(e) => handleStart(e.touches[0].clientX)}
                    style={{
                        position: 'relative',
                        height: '56px', // Taller for ruler
                        cursor: 'pointer',
                        touchAction: 'none',
                    }}
                >
                    {/* Ruler Scale */}
                    <div style={{
                        position: 'absolute',
                        left: 0, right: 0,
                        bottom: 0,
                        height: '24px',
                        display: 'flex',
                        alignItems: 'flex-end',
                        pointerEvents: 'none',
                    }}>
                        {steps.map((step, i) => {
                            // Determine mark type
                            const isMajor = ['0d', '1h', '6h', '12h', '1d', '1w', '1m', '6m', '12m', 'forever'].includes(step.val);
                            // Include 12m (1y) in labels now
                            const isLabel = ['0d', '1d', '1w', '1m', '6m', '12m', 'forever'].includes(step.val);

                            // Don't show every single tick if too crowded? 
                            // 46 steps is a lot for small mobile. 
                            const showTick = i % 2 === 0 || isMajor;

                            // Custom transform for strict positioning of 1y and infinity
                            let labelStyle = {
                                position: 'absolute',
                                bottom: '17px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                fontSize: '0.65rem',
                                color: 'var(--color-text-secondary)',
                                whiteSpace: 'nowrap'
                            };

                            if (step.val === '12m') {
                                // Shift 1y label to the left to avoid overlap with infinity
                                labelStyle.transform = 'translateX(-120%)';
                            } else if (step.val === 'forever') {
                                // Shift infinity slightly right or keep centered but ensure spacing
                                labelStyle.transform = 'translateX(-20%)';
                            }

                            return (showTick && (
                                <div key={i} style={{
                                    position: 'absolute',
                                    left: `${(i / (steps.length - 1)) * 100}%`,
                                    bottom: 0,
                                    width: '1px',
                                    height: isMajor ? '12px' : '6px',
                                    background: isMajor ? 'var(--color-text-secondary)' : 'var(--color-text-tertiary)',
                                    opacity: isMajor ? 0.8 : 0.4,
                                    transform: 'translateX(-50%)'
                                }}>
                                    {isLabel && (
                                        <div style={labelStyle}>
                                            {step.short}
                                        </div>
                                    )}
                                </div>
                            ));
                        })}
                    </div>

                    {/* Track Line */}
                    <div style={{
                        position: 'absolute',
                        left: 0, right: 0,
                        top: '10px',
                        height: '6px',
                        background: 'var(--color-bg-tertiary)',
                        borderRadius: '3px',
                    }}>
                        {/* Fill */}
                        <div style={{
                            width: `${dragPct}%`,
                            height: '100%',
                            background: 'var(--color-primary)',
                            borderRadius: '3px'
                        }} />
                    </div>

                    {/* Handle */}
                    <div style={{
                        position: 'absolute',
                        left: `${dragPct}%`,
                        top: '1px', // Center on track
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'white',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                        transform: 'translateX(-50%)',
                        border: '2px solid var(--color-primary)',
                        zIndex: 10,
                        transition: isDragging ? 'none' : 'left 0.1s ease-out'
                    }} />
                </div>
            </div>
        </div>
    );
};

const SettingsPanel = ({ onClose }) => {
    const { t, language, setLanguage, availableLanguages } = useLanguage();
    const { user } = useAuth();

    // Status
    const status = getStatus(user?.trust_score, t);

    // Retention Policy
    const [retention, setRetention] = useState(() => localStorage.getItem('nestfinder_message_retention') || '1m');

    // Swipe Direction
    const [swipeDirection, setSwipeDirection] = useState(() => localStorage.getItem('nestfinder_swipe_direction') || 'both');

    const handleSwipeChange = (dir) => {
        setSwipeDirection(dir);
        localStorage.setItem('nestfinder_swipe_direction', dir);
        window.dispatchEvent(new Event('storage'));
    };

    // Swipe Enabled Toggle
    const [swipeEnabled, setSwipeEnabled] = useState(() => {
        try {
            const stored = localStorage.getItem('nestfinder_swipe_enabled');
            return stored !== 'false'; // Default true
        } catch (e) { return true; }
    });

    const toggleSwipeEnabled = () => {
        const newValue = !swipeEnabled;
        setSwipeEnabled(newValue);
        localStorage.setItem('nestfinder_swipe_enabled', newValue);
        window.dispatchEvent(new Event('storage'));
    };

    const handleRetentionChange = async (val) => {
        // Support both event and direct value
        const value = (val && val.target) ? val.target.value : val;

        setRetention(value);
        localStorage.setItem('nestfinder_message_retention', value);
        window.dispatchEvent(new Event('storage'));

        // Trigger prune
        if (value !== 'forever') {
            const now = new Date();
            const cutoff = new Date();

            if (value.endsWith('d')) {
                cutoff.setDate(now.getDate() - parseInt(value));
            } else if (value.endsWith('h')) { // New: Support for hours
                cutoff.setHours(now.getHours() - parseInt(value));
            } else if (value.endsWith('m')) {
                cutoff.setMonth(now.getMonth() - parseInt(value));
            } else if (value.endsWith('w')) { // New: Support for weeks
                cutoff.setDate(now.getDate() - (parseInt(value) * 7));
            } else if (value.endsWith('y')) {
                cutoff.setFullYear(now.getFullYear() - parseInt(value));
            } else if (value === '1m') { // Fallback for legacy
                cutoff.setMonth(now.getMonth() - 1);
            }
            // If value is 0d, cutoff is just now, which deletes everything read?
            // "Messages will be deleted upon being read." 
            // The prune argument is `before` date. So if cuttoff is NOW, anything before NOW is pruned.
            // If "Delete on Read" means instant, we probably rely on 'read' flag mainly, but prune takes a date.

            try {
                const isoCutoff = cutoff.toISOString();
                await Promise.all([
                    api.pruneNotifications(isoCutoff),
                    // api.pruneFeedback(isoCutoff) // logic might not exist yet, but existing code had it!!
                    // Wait, existing code HAD api.pruneFeedback(isoCutoff).
                    // I should keep it if valid.
                    api.pruneFeedback ? api.pruneFeedback(isoCutoff) : Promise.resolve()
                ]);
            } catch (e) {
                console.error('Prune failed', e);
            }
        }
    };

    const [popupEnabled, setPopupEnabled] = useState(() => {
        try {
            const stored = localStorage.getItem(NOTIFICATION_PREF_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                return parsed.realTime !== false;
            }
        } catch (e) { }
        return true;
    });
    const [showCopied, setShowCopied] = useState(false);

    const togglePopup = () => {
        const newValue = !popupEnabled;
        setPopupEnabled(newValue);
        localStorage.setItem(NOTIFICATION_PREF_KEY, JSON.stringify({ realTime: newValue }));
    };



    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(APP_URL);
            setShowCopied(true);
            setTimeout(() => setShowCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    const carouselRef = React.useRef(null);
    const sectionRef = React.useRef(null);
    const animationRef = React.useRef(null);
    const scrollOffsetRef = React.useRef(0);
    const velocityRef = React.useRef(0);
    const lastWheelTime = React.useRef(0);
    const autoSelectTimer = React.useRef(null);
    const wheelTimeoutRef = React.useRef(null); // Separate ref for wheel timeout

    // Animation constants
    const ITEM_HEIGHT = 68;
    const VISIBLE_ITEMS = 3;
    const PADDING = 12;
    const CONTAINER_HEIGHT = VISIBLE_ITEMS * ITEM_HEIGHT + PADDING * 2;
    const AUTO_SELECT_DELAY = 2000; // 2 seconds to auto-confirm

    // Force re-render trigger
    const [, forceRender] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(true); // Current language is confirmed

    const itemCount = availableLanguages.length;

    // Initialize scrollOffset to current language
    useEffect(() => {
        const idx = availableLanguages.findIndex(l => l.code === language);
        scrollOffsetRef.current = idx >= 0 ? idx : 0;
        forceRender(n => n + 1);
    }, []);

    // Center slot Y position
    const centerSlotY = PADDING + ITEM_HEIGHT;

    // Calculate Y position for each item based on scrollOffset
    const getItemY = (index) => {
        if (itemCount === 0) return 0;

        const scrollOffset = scrollOffsetRef.current;
        let offset = index - scrollOffset;

        while (offset > itemCount / 2) offset -= itemCount;
        while (offset < -itemCount / 2) offset += itemCount;

        return centerSlotY + (offset * ITEM_HEIGHT);
    };

    // Normalize offset to valid range [0, itemCount)
    const normalizeOffset = (offset) => {
        if (itemCount === 0) return 0;
        let normalized = offset % itemCount;
        if (normalized < 0) normalized += itemCount;
        return normalized;
    };

    // Start auto-select timer
    const startAutoSelectTimer = () => {
        if (autoSelectTimer.current) clearTimeout(autoSelectTimer.current);
        setIsConfirmed(false);

        autoSelectTimer.current = setTimeout(() => {
            const currentIndex = Math.round(normalizeOffset(scrollOffsetRef.current)) % itemCount;
            setLanguage(availableLanguages[currentIndex].code);
            setIsConfirmed(true);
        }, AUTO_SELECT_DELAY);
    };

    // Animate scrollOffset with momentum physics

    const animateWithMomentum = (initialVelocity) => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);

        let velocity = initialVelocity;
        const friction = 0.95; // Deceleration factor
        const minVelocity = 0.01;

        setIsAnimating(true);

        const animate = () => {
            velocity *= friction;
            scrollOffsetRef.current += velocity;
            forceRender(n => n + 1);

            if (Math.abs(velocity) > minVelocity) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                // Snap to nearest item
                const nearestIndex = Math.round(scrollOffsetRef.current);
                animateTo(nearestIndex, 300, () => {
                    startAutoSelectTimer();
                });
            }
        };

        animationRef.current = requestAnimationFrame(animate);
    };

    // Animate scrollOffset from current to target using rAF
    const animateTo = (targetOffset, duration, onComplete) => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);

        const startOffset = scrollOffsetRef.current;
        const startTime = performance.now();
        const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);

        setIsAnimating(true);

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;

            if (elapsed >= duration) {
                // Always snap to exact integer for clean centering
                scrollOffsetRef.current = Math.round(normalizeOffset(targetOffset));
                forceRender(n => n + 1);
                setIsAnimating(false);
                if (onComplete) onComplete();
                return;
            }

            const progress = easeOutQuart(elapsed / duration);
            scrollOffsetRef.current = startOffset + (targetOffset - startOffset) * progress;
            forceRender(n => n + 1);
            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);
    };

    // Watch for section visibility to trigger spin animation
    useEffect(() => {
        if (!sectionRef.current || hasAnimated || itemCount === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !hasAnimated) {
                    setHasAnimated(true);

                    const selectedIndex = availableLanguages.findIndex(l => l.code === language);
                    if (selectedIndex === -1) return;

                    // Roll UPWARDS through entire list TWICE before landing
                    const spinDistance = itemCount * 2;
                    scrollOffsetRef.current = selectedIndex - spinDistance; // Negative = roll up
                    forceRender(n => n + 1);

                    // Animate to selected index (longer duration for dramatic effect)
                    setTimeout(() => animateTo(selectedIndex, 2000), 50);
                }
            },
            { threshold: 1.0 } // Animation starts when section is fully visible
        );

        observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, [hasAnimated, itemCount, language, availableLanguages]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if (autoSelectTimer.current) clearTimeout(autoSelectTimer.current);
            if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);
        };
    }, []);

    // Handle wheel scroll with momentum
    useEffect(() => {
        const el = carouselRef.current;
        if (!el) return;

        const handleWheel = (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Cancel any existing animation
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if (autoSelectTimer.current) clearTimeout(autoSelectTimer.current);
            setIsConfirmed(false);

            const now = performance.now();
            const timeDelta = now - lastWheelTime.current;
            lastWheelTime.current = now;

            // Calculate velocity based on wheel delta and time
            const scrollDelta = e.deltaY / ITEM_HEIGHT; // Normalize to items

            // Accumulate velocity (smoother momentum)
            if (timeDelta < 100) {
                velocityRef.current += scrollDelta * 0.4; // Accumulate smoothly
            } else {
                velocityRef.current = scrollDelta * 0.6; // Faster initial response
            }

            // Higher velocity clamp for more fluid movement
            velocityRef.current = Math.max(-5, Math.min(5, velocityRef.current));

            // Apply immediate movement
            scrollOffsetRef.current += velocityRef.current;
            forceRender(n => n + 1);
            setIsAnimating(true);

            // Start deceleration after a pause in scrolling
            if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);
            wheelTimeoutRef.current = setTimeout(() => {
                if (Math.abs(velocityRef.current) > 0.1) {
                    animateWithMomentum(velocityRef.current * 0.5);
                } else {
                    // Snap to nearest integer
                    const nearestIndex = Math.round(scrollOffsetRef.current);
                    animateTo(nearestIndex, 200, () => {
                        startAutoSelectTimer();
                    });
                }
                velocityRef.current = 0;
            }, 150);
        };

        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
    }, [itemCount]);

    // Touch scroll with momentum
    const touchStartY = React.useRef(0);
    const touchStartTime = React.useRef(0);

    const handleTouchStart = (e) => {
        touchStartY.current = e.touches[0].clientY;
        touchStartTime.current = performance.now();
        velocityRef.current = 0;
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        if (autoSelectTimer.current) clearTimeout(autoSelectTimer.current);
        setIsConfirmed(false);
    };

    const handleTouchMove = (e) => {
        e.preventDefault();
        const currentY = e.touches[0].clientY;
        const deltaY = touchStartY.current - currentY;
        const deltaItems = deltaY / ITEM_HEIGHT;

        scrollOffsetRef.current += deltaItems;
        velocityRef.current = deltaItems;
        touchStartY.current = currentY;
        forceRender(n => n + 1);
    };

    const handleTouchEnd = () => {
        // Always snap to nearest item, but use momentum if velocity is high enough
        const nearestIndex = Math.round(scrollOffsetRef.current);

        if (Math.abs(velocityRef.current) > 0.3) {
            // High velocity: apply momentum then snap
            animateWithMomentum(velocityRef.current * 2);
        } else {
            // Low/no velocity: immediately snap to nearest
            animateTo(nearestIndex, 200, () => {
                startAutoSelectTimer();
            });
        }
        velocityRef.current = 0;
    };

    // Click to select an item (immediate confirmation)
    const handleItemClick = (index) => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        if (autoSelectTimer.current) clearTimeout(autoSelectTimer.current);

        animateTo(index, 300, () => {
            setLanguage(availableLanguages[index].code);
            setIsConfirmed(true);
        });
    };

    // Get the currently centered item index
    const centeredItemIndex = Math.round(normalizeOffset(scrollOffsetRef.current)) % itemCount;

    return (
        <div className="card" style={{ height: '100%', maxHeight: '100%', overflowY: 'auto' }}>
            <div className="card-header flex-between items-center">
                <h3 className="card-title">Settings</h3>
                <button
                    onClick={onClose}
                    style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: 0, lineHeight: 1 }}
                >
                    &times;
                </button>
            </div>

            <div className="card-body">

                {/* Share App with QR Code - FIRST SECTION */}
                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                    <label className="form-label">{t('settings.shareApp')}</label>


                    {/* QR Code Display */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '0.5rem',
                        background: 'white',
                        borderRadius: 'var(--radius-md)',
                        width: '250px',
                        height: '250px',
                        margin: '0 auto var(--space-3) auto'
                    }}>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <QRCodeCanvas
                                value={APP_URL}
                                size={230}
                                level="H"
                                bgColor="white"
                                fgColor="#1e293b"
                                style={{ display: 'block' }}
                            />
                            {/* Center Emoji Overlay */}
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                background: 'white',
                                borderRadius: '50%',
                                width: '80px',
                                height: '80px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '50px'
                            }}>
                                🪹
                            </div>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', margin: '0 auto var(--space-3)', color: 'var(--color-text-secondary)', fontSize: '0.9rem', width: '250px' }}>
                        {t('settings.spreadWarmth') || 'Spread the warmth! 🐣'}
                    </div>

                    {/* Copy Link Button */}
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <div
                            role="button"
                            className="btn btn-secondary"
                            onClick={handleCopyLink}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1.5rem',
                                minWidth: '250px',
                                background: showCopied ? 'var(--color-confirmed)' : 'var(--color-primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                transition: 'all 0.3s',
                                cursor: 'pointer'
                            }}
                        >
                            <span style={{ fontSize: '1.2rem' }}>{showCopied ? '✓' : '🔗'}</span>
                            <span style={{ fontWeight: 600 }}>
                                {showCopied ? t('settings.linkCopied') : t('settings.shareLink')}
                            </span>
                        </div>
                    </div>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', margin: 'var(--space-4) 0' }} />

                {/* Your Profile Section - Combined User + Recovery */}
                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                    <label className="form-label">{t('settings.yourProfile') || 'Your Profile'}</label>

                    {/* User Status Card */}
                    <div style={{
                        background: `linear-gradient(135deg, ${status.color}20, transparent)`,
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-4)',
                        marginBottom: 'var(--space-3)',
                        border: `1px solid ${status.color}40`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)'
                    }}>
                        <div style={{ fontSize: '2.5rem' }}>{status.icon}</div>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: 'var(--font-size-lg)' }}>
                                {user?.nickname || t('settings.anonymousUser') || 'User'}
                            </div>
                            <div style={{ color: status.color, fontWeight: 500 }}>
                                {status.name}
                            </div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                                {t('settings.trustScore') || 'Trust Score'}: {user?.trust_score || 0}
                            </div>
                        </div>
                    </div>

                    {/* Recovery Key */}
                    <RecoveryKeySection t={t} />

                    {/* Restore Account from Key */}
                    <RestoreAccountSection t={t} />
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', margin: 'var(--space-4) 0' }} />

                {/* Messages Section - REPOSITIONED */}
                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                    <label className="form-label">{t('settings.messages') || 'Messages'}</label>

                    {/* Popup Notifications Box */}
                    {/* Popup Notifications Box */}
                    <div style={{
                        padding: 'var(--space-3)',
                        background: 'var(--color-bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        marginBottom: 'var(--space-2)'
                    }}>
                        <div
                            onClick={togglePopup}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer'
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: 500, marginBottom: 'var(--space-2)' }}>🔔 {t('settings.popupMessages') || 'Real-time Popups'}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                    {t('settings.popupDescription') || 'Show messages immediately as they arrive'}
                                </div>
                            </div>
                            <div
                                style={{
                                    width: '44px',
                                    height: '24px',
                                    borderRadius: '12px',
                                    background: popupEnabled ? 'var(--color-primary)' : 'var(--color-border)',
                                    position: 'relative',
                                    transition: 'background 0.2s'
                                }}
                            >
                                <div style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    background: 'white',
                                    position: 'absolute',
                                    top: '2px',
                                    left: popupEnabled ? '22px' : '2px',
                                    transition: 'left 0.2s',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                }} />
                            </div>
                        </div>
                        <div style={{
                            padding: 'var(--space-2)',
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--color-primary)',
                            fontSize: '0.85rem',
                            textAlign: 'center',
                            marginTop: '0.75rem',
                            animation: 'fadeIn 0.3s ease-out'
                        }}>
                            {popupEnabled ? (t('settings.popupEnabledInfo') || 'Messages will be shown as popups when received.') : (t('settings.popupDisabledInfo') || 'Messages will not be shown when received but saved in your inbox.')}
                        </div>
                    </div>

                    {/* Retention Period Box */}
                    <div style={{
                        padding: 'var(--space-3)',
                        background: 'var(--color-bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        marginBottom: 'var(--space-2)'
                    }}>
                        <div style={{ marginBottom: 'var(--space-2)' }}>
                            <div style={{ fontWeight: 500, marginBottom: 'var(--space-2)' }}>⏱️ {t('settings.messageRetention') || 'Retention Period'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                {t('settings.retention.desc') || 'Auto-delete messages older than selected period.'}
                            </div>
                        </div>

                        <div style={{
                            padding: '1rem',
                            paddingBottom: '0.25rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg-tertiary)'
                        }}>
                            <RetentionSlider
                                value={retention}
                                onChange={handleRetentionChange}
                            />
                        </div>
                        <div style={{
                            padding: 'var(--space-2)',
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--color-primary)',
                            fontSize: '0.85rem',
                            textAlign: 'center',
                            marginTop: '0.75rem',
                            animation: 'fadeIn 0.3s ease-out'
                        }}>
                            {(() => {
                                if (retention === 'forever') return <span>Messages are kept <b>Indefinitely</b>.</span>;
                                if (retention === '0d') return <span>Messages will be deleted upon being <b>Read</b>.</span>;
                                const val = parseInt(retention);
                                const unit = retention.slice(-1);
                                const units = { d: 'Day', w: 'Week', m: 'Month', y: 'Year', h: 'Hour' };
                                const fullUnit = units[unit] || '';
                                const label = `${val} ${fullUnit}${val > 1 ? 's' : ''}`;
                                return <span>Messages older than <b>{label}</b> will be deleted.</span>;
                            })()}
                        </div>
                    </div>

                    {/* Swipe Direction Box */}
                    {/* Delete Settings Box */}
                    <div style={{
                        padding: 'var(--space-3)',
                        background: 'var(--color-bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)'
                    }}>
                        {/* Header converted to match other sections */}
                        <div style={{ marginBottom: '0.5rem' }}>
                            <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>🔥 {t('settings.deleteActions') || 'Delete Messages'}</div>
                        </div>

                        {/* Swipe Direction Block */}
                        <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-text-secondary)',
                            marginBottom: '0.5rem'
                        }}>
                            {t('settings.tapToSelect') || 'Tap to select the swipe direction'}
                        </div>

                        <div style={{
                            transition: 'opacity 0.2s',
                            boxSizing: 'border-box'
                        }}>
                            <div style={{ width: '100%' }}>
                                <DoveToggle
                                    value={swipeDirection}
                                    onChange={handleSwipeChange}
                                />
                            </div>
                        </div>

                        <div style={{
                            padding: 'var(--space-2)',
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--color-primary)',
                            fontSize: '0.85rem',
                            textAlign: 'center',
                            marginTop: '0.75rem',
                            animation: 'fadeIn 0.3s ease-out'
                        }}>
                            {swipeDirection === 'left' ? (
                                <span>Swipe <b>left</b> over a message to delete it</span>
                            ) : swipeDirection === 'right' ? (
                                <span>Swipe <b>right</b> over a message to delete it</span>
                            ) : (
                                <span>Swipe <b>left</b> or <b>right</b> over a message to delete it</span>
                            )}
                        </div>

                        {/* Tagline */}
                        <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-text-secondary)',
                            marginBottom: '0.5rem',
                            marginTop: '1.5rem'
                        }}>
                            {t('settings.deleteSettingDesc') || 'Select how you would like to delete a message'}
                        </div>

                        {/* Safe Delete Toggle */}
                        <div
                            onClick={toggleSwipeEnabled}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                marginBottom: '0.5rem',
                                padding: '0.5rem',
                                background: 'var(--color-bg-tertiary)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                height: '42px',
                                boxSizing: 'border-box'
                            }}
                        >
                            <div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{t('settings.safeDelete') || 'Safe Delete'}</div>
                            </div>
                            <div
                                style={{
                                    width: '44px',
                                    height: '24px',
                                    borderRadius: '12px',
                                    background: swipeEnabled ? 'var(--color-primary)' : 'var(--color-border)',
                                    position: 'relative',
                                    transition: 'background 0.2s'
                                }}
                            >
                                <div style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    background: 'white',
                                    position: 'absolute',
                                    top: '2px',
                                    left: swipeEnabled ? '22px' : '2px',
                                    transition: 'left 0.2s',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                }} />
                            </div>
                        </div>

                        <div style={{
                            padding: 'var(--space-2)',
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--color-primary)',
                            fontSize: '0.85rem',
                            textAlign: 'center',
                            marginTop: '0.75rem',
                            animation: 'fadeIn 0.3s ease-out'
                        }}>
                            {swipeEnabled ? (
                                <span>A <span style={{
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontWeight: 600,
                                    fontSize: '0.75em',
                                    verticalAlign: 'middle',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                    display: 'inline-block',
                                    lineHeight: '1.2',
                                    margin: '0 2px'
                                }}>DELETE</span> button will appear upon swiping over a message to delete it.</span>
                            ) : (
                                <span>You can now delete a message just by swiping over it.</span>
                            )}
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--color-border)', margin: 'var(--space-4) 0' }} />

                    {/* Lite Mode Toggle */}
                    <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                        <label className="form-label">{t('settings.performance') || 'Performance'}</label>
                        <div
                            onClick={() => {
                                const current = localStorage.getItem('nestfinder_lite_mode') === 'true';
                                localStorage.setItem('nestfinder_lite_mode', (!current).toString());
                                window.location.reload(); // Reload to apply changes
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: 'var(--space-3)',
                                background: 'var(--color-bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                border: '1px solid var(--color-border)'
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: 500 }}>🪶 {t('settings.liteMode') || 'Lite Mode'}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                    {t('settings.liteModeDescription') || 'Reduce animations for smoother performance'}
                                </div>
                            </div>
                            <div
                                style={{
                                    width: '44px',
                                    height: '24px',
                                    borderRadius: '12px',
                                    background: localStorage.getItem('nestfinder_lite_mode') === 'true' ? 'var(--color-primary)' : 'var(--color-border)',
                                    position: 'relative',
                                    transition: 'background 0.2s'
                                }}
                            >
                                <div style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    background: 'white',
                                    position: 'absolute',
                                    top: '2px',
                                    left: localStorage.getItem('nestfinder_lite_mode') === 'true' ? '22px' : '2px',
                                    transition: 'left 0.2s',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                }} />
                            </div>
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--color-border)', margin: 'var(--space-4) 0' }} />

                    {/* Language Selection */}
                    <div className="form-group" ref={sectionRef}>
                        <label className="form-label">{t('profile.language')}</label>
                        {/* Carousel Guidance */}
                        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                            {t('settings.scrollInstruction') || '🌍 Scroll + Tap or wait 2s to confirm'}
                        </div>

                        <div
                            ref={carouselRef}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            style={{
                                height: `${CONTAINER_HEIGHT - 4}px`, // Cropped top margin only
                                overflow: 'hidden',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(51, 65, 85, 0.5)',
                                boxShadow: 'inset 0 10px 20px -10px rgba(0,0,0,0.3), inset 0 -10px 20px -10px rgba(0,0,0,0.3)',
                                position: 'relative',
                                cursor: 'ns-resize',
                                touchAction: 'none'
                            }}
                        >
                            {/* Fixed center indicator - blue border always in middle */}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: `${centerSlotY}px`,
                                    left: '8px',
                                    right: '8px',
                                    height: `${ITEM_HEIGHT - 8}px`,
                                    border: '2px solid var(--color-primary)',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'var(--color-primary-light)',
                                    pointerEvents: 'none',
                                    zIndex: 15
                                }}
                            />

                            {/* Items with absolute positioning */}
                            {availableLanguages.map((lang, index) => {
                                const yPos = getItemY(index);
                                // Only render if in or near visible area
                                const isVisible = yPos > -ITEM_HEIGHT && yPos < CONTAINER_HEIGHT + ITEM_HEIGHT;
                                if (!isVisible) return null;

                                // Visual check: is this item in the center slot
                                const isInCenter = Math.abs(yPos - centerSlotY) < 5;
                                // Checkmark shows when confirmed (after 2s or tap)
                                const showCheckmark = isConfirmed && index === centeredItemIndex;

                                return (
                                    <div
                                        key={lang.code}
                                        onClick={() => handleItemClick(index)}
                                        style={{
                                            position: 'absolute',
                                            left: '8px',
                                            right: '8px',
                                            top: `${yPos - 4}px`, // Shift up to align with tighter container
                                            zIndex: isInCenter ? 10 : 1,
                                            opacity: isInCenter ? 1 : 0.5,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--space-3)',
                                                padding: 'var(--space-3)',
                                                background: 'rgba(15, 23, 42, 0.95)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: 'var(--radius-md)',
                                                color: 'var(--color-text)',
                                                height: `${ITEM_HEIGHT - 8}px`,
                                                marginBottom: '4px',
                                                marginTop: '4px',
                                                boxSizing: 'border-box'
                                            }}
                                        >
                                            <span style={{ fontSize: '1.5rem' }}>{lang.flag}</span>
                                            <div style={{ textAlign: 'left', flex: 1 }}>
                                                <div style={{ fontWeight: isInCenter ? 600 : 400 }}>
                                                    {lang.nativeName}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                                    {lang.name}
                                                </div>
                                            </div>
                                            {showCheckmark && (
                                                <span style={{ color: 'var(--color-primary)', marginRight: '22px' }}>✓</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
            );
};

            export default SettingsPanel;
