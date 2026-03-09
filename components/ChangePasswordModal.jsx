'use client';

import { useState } from 'react';

export default function ChangePasswordModal({ onClose }) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await res.json();

            if (res.ok) {
                setSuccess(data.message);
                setTimeout(onClose, 2000);
            } else {
                setError(data.error);
            }
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal active">
            <div className="modal-content" style={{ maxWidth: '400px' }}>
                <h2>Change Password</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>Update your account password.</p>

                {error && <div style={{ color: 'var(--brand-red)', background: 'rgba(230,0,0,0.1)', padding: '10px', borderRadius: '4px', marginBottom: '16px' }}>{error}</div>}
                {success && <div style={{ color: '#4caf50', background: 'rgba(76,175,80,0.1)', padding: '10px', borderRadius: '4px', marginBottom: '16px' }}>{success}</div>}

                <form onSubmit={handleSubmit} style={{ display: success ? 'none' : 'block' }}>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Current Password *</label>
                    <input type="password" className="input-field" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required disabled={loading} />

                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>New Password *</label>
                    <input type="password" className="input-field" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required disabled={loading} placeholder="At least 6 characters" />

                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Confirm New Password *</label>
                    <input type="password" className="input-field" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={loading} />

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Update Password'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
