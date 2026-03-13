'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, user, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && user) {
            router.replace(user.role === 'super-admin' ? '/admin' : '/');
        }
    }, [user, authLoading, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const res = await login(username, password);
        if (!res.success) setError(res.error);

        setLoading(false);
    };

    return (
        <div className="login-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-dark)' }}>
            <div className="modal-content" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
                <h2 style={{ color: 'var(--brand-red)' }}>Welcome to ShiftSync</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Please login to continue.</p>

                {error && <div style={{ color: 'var(--brand-red)', background: 'rgba(230, 0, 0, 0.1)', padding: '10px', borderRadius: '4px', marginBottom: '16px' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>Username</label>
                        <input
                            type="text"
                            className="input-field"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoFocus
                            disabled={loading}
                            placeholder="Enter your username"
                        />
                    </div>
                    <div style={{ marginBottom: '24px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Password</label>
                            <Link href="/forgot-password" style={{ fontSize: '12px', color: 'var(--brand-red-light)', textDecoration: 'none' }}>Forgot Password?</Link>
                        </div>
                        <input
                            type="password"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            placeholder="Enter your password"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '16px' }} disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}
