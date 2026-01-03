import React, { useState, useEffect } from 'react';
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
    const [recoveryKey, setRecoveryKey] = useState(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showKey, setShowKey] = useState(true);
    const [keyVisible, setKeyVisible] = useState(true);
    const [fadeOpacity, setFadeOpacity] = useState(1);

    // Load recovery key from session storage on mount (persists during current session only)
    useEffect(() => {
        const sessionKey = sessionStorage.getItem('nestfinder_recovery_key_temp');
        if (sessionKey) {
            setRecoveryKey(sessionKey);
            // If loading from session, start hidden
            setKeyVisible(false);
            setFadeOpacity(0);
        }
    }, []);

    // Auto-fade effect after 5 seconds when key is generated or shown
    useEffect(() => {
        if (recoveryKey && keyVisible && fadeOpacity === 1) {
            const fadeTimer = setTimeout(() => {
                // Start fading
                const fadeDuration = 1000; // 1 second fade
                const steps = 20;
                const stepDuration = fadeDuration / steps;
                let currentStep = 0;

                const fadeInterval = setInterval(() => {
                    currentStep++;
                    const newOpacity = 1 - (currentStep / steps);
                    setFadeOpacity(newOpacity);

                    if (currentStep >= steps) {
                        clearInterval(fadeInterval);
                        setKeyVisible(false);
                        setShowKey(false);
                    }
                }, stepDuration);
            }, 5000); // 5 second delay before fade starts

            return () => clearTimeout(fadeTimer);
        }
    }, [recoveryKey, keyVisible, fadeOpacity]);

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

            // Try to auto-copy to clipboard (may fail due to browser security after async)
            try {
                await navigator.clipboard.writeText(result.recoveryKey);
                setCopied(true);
                setTimeout(() => setCopied(false), 3000);
            } catch (clipboardErr) {
                // Clipboard failed (expected in some browsers after async), user can manually copy
                console.warn('Auto-copy to clipboard failed:', clipboardErr.message);
            }
        } catch (err) {
            console.error('Failed to generate recovery key:', err);
            alert(`Failed to generate recovery key: ${err.message}\n\nTip: Try logging out and back in, or refresh the page.`);
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
            setTimeout(() => setCopied(false), 2000);
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
                        {showKey ? '🙈' : '🙉'}
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
                            color: 'var(--color-primary)',
                            marginBottom: 'var(--space-2)',
                            opacity: fadeOpacity,
                            transition: 'opacity 0.1s ease-out'
                        }}>
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
            )}
        </div>
    );
};




const SettingsPanel = ({ onClose }) => {
    const { t, language, setLanguage, availableLanguages } = useLanguage();
    const { user } = useAuth();

    // Status
    const status = getStatus(user?.trust_score, t);

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
        <div className="card">
            <div className="card-header flex-between items-center">
                <h3 className="card-title">{t('nav.settings')}</h3>
                <button
                    type="button"
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
                        padding: '0.5rem',
                        background: 'white',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--space-3)',
                        width: '250px',
                        height: '250px',
                        margin: '0 auto var(--space-3) auto',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
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
                                            <span style={{ color: 'var(--color-primary)' }}>✓</span>
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
