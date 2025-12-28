import React from 'react';

const FilterPanel = ({ filters, onChange, onClose }) => {
    const toggleStatus = (status) => {
        const current = filters.status;
        const next = current.includes(status)
            ? current.filter(s => s !== status)
            : [...current, status];
        onChange({ ...filters, status: next });
    };

    const statusOptions = [
        { id: 'confirmed', label: 'Confirmed', color: 'var(--color-confirmed)' },
        { id: 'pending', label: 'Pending', color: 'var(--color-pending)' },
        { id: 'deactivated', label: 'Deactivated', color: 'var(--color-deactivated)' }
    ];

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title" style={{ marginBottom: 0 }}>Filters</h3>
            </div>
            <div className="card-body">
                <label className="form-label">Show Status</label>
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
                        onClick={onClose}
                        className="btn btn-primary"
                        style={{ padding: '0.75rem 2rem' }}
                    >
                        ✓ Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FilterPanel;
