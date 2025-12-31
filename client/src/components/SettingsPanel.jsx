import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { QRCodeSVG } from 'qrcode.react';

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

    const togglePopup = () => {
        const newValue = !popupEnabled;
        setPopupEnabled(newValue);
        localStorage.setItem(NOTIFICATION_PREF_KEY, JSON.stringify({ realTime: newValue }));
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'NestFinder',
                    text: t('welcome.subtitle'),
                    url: APP_URL
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Error sharing:', err);
                    navigator.clipboard.writeText(APP_URL);
                }
            }
        } else {
            navigator.clipboard.writeText(APP_URL);
        }
    };

    return (
        <div className="card">
            <div className="card-header flex-between items-center">
                <h3 className="card-title">{t('nav.settings')}</h3>
                <button
                    onClick={onClose}
                    style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: 0, lineHeight: 1 }}
                >
                    &times;
                </button>
            </div>
            <div className="card-body">
                {/* Share App - First section */}
                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                    <label className="form-label">{t('settings.shareApp')}</label>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: 'var(--space-4)',
                        background: 'var(--color-bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        gap: 'var(--space-3)'
                    }}>
                        <div style={{
                            padding: '0.75rem',
                            background: 'white',
                            borderRadius: 'var(--radius-md)',
                            position: 'relative'
                        }}>
                            <QRCodeSVG
                                value={APP_URL}
                                size={150}
                                level="M"
                                includeMargin={false}
                            />
                            {/* Nest emoji overlay in center */}
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                background: 'white',
                                borderRadius: '50%',
                                padding: '5px',
                                fontSize: '2.5rem',
                                lineHeight: 1,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}>
                                🪹
                            </div>
                        </div>
                        <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-text-secondary)',
                            textAlign: 'center'
                        }}>
                            {t('settings.scanToShare')}
                        </div>
                        <button
                            onClick={handleShare}
                            className="btn btn-secondary"
                            style={{
                                fontSize: '0.9rem',
                                padding: '0.6rem 1.2rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                background: 'var(--color-primary)',
                                color: 'white',
                                border: 'none'
                            }}
                        >
                            🔗 {t('settings.shareLink') || 'Share Link'}
                        </button>
                    </div>
                </div>

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

                {/* Language Selection */}
                <div className="form-group">
                    <label className="form-label">{t('profile.language')}</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {availableLanguages.map(lang => (
                            <button
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
                                    color: 'var(--color-text)'
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
    );
};

export default SettingsPanel;
