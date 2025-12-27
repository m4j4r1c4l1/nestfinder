import React from 'react';

const FilterPanel = ({ filters, onChange, onClose }) => {
    const toggleStatus = (status) => {
        const current = filters.status;
        const next = current.includes(status)
            ? current.filter(s => s !== status)
            : [...current, status];
        onChange({ ...filters, status: next });
    };

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title" style={{ marginBottom: 0 }}>Filters</h3>
            </div>
            <div className="card-body">
                <label className="form-label">Show Status</label>
                <div className="toggle-group">
                    {['confirmed', 'pending', 'deactivated'].map(status => (
                        <button
                            key={status}
                            className={`toggle-btn ${status} ${filters.status.includes(status) ? 'active' : ''}`}
                            onClick={() => toggleStatus(status)}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
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
