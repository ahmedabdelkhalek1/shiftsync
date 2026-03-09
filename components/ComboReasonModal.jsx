'use client';

import { useState } from 'react';

export default function ComboReasonModal({ employee, dateStr, shift, onClose, onSubmit }) {
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!reason.trim()) {
            alert('Please enter a reason');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/shifts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: employee._id,
                    date: dateStr,
                    shift,
                    reason
                })
            });

            if (res.ok) {
                onSubmit();
                onClose();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to save combo day');
            }
        } catch {
            alert('Failed to save combo day');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal active">
            <div className="modal-content">
                <h2>Combo Day: {employee.name}</h2>
                <p>Date: <strong>{dateStr}</strong></p>
                <div style={{ margin: '16px 0' }}>
                    <label style={{ display: 'block', marginBottom: '8px' }}>Reason for Combo Day:</label>
                    <input
                        className="input"
                        placeholder="e.g. Extra shift worked, Reward, etc."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        autoFocus
                    />
                </div>
                <div className="modal-actions">
                    <button onClick={onClose} className="btn btn-secondary" disabled={loading}>Cancel</button>
                    <button onClick={handleSubmit} className="btn btn-primary" disabled={loading}>
                        {loading ? 'Submitting...' : 'Confirm Combo Day'}
                    </button>
                </div>
            </div>
        </div>
    );
}
