'use client';

import { useState } from 'react';

export default function BulkComboReasonModal({ count, onClose, onSubmit }) {
    const [reason, setReason] = useState('');

    const handleSubmit = () => {
        if (!reason.trim()) {
            alert('Please enter a reason');
            return;
        }
        onSubmit(reason);
    };

    return (
        <div className="modal active">
            <div className="modal-content" style={{ maxWidth: '400px' }}>
                <h2 style={{ marginBottom: '8px' }}>Bulk Combo Day</h2>
                <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>
                    Applying to <strong>{count}</strong> selected shift(s).
                </p>

                <div style={{ margin: '16px 0' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Reason of taking this as a combo-in:</label>
                    <input
                        className="input-field"
                        placeholder="e.g. Mass Extra shift, Reward"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        autoFocus
                    />
                </div>
                <div className="modal-actions">
                    <button onClick={onClose} className="btn btn-secondary">Cancel</button>
                    <button onClick={handleSubmit} className="btn btn-primary">
                        Confirm Bulk Combo
                    </button>
                </div>
            </div>
        </div>
    );
}
