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
    const animationRef = React.useRef(null);
    const scrollOffsetRef = React.useRef(0); // Use ref for smooth animation

    // Animation constants
    const ITEM_HEIGHT = 68;
    const VISIBLE_ITEMS = 3;
    const PADDING = 12;
    const CONTAINER_HEIGHT = VISIBLE_ITEMS * ITEM_HEIGHT + PADDING * 2;

    // Force re-render trigger
    const [, forceRender] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

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

        // Calculate visual offset from center
        let offset = index - scrollOffset;

        // Wrap around for infinite barrel effect
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
                scrollOffsetRef.current = normalizeOffset(targetOffset);
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

                    // Start 4 items "later" and roll backward to selected
                    scrollOffsetRef.current = selectedIndex + 4;
                    forceRender(n => n + 1);

                    // Animate down to selected index
                    setTimeout(() => animateTo(selectedIndex, 1000), 50);
                }
            },
            { threshold: 0.5 }
        );

        observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, [hasAnimated, itemCount, language, availableLanguages]);

    // Cleanup animation on unmount
    useEffect(() => {
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, []);

    // Handle wheel scroll  
    useEffect(() => {
        const el = carouselRef.current;
        if (!el) return;

        const handleWheel = (e) => {
            if (isAnimating) return;
            e.preventDefault();
            e.stopPropagation();

            const direction = e.deltaY > 0 ? 1 : -1;
            animateTo(scrollOffsetRef.current + direction, 200);
        };

        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
    }, [isAnimating]);

    // Touch scroll support
    const touchStartY = React.useRef(0);
    const handleTouchStart = (e) => {
        touchStartY.current = e.touches[0].clientY;
    };
    const handleTouchMove = (e) => {
        if (isAnimating) return;
        e.preventDefault();
        const deltaY = touchStartY.current - e.touches[0].clientY;
        if (Math.abs(deltaY) > 30) {
            const direction = deltaY > 0 ? 1 : -1;
            animateTo(scrollOffsetRef.current + direction, 200);
            touchStartY.current = e.touches[0].clientY;
        }
    };

    // Click to select an item
    const handleItemClick = (index) => {
        if (isAnimating) return;
        animateTo(index, 300, () => {
            setLanguage(availableLanguages[index].code);
        });
    };

    // Get the currently centered item index (for checkmark)
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
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        style={{
                            height: `${CONTAINER_HEIGHT}px`,
                            overflow: 'hidden',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            background: 'rgba(0,0,0,0.02)',
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
                                height: `${ITEM_HEIGHT}px`,
                                border: '2px solid var(--color-primary)',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--color-primary-light)',
                                pointerEvents: 'none',
                                zIndex: 5
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
                            // Checkmark only shows when animation is complete and this is the selected item
                            const showCheckmark = !isAnimating && index === centeredItemIndex;

                            return (
                                <div
                                    key={lang.code}
                                    onClick={() => handleItemClick(index)}
                                    style={{
                                        position: 'absolute',
                                        left: '8px',
                                        right: '8px',
                                        top: `${yPos}px`,
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
                                            background: 'transparent',
                                            borderRadius: 'var(--radius-md)',
                                            color: 'var(--color-text)',
                                            height: `${ITEM_HEIGHT}px`,
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
