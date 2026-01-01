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
    const [animationOffset, setAnimationOffset] = useState(0);
    const [isAnimating, setIsAnimating] = useState(true);

    // Animation constants
    const ITEM_HEIGHT = 68; // 15% reduction from 80px
    const SPIN_ITEMS = 4; // How many items to "roll" past

    // Slot Machine Spin Animation on Mount
    useEffect(() => {
        if (!carouselRef.current || availableLanguages.length === 0) return;

        const selectedIndex = availableLanguages.findIndex(l => l.code === language);
        if (selectedIndex === -1) return;

        // Calculate total distance to travel (4 items worth)
        const totalDistance = SPIN_ITEMS * ITEM_HEIGHT;

        const duration = 900; // Under 1s
        const startTime = performance.now();
        const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);

        const animate = (time) => {
            const elapsed = time - startTime;
            if (elapsed >= duration) {
                setAnimationOffset(0);
                setIsAnimating(false);
                // Scroll to show selected item
                if (carouselRef.current) {
                    carouselRef.current.scrollTop = selectedIndex * ITEM_HEIGHT;
                }
                return;
            }

            // Progress from 0 to 1, with easing
            const progress = easeOutCubic(elapsed / duration);
            // Start with negative offset (items shifted up), animate to 0
            const currentOffset = totalDistance * (1 - progress);
            setAnimationOffset(-currentOffset);

            requestAnimationFrame(animate);
        };

        // Start with items shifted
        setAnimationOffset(-totalDistance);
        requestAnimationFrame(animate);
    }, []); // Run on mount



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
                <div className="form-group">
                    <label className="form-label">{t('profile.language')}</label>
                    {/* Carousel Guidance */}
                    <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                        ↕️ Scroll to view all languages
                    </div>

                    <div
                        ref={carouselRef}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--space-2)',
                            maxHeight: '220px',
                            overflowY: isAnimating ? 'hidden' : 'auto', // Hide during animation
                            scrollSnapType: isAnimating ? 'none' : 'y mandatory',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            padding: 'var(--space-2)',
                            background: 'rgba(0,0,0,0.02)',
                            // Slot Machine Depth
                            boxShadow: 'inset 0 10px 20px -10px rgba(0,0,0,0.3), inset 0 -10px 20px -10px rgba(0,0,0,0.3)',
                            position: 'relative'
                        }}
                    >
                        {/* Inner wrapper for transform animation */}
                        <div style={{
                            transform: `translateY(${animationOffset}px)`,
                            transition: isAnimating ? 'none' : 'transform 0.1s',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--space-2)'
                        }}>
                            {availableLanguages.map((lang) => (
                                <button
                                    type="button"
                                    key={lang.code}
                                    onClick={() => setLanguage(lang.code)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-3)',
                                        padding: 'var(--space-3)',
                                        background: language === lang.code
                                            ? 'var(--color-primary-light)'
                                            : 'var(--color-bg-secondary)',
                                        border: language === lang.code
                                            ? '2px solid var(--color-primary)'
                                            : '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer',
                                        transition: 'all var(--transition-fast)',
                                        color: 'var(--color-text)',
                                        flexShrink: 0,
                                        scrollSnapAlign: 'start',
                                        minHeight: `${ITEM_HEIGHT}px`,
                                        height: `${ITEM_HEIGHT}px`
                                    }}
                                >
                                    <span style={{ fontSize: '1.5rem' }}>{lang.flag}</span>
                                    <div style={{ textAlign: 'left', flex: 1 }}>
                                        <div style={{ fontWeight: language === lang.code ? 600 : 400 }}>
                                            {lang.nativeName}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                            {lang.name}
                                        </div>
                                    </div>
                                    {language === lang.code && (
                                        <span style={{ color: 'var(--color-primary)' }}>✓</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;
