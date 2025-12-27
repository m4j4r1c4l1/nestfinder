import React from 'react';

const PointDetails = ({ point, user, onConfirm, onDeactivate, onClose }) => {
    if (!point) return null;

    const isPoster = user && point.user_id === user.id;
    const canConfirm = user && !point.confirmations?.some(c => c.user_id === user.id); // Simple check, real logic in backend
    const canDeactivate = user && !point.deactivations?.some(c => c.user_id === user.id);

    // Format date
    const date = new Date(point.created_at).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return (
        <div className="card">
            <div className="card-header flex-between flex-center">
                <div className={`badge badge-${point.status}`}>
                    <span className={`status-dot ${point.status}`}></span>
                    {point.status.toUpperCase()}
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
                    Reported by {point.submitter_nickname || 'Anonymous'} • {date}
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
                    <div>👍 {point.confirm_count || 0} Confirmations</div>
                    <div>🚫 {point.deactivate_count || 0} Deactivations</div>
                </div>

                <div className="point-detail-actions flex-col">
                    {point.status !== 'deactivated' && (
                        <>
                            <button
                                className="btn btn-success btn-block"
                                onClick={() => onConfirm(point.id)}
                            // Disabled state logic would go here based on previous votes
                            >
                                Yes, I see help needed here
                            </button>

                            <button
                                className="btn btn-danger btn-block"
                                onClick={() => onDeactivate(point.id)}
                            >
                                {isPoster ? 'Remove my report' : 'No one is here / Resolved'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PointDetails;
