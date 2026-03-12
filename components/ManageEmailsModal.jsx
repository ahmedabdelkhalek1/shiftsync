'use client';

import { useState, useEffect } from 'react';

export default function ManageEmailsModal({ onClose }) {
    const [emails, setEmails] = useState([]);
    const [primaryEmail, setPrimaryEmail] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchEmails = async () => {
        try {
            const res = await fetch('/api/manager/emails');
            const data = await res.json();
            if (data.emails) setEmails(data.emails);
            if (data.primaryEmail) setPrimaryEmail(data.primaryEmail);
        } catch {
            setError('Failed to load emails');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEmails(); }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        setError('');
        if (!newEmail.trim()) return;

        setActionLoading(true);
        try {
            const res = await fetch('/api/manager/emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newEmail.trim() })
            });
            const data = await res.json();
            if (res.ok) {
                setNewEmail('');
                await fetchEmails();
            } else {
                setError(data.error || 'Failed to add email');
            }
        } catch {
            setError('Network error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemove = async (email) => {
        setError('');
        setActionLoading(true);
        try {
            const res = await fetch('/api/manager/emails', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (res.ok) {
                await fetchEmails();
            } else {
                setError(data.error || 'Failed to remove email');
            }
        } catch {
            setError('Network error');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="modal active">
            <div className="modal-content" style={{ maxWidth: '500px' }}>
                <h2>✉️ Notification Emails</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '13px' }}>
                    Manage the email addresses that receive notifications when employees submit requests.
                </p>

                {error && (
                    <div style={{ color: 'var(--brand-red)', background: 'rgba(230,0,0,0.1)', padding: '10px', borderRadius: '4px', marginBottom: '16px', fontSize: '13px' }}>
                        {error}
                    </div>
                )}

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading...</div>
                ) : (
                    <>
                        {/* Current emails */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                            {emails.length === 0 ? (
                                <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                                    No notification emails configured yet.
                                </div>
                            ) : (
                                emails.map(email => (
                                    <div key={email} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        background: 'var(--bg-elevated)', padding: '10px 14px', borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-subtle)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                            <span style={{ fontSize: '14px' }}>📧</span>
                                            <span style={{ fontSize: '13px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {email}
                                            </span>
                                            {email === primaryEmail && (
                                                <span style={{ fontSize: '10px', background: 'rgba(76,175,80,0.15)', color: '#4caf50', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, flexShrink: 0 }}>
                                                    PRIMARY
                                                </span>
                                            )}
                                        </div>
                                        {email !== primaryEmail && (
                                            <button
                                                onClick={() => handleRemove(email)}
                                                disabled={actionLoading}
                                                style={{
                                                    background: 'rgba(230,0,0,0.1)', color: 'var(--brand-red)', border: 'none',
                                                    padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px',
                                                    fontWeight: 600, flexShrink: 0
                                                }}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Add new email */}
                        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="email"
                                className="input-field"
                                placeholder="Add another email address..."
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                disabled={actionLoading}
                                style={{ flex: 1 }}
                            />
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={actionLoading || !newEmail.trim()}
                                style={{ flexShrink: 0 }}
                            >
                                {actionLoading ? '...' : '+ Add'}
                            </button>
                        </form>
                    </>
                )}

                <div className="modal-actions" style={{ marginTop: '20px' }}>
                    <button onClick={onClose} className="btn btn-secondary">Close</button>
                </div>
            </div>
        </div>
    );
}
