'use client';

import { useState } from 'react';

export default function ComboReasonModal({ employee, dateStr, shift, onClose, onSubmit }) {
    const [reason, setReason] = useState('');
    const [workingShift, setWorkingShift] = useState('morning');
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
                    shift: shift === 'combo-in' ? workingShift : shift,
                    isComboIn: shift === 'combo-in',
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
            <div className="modal-content" style={{ maxWidth: '400px' }}>
                <h2>Combo Day: {employee.name}</h2>
                <p>Date: <strong>{dateStr}</strong></p>
                
                {shift === 'combo-in' && (
                    <div style={{ margin: '16px 0' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Shift Worked:</label>
                        <select 
                            className="input-field" 
                            value={workingShift} 
                            onChange={(e) => setWorkingShift(e.target.value)}
                        >
                            <option value="morning">🌅 Morning</option>
                            <option value="afternoon">☀️ Afternoon</option>
                            <option value="evening">🌆 Evening</option>
                            <option value="night">🌙 Night</option>
                        </select>
                    </div>
                )}

                <div style={{ margin: '16px 0' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Reason of taking this as a combo-in:</label>
                    <input
                        className="input-field"
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
