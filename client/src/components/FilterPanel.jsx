import React, { useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { logger } from '../utils/logger';

const FilterPanel = ({ filters, onChange, onClose }) => {
    const { t } = useLanguage();

    const toggleStatus = (status) => {
        const current = filters.status;
        const next = current.includes(status)
            ? current.filter(s => s !== status)
            : [...current, status];

        const action = current.includes(status) ? 'unselected' : 'selected';
        logger.aggressive(['Filter', 'Interaction'], `Filter ${action}: ${status}`);

        onChange({ ...filters, status: next });
    };

    const statusOptions = [
        { id: 'confirmed', label: t('status.confirmed'), color: 'var(--color-confirmed)' },
        { id: 'pending', label: t('status.pending'), color: 'var(--color-pending)' },
        { id: 'deactivated', label: t('status.deactivated'), color: 'var(--color-deactivated)' }
    ];

    return (
        <div className="card">
            <div className="card-header flex-between items-center">
                <h3 className="card-title">{t('filters.title')}</h3>
                <button
                    onClick={onClose}
                    style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: 0, lineHeight: 1 }}
                >
                    &times;
                </button>
            </div>
            <div className="card-body">
                <label className="form-label">{t('point.status')}</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {statusOptions.map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => toggleStatus(opt.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 'var(--space-2)',
                                padding: 'var(--space-3)',
                                background: filters.status.includes(opt.id)
                                    ? `${opt.color}20`
                                    : 'var(--color-bg-secondary)',
                                border: filters.status.includes(opt.id)
                                    ? `2px solid ${opt.color}`
                                    : '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                color: filters.status.includes(opt.id)
                                    ? opt.color
                                    : 'var(--color-text-secondary)',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all var(--transition-fast)'
                            }}
                        >
                            <span style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: opt.color
                            }} />
                            {opt.label}
                        </button>
                    ))}
                </div>

                <div style={{ marginTop: 'var(--space-6)', display: 'flex', justifyContent: 'center' }}>
                    <button
                        onClick={() => {
                            logger.aggressive(['Filter', 'Interaction'], 'Button clicked: Done');
                            onClose();
                        }}
                        className="btn btn-primary"
                        style={{ padding: '0.75rem 2rem' }}
                    >
                        ✓ {t('filters.done')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FilterPanel;
