import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';

/**
 * Language Picker Modal
 * Shown when language cannot be auto-detected from browser settings
 */
const LanguagePicker = () => {
    const { showPicker, setLanguage, availableLanguages, t } = useLanguage();

    if (!showPicker) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            backdropFilter: 'blur(8px)'
        }}>
            <div style={{
                background: 'var(--color-bg)',
                borderRadius: 'var(--radius-xl)',
                padding: '2rem',
                maxWidth: '360px',
                width: '90%',
                textAlign: 'center',
                boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
            }}>
                {/* Logo/Icon */}
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🪹</div>

                {/* Title */}
                <h2 style={{
                    margin: '0 0 0.5rem 0',
                    fontSize: '1.5rem',
                    color: 'var(--color-text)'
                }}>
                    Choose Language
                </h2>
                <p style={{
                    margin: '0 0 1.5rem 0',
                    color: 'var(--color-text-secondary)',
                    fontSize: '0.9rem'
                }}>
                    Selecciona tu idioma preferido
                </p>

                {/* Language Options */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                }}>
                    {availableLanguages.map(lang => (
                        <button
                            key={lang.code}
                            onClick={() => setLanguage(lang.code)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '1rem 1.25rem',
                                background: 'var(--color-bg-secondary)',
                                border: '2px solid var(--color-border)',
                                borderRadius: 'var(--radius-lg)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                color: 'var(--color-text)',
                                fontSize: '1rem'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.borderColor = 'var(--color-primary)';
                                e.currentTarget.style.background = 'var(--color-bg-tertiary)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = 'var(--color-border)';
                                e.currentTarget.style.background = 'var(--color-bg-secondary)';
                            }}
                        >
                            <span style={{ fontSize: '1.75rem' }}>{lang.flag}</span>
                            <div style={{ textAlign: 'left', flex: 1 }}>
                                <div style={{ fontWeight: 600 }}>{lang.nativeName}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                    {lang.name}
                                </div>
                            </div>
                            <span style={{ color: 'var(--color-text-muted)' }}>→</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LanguagePicker;
