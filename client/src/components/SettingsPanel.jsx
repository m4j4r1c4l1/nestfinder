import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { QRCodeCanvas } from 'qrcode.react';

const NOTIFICATION_PREF_KEY = 'nestfinder_notify_settings';
const APP_URL = 'https://m4j4r1c4l1.github.io/nestfinder';

const SettingsPanel = ({ onClose }) => {
    const { t, language, setLanguage, availableLanguages } = useLanguage();
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

    // Animation constants
    const ITEM_HEIGHT = 68; // 15% reduction from 80px
    const VISIBLE_ITEMS = 3; // Show exactly 3 items
    const SPIN_ITEMS = 4; // Roll past 4 items
    const CONTAINER_HEIGHT = VISIBLE_ITEMS * ITEM_HEIGHT;

    // Virtual position tracks which item is CENTERED (0 = first item centered)
    const [virtualPosition, setVirtualPosition] = useState(() => {
        const idx = availableLanguages.findIndex(l => l.code === language);
        return idx >= 0 ? idx : 0;
    });
    const [hasAnimated, setHasAnimated] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    const itemCount = availableLanguages.length;

    // Calculate Y position for each item (centered layout)
    // virtualPosition = index of item that should be in CENTER
    const getItemY = (index) => {
        if (itemCount === 0) return 0;

        // Offset from center: how many positions away from current center
        let offset = index - virtualPosition;

        // Wrap around for infinite barrel effect
        while (offset < -itemCount / 2) offset += itemCount;
        while (offset > itemCount / 2) offset -= itemCount;

        // Convert to pixels (0 = center of container)
        // Center position is at CONTAINER_HEIGHT/2 - ITEM_HEIGHT/2
        const centerY = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2;
        return centerY + (offset * ITEM_HEIGHT);
    };

    // Watch for section visibility to trigger animation
    useEffect(() => {
        if (!sectionRef.current || hasAnimated || itemCount === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !hasAnimated) {
                    // Start animation when visible
                    setHasAnimated(true);
                    setIsAnimating(true);

                    const selectedIndex = availableLanguages.findIndex(l => l.code === language);
                    if (selectedIndex === -1) {
                        setIsAnimating(false);
                        return;
                    }

                    // Start 4 items before target
                    const startPos = selectedIndex - SPIN_ITEMS;
                    const targetPos = selectedIndex;

                    setVirtualPosition(startPos);

                    const duration = 900;
                    const startTime = performance.now();
                    const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);

                    const animate = (time) => {
                        const elapsed = time - startTime;
                        if (elapsed >= duration) {
                            setVirtualPosition(targetPos);
                            setIsAnimating(false);
                            return;
                        }

                        const progress = easeOutCubic(elapsed / duration);
                        setVirtualPosition(startPos + (targetPos - startPos) * progress);
                        requestAnimationFrame(animate);
                    };

                    requestAnimationFrame(animate);
                }
            },
            { threshold: 0.5 }
        );

        observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, [hasAnimated, itemCount, language, availableLanguages]);

    // Handle user scrolling (infinite barrel after animation)
    const handleWheel = (e) => {
        if (isAnimating) return;
        e.preventDefault();

        const delta = e.deltaY > 0 ? 0.15 : -0.15; // Smooth scroll
        setVirtualPosition(prev => {
            let newPos = prev + delta;
            // Wrap around
            if (newPos < 0) newPos += itemCount;
            if (newPos >= itemCount) newPos -= itemCount;
            return newPos;
        });
    };

    // Snap to nearest item on scroll end
    const handleScrollEnd = () => {
        if (isAnimating) return;
        const nearest = Math.round(virtualPosition) % itemCount;
        setVirtualPosition(nearest < 0 ? nearest + itemCount : nearest);
    };



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
                {/* Share App with QR Code */}
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
                        Spread the warmth! 🐣
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

                {/* Notification Settings */}
                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                    <label className="form-label">{t('settings.notifications')}</label>
                    <div
                        onClick={togglePopup}
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
                            <div style={{ fontWeight: 500 }}>{t('settings.popupMessages')}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                {t('settings.popupDescription')}
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
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', margin: 'var(--space-4) 0' }} />

                {/* Language Selection */}
                <div className="form-group" ref={sectionRef}>
                    <label className="form-label">{t('profile.language')}</label>
                    {/* Carousel Guidance */}
                    <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                        ↕️ Scroll to select language
                    </div>

                    <div
                        ref={carouselRef}
                        onWheel={handleWheel}
                        onMouseUp={handleScrollEnd}
                        onTouchEnd={handleScrollEnd}
                        style={{
                            height: `${CONTAINER_HEIGHT}px`,
                            overflow: 'hidden',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            background: 'rgba(0,0,0,0.02)',
                            boxShadow: 'inset 0 10px 20px -10px rgba(0,0,0,0.3), inset 0 -10px 20px -10px rgba(0,0,0,0.3)',
                            position: 'relative',
                            cursor: 'ns-resize'
                        }}
                    >
                        {/* Barrel items - always absolute positioned */}
                        {availableLanguages.map((lang, index) => {
                            const yPos = getItemY(index);
                            // Only render if item is in or near visible area
                            const isVisible = yPos > -ITEM_HEIGHT && yPos < CONTAINER_HEIGHT + ITEM_HEIGHT;

                            if (!isVisible) return null;

                            const isCenter = Math.abs(yPos - (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2) < ITEM_HEIGHT / 2;

                            return (
                                <div
                                    key={lang.code}
                                    onClick={() => {
                                        if (!isAnimating) {
                                            setVirtualPosition(index);
                                            setLanguage(lang.code);
                                        }
                                    }}
                                    style={{
                                        position: 'absolute',
                                        left: '8px',
                                        right: '8px',
                                        top: `${yPos}px`,
                                        transition: isAnimating ? 'none' : 'top 0.15s ease-out',
                                        zIndex: isCenter ? 10 : 1,
                                        opacity: isCenter ? 1 : 0.6,
                                        transform: isCenter ? 'scale(1.02)' : 'scale(0.98)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--space-3)',
                                            padding: 'var(--space-3)',
                                            background: isCenter
                                                ? 'var(--color-primary-light)'
                                                : 'var(--color-bg-secondary)',
                                            border: isCenter
                                                ? '2px solid var(--color-primary)'
                                                : '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-md)',
                                            color: 'var(--color-text)',
                                            height: `${ITEM_HEIGHT}px`,
                                            boxSizing: 'border-box',
                                            transition: 'all 0.15s ease-out'
                                        }}
                                    >
                                        <span style={{ fontSize: '1.5rem' }}>{lang.flag}</span>
                                        <div style={{ textAlign: 'left', flex: 1 }}>
                                            <div style={{ fontWeight: isCenter ? 600 : 400 }}>
                                                {lang.nativeName}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                                {lang.name}
                                            </div>
                                        </div>
                                        {isCenter && (
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
