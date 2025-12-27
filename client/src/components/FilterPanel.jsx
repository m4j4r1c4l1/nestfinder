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
            <div className="card-header flex-between flex-center">
                <h3 className="card-title" style={{ marginBottom: 0 }}>Filters</h3>
                <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem' }}>Done</button>
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
            </div>
        </div>
    );
};

export default FilterPanel;
