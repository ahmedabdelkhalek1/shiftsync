'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';

export default function ApprovalsInbox({ onClose, onUpdate }) {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch pending requests on mount
    useEffect(() => {
        let active = true;
        fetch('/api/requests')
            .then(r => r.json())
            .then(d => {
                if (!active) return;
                if (d.requests) setRequests(d.requests.filter(req => req.status === 'pending'));
                setLoading(false);
            })
            .catch(e => {
                if (!active) return;
                setError('Failed to load inbox');
                setLoading(false);
            });
        return () => { active = false; };
    }, []);

    const handleAction = async (id, status) => {
        try {
            const res = await fetch(`/api/requests/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                setRequests(prev => prev.filter(r => r._id !== id));
                onUpdate();
            } else {
                const d = await res.json();
                alert(d.error || 'Update failed');
            }
        } catch {
            alert('Network error');
        }
    };

    return (
        <div className="modal active">
            <div className="modal-content modal-large">
                <h2>📬 Pending Approvals Inbox</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Review shift change requests from employees.</p>

                {error && <div style={{ color: 'var(--brand-red)', background: 'rgba(230,0,0,0.1)', padding: '10px', borderRadius: '4px', marginBottom: '16px' }}>{error}</div>}

                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Loading...</div>
                    ) : requests.length === 0 ? (
                        <div className="empty-state">
                            <h3>All caught up!</h3>
                            <p>There are no pending shift requests to review at this time.</p>
                        </div>
                    ) : (
                        requests.map(req => (
                            <div key={req._id} style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '12px', border: '1px solid var(--border-subtle)', borderLeft: '3px solid var(--brand-red)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div>
                                        <h4 style={{ fontSize: '15px', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>{req.employeeName}</h4>
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Date: {req.date}</span>
                                    </div>
                                    <div style={{ textAlign: 'right', fontSize: '13px' }}>
                                        <div style={{ color: 'var(--text-secondary)' }}>Current: <strong style={{ color: '#FDCB6E' }}>{req.currentShift || 'off-day'}</strong></div>
                                        <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Requested: <strong style={{ color: 'var(--brand-red-light)' }}>{req.requestedShift}</strong></div>
                                        {req.workingShift && <div style={{ color: 'var(--brand-green-light)', marginTop: '4px' }}>Working: <strong>{req.workingShift}</strong></div>}
                                    </div>
                                </div>

                                {req.reason && (
                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '4px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', fontStyle: 'italic' }}>
                                        "{req.reason}"
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                                    <button onClick={() => handleAction(req._id, 'rejected')} className="btn btn-secondary btn-sm" style={{ color: 'var(--brand-red-light)' }}>✖ Reject</button>
                                    <button onClick={() => handleAction(req._id, 'approved')} className="btn btn-primary btn-sm" style={{ background: 'var(--brand-green-dark)' }}>✔ Approve</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="modal-actions">
                    <button onClick={onClose} className="btn btn-secondary">Close Inbox</button>
                </div>
            </div>
        </div>
    );
}
