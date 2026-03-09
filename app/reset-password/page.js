'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!token) {
        return (
            <div className="modal-content" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
                <h2 style={{ color: 'var(--brand-red)' }}>Invalid Link</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>The password reset link is invalid or has expired.</p>
                <Link href="/forgot-password" className="btn btn-primary" style={{ display: 'block', textDecoration: 'none' }}>Request New Link</Link>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password }),
            });
            const data = await res.json();

            if (res.ok) {
                setMessage('Password reset successfully. Redirecting to login...');
                setTimeout(() => router.push('/login'), 2000);
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
        <div className="modal-content" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
            <h2 style={{ color: 'var(--text-primary)' }}>Set New Password</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
                Please enter your new password below.
            </p>

            {error && <div style={{ color: 'var(--brand-red)', background: 'rgba(230, 0, 0, 0.1)', padding: '10px', borderRadius: '4px', marginBottom: '16px' }}>{error}</div>}
            {message && <div style={{ color: '#4caf50', background: 'rgba(76, 175, 80, 0.1)', padding: '10px', borderRadius: '4px', marginBottom: '16px' }}>{message}</div>}

            <form onSubmit={handleSubmit} style={{ display: message ? 'none' : 'block' }}>
                <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>New Password</label>
                    <input
                        type="password"
                        className="input-field"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        placeholder="At least 6 characters"
                    />
                </div>
                <div style={{ marginBottom: '24px', textAlign: 'left' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>Confirm Password</label>
                    <input
                        type="password"
                        className="input-field"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={loading}
                        placeholder="Re-enter password"
                    />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '16px' }} disabled={loading}>
                    {loading ? 'Saving...' : 'Reset Password'}
                </button>
            </form>
        </div>
    );
}

export default function ResetPassword() {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-dark)' }}>
            <Suspense fallback={<div className="modal-content" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>Loading...</div>}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}
