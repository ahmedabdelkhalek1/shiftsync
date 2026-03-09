'use client';

import { SHIFT_OPTIONS } from './ShiftCell';

export default function RequestChangeModal({ employee, dateStr, currentShift, onClose, onSubmit }) {
    const [requestedShift, setRequestedShift] = useState('morning');
    const [workingShift, setWorkingShift] = useState('morning');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isComboIn = requestedShift === 'combo-in';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: dateStr,
                    currentShift: currentShift || 'off-day',
                    requestedShift,
                    workingShift: isComboIn ? workingShift : null,
                    reason
                })
            });

            const data = await res.json();
            if (res.ok) {
                onSubmit(data.request);
                onClose();
            } else {
                setError(data.error);
            }
        } catch {
            setError('Failed to submit request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal active">
            <div className="modal-content">
                <h2>Request Shift Change</h2>
                <div style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <p>Date: <strong style={{ color: 'var(--text-primary)' }}>{dateStr}</strong></p>
                    <p>Current Shift: <strong style={{ color: 'var(--text-primary)' }}>{currentShift || 'off-day'}</strong></p>
                </div>

                {error && <div style={{ color: 'var(--brand-red)', background: 'rgba(230,0,0,0.1)', padding: '10px', borderRadius: '4px', marginBottom: '16px' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="control-group">
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Requested Shift</label>
                        <select className="input-field" value={requestedShift} onChange={e => setRequestedShift(e.target.value)} disabled={loading}>
                            {SHIFT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            <option value="combo-in">📥 Combo In (Earn Day)</option>
                            <option value="combo-out">📤 Combo Out (Use Day)</option>
                            <option value="wfh">🏠 Work From Home (WFH Toggle)</option>
                        </select>
                    </div>

                    {isComboIn && (
                        <div className="control-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Working Shift (Earn Credit)</label>
                            <select className="input-field" value={workingShift} onChange={e => setWorkingShift(e.target.value)} disabled={loading}>
                                <option value="morning">🌅 Morning</option>
                                <option value="afternoon">☀️ Afternoon</option>
                                <option value="evening">🌆 Evening</option>
                                <option value="night">🌙 Night</option>
                            </select>
                        </div>
                    )}

                    <div className="control-group">
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reason (Optional)</label>
                        <textarea
                            className="input-field"
                            placeholder="Why are you requesting this change?"
                            style={{ minHeight: '80px', resize: 'vertical' }}
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            disabled={loading}
                        ></textarea>
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Submitting...' : 'Submit Request'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
