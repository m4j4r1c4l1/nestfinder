import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

    const [showShareModal, setShowShareModal] = useState(false);

    const handleShare = async () => {
        // Try native share on mobile/supported devices
        let shared = false;
        if (navigator.share) {
            try {
                // On mobile, native share is usually better.
                // But on desktop, it might be limited.
                // We'll try it, and if it throws or is aborted, we handle it.
                await navigator.share({
                    title: 'NestFinder',
                    text: t('welcome.subtitle'),
                    url: APP_URL
                });
                shared = true;
            } catch (err) {
                // If error is strictly 'AbortError', user cancelled native sheet, so do nothing.
                if (err.name === 'AbortError') return;
                // Otherwise, fall through to modal
            }
        }

        // If native share didn't happen (unsupported or failed non-abort), show custom modal
        if (!shared) {
            setShowShareModal(true);
        }
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

    const shareSocial = (platform) => {
        const text = encodeURIComponent(t('welcome.subtitle'));
        const url = encodeURIComponent(APP_URL);
        let link = '';

        switch (platform) {
            case 'whatsapp':
                link = `https://wa.me/?text=${text}%20${url}`;
                break;
            case 'telegram':
                link = `https://t.me/share/url?url=${url}&text=${text}`;
                break;
            case 'twitter':
                link = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
                break;
            case 'instagram':
                // Instagram doesn't support web share URL efficiently.
                // We'll just copy the link and notify user, or open instagram.com
                // For now, let's copy link and open instagram.
                handleCopyLink();
                setTimeout(() => window.open('https://instagram.com', '_blank'), 1000);
                return;
            default:
                return;
        }
        window.open(link, '_blank');
        setShowShareModal(false);
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
                                level="H"
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
                                fontSize: '2rem',
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
                            {t('settings.scanToShare').split('NestFinder')[0]}
                            <strong>NestFinder</strong>
                            {t('settings.scanToShare').split('NestFinder')[1] || ''}
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
                                border: 'none',
                                transition: 'background 0.3s'
                            }}
                        >
                            🔗 {t('settings.shareLink') || 'Share Link'}
                        </button>
                    </div>
                </div>

                {/* Share Modal Overlay - Portaled to document.body */}
                {showShareModal && createPortal(
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 99999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px'
                    }} onClick={(e) => {
                        if (e.target === e.currentTarget) setShowShareModal(false);
                    }}>
                        <div style={{
                            background: 'var(--color-bg-secondary)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '1.5rem',
                            width: '100%',
                            maxWidth: '320px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                            animation: 'slideUp 0.3s ease-out',
                            color: 'var(--color-text-primary)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0 }}>{t('settings.shareLink')}</h3>
                                <button
                                    onClick={() => setShowShareModal(false)}
                                    style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: 0, color: 'var(--color-text)' }}
                                >
                                    &times;
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                <button
                                    onClick={() => shareSocial('whatsapp')}
                                    style={{
                                        border: 'none',
                                        background: '#25D366',
                                        color: 'white',
                                        padding: '0.8rem',
                                        borderRadius: 'var(--radius-md)',
                                        fontWeight: 'bold',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    💬 WhatsApp
                                </button>
                                <button
                                    onClick={() => shareSocial('telegram')}
                                    style={{
                                        border: 'none',
                                        background: '#0088cc',
                                        color: 'white',
                                        padding: '0.8rem',
                                        borderRadius: 'var(--radius-md)',
                                        fontWeight: 'bold',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    ✈️ Telegram
                                </button>
                                <button
                                    onClick={() => shareSocial('twitter')}
                                    style={{
                                        border: 'none',
                                        background: 'black',
                                        color: 'white',
                                        padding: '0.8rem',
                                        borderRadius: 'var(--radius-md)',
                                        fontWeight: 'bold',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    ✖️ X (Twitter)
                                </button>
                                <button
                                    onClick={() => shareSocial('instagram')}
                                    style={{
                                        border: 'none',
                                        background: 'linear-gradient(45deg, #405de6, #5851db, #833ab4, #c13584, #e1306c, #fd1d1d)',
                                        color: 'white',
                                        padding: '0.8rem',
                                        borderRadius: 'var(--radius-md)',
                                        fontWeight: 'bold',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    📸 Instagram
                                </button>
                                <button
                                    onClick={handleCopyLink}
                                    style={{
                                        border: '1px solid var(--color-border)',
                                        background: showCopied ? 'var(--color-success)' : 'var(--color-bg-secondary)',
                                        color: showCopied ? 'white' : 'var(--color-text)',
                                        padding: '0.8rem',
                                        borderRadius: 'var(--radius-md)',
                                        fontWeight: 'bold',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {showCopied ? `✓ ${t('settings.linkCopied')}` : `📋 ${t('settings.copyLink')}`}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

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
