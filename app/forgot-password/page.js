'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPassword() {
    const [username, setUsername] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            });
            const data = await res.json();

            if (res.ok) {
                setMessage(data.message);
                setUsername('');
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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-dark)' }}>
            <div className="modal-content" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
                <h2 style={{ color: 'var(--text-primary)' }}>Reset Password</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
                    Enter your username below. If we have an email on file for you, we will send a password reset link.
                </p>

                {error && <div style={{ color: 'var(--brand-red)', background: 'rgba(230, 0, 0, 0.1)', padding: '10px', borderRadius: '4px', marginBottom: '16px' }}>{error}</div>}
                {message && <div style={{ color: '#4caf50', background: 'rgba(76, 175, 80, 0.1)', padding: '10px', borderRadius: '4px', marginBottom: '16px' }}>{message}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '24px', textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>Username</label>
                        <input
                            type="text"
                            className="input-field"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={loading || !!message}
                            placeholder="e.g. jdoe"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '16px' }} disabled={loading || !!message}>
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <div style={{ marginTop: '24px' }}>
                    <Link href="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px' }}>
                        &larr; Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
