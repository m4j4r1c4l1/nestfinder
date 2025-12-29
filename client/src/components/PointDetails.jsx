import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';

const PointDetails = ({ point, user, onConfirm, onDeactivate, onReactivate, onClose }) => {
    const { t } = useLanguage();

    if (!point) return null;

    const isPoster = user && point.user_id === user.id;

    // Format date
    const date = new Date(point.created_at).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    // Get translated status
    const getStatusLabel = (status) => {
        switch (status) {
            case 'confirmed': return t('status.confirmed');
            case 'pending': return t('status.pending');
            case 'deactivated': return t('status.deactivated');
            default: return status;
        }
    };

    return (
        <div className="card">
            <div className="card-header flex-between flex-center">
                <div className={`badge badge-${point.status}`}>
                    <span className={`status-dot ${point.status}`}></span>
                    {getStatusLabel(point.status).toUpperCase()}
                </div>
                <button
                    onClick={onClose}
                    style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
                >
                    &times;
                </button>
            </div>

            <div className="card-body">
                <div className="point-detail-title">
                    {point.address || `${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}`}
                </div>

                <div className="point-detail-meta mb-4">
                    {t('point.submittedBy')} {point.submitter_nickname || t('point.anonymous')} • {date}
                </div>

                {point.notes && (
                    <div className="mb-4" style={{
                        background: 'var(--color-bg-secondary)',
                        padding: 'var(--space-3)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--font-size-sm)',
                        fontStyle: 'italic'
                    }}>
                        "{point.notes}"
                    </div>
                )}

                <div className="flex gap-4 mb-4 text-sm text-muted">
                    <div>👍 {point.confirm_count || 0} {t('point.confirmations')}</div>
                    <div>🚫 {point.deactivate_count || 0} {t('point.deactivations')}</div>
                </div>

                <div className="point-detail-actions flex-col">
                    {point.status === 'deactivated' ? (
                        /* Deactivated points: show reactivate option */
                        <button
                            className="btn btn-primary btn-block"
                            onClick={() => onReactivate(point.id)}
                        >
                            🔄 {t('point.reactivateBtn')}
                        </button>
                    ) : (
                        /* Active/Pending points: show confirm and deactivate */
                        <>
                            <button
                                className="btn btn-success btn-block"
                                onClick={() => onConfirm(point.id)}
                            >
                                {t('point.confirmBtn')}
                            </button>

                            <button
                                className="btn btn-danger btn-block"
                                onClick={() => onDeactivate(point.id)}
                            >
                                {t('point.deactivateBtn')}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PointDetails;

