'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';

export default function SuperAdminPage() {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Manager form
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [formError, setFormError] = useState('');

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            if (res.ok) setUsers(data.users || []);
        } catch (e) { } finally { setLoading(false); }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateManager = async (e) => {
        e.preventDefault();
        setFormError('');
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, email, role: 'manager' })
            });
            const data = await res.json();
            if (res.ok) {
                setUsername(''); setPassword(''); setEmail(''); fetchUsers();
            } else { setFormError(data.error); }
        } catch { setFormError('Network error'); }
    };

    const handleDeactivate = async (id) => {
        if (!confirm('Are you sure you want to deactivate this manager?')) return;
        try {
            await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
            fetchUsers();
        } catch { }
    };

    if (!user || user.role !== 'super-admin') return null;

    return (
        <div className="app-container" style={{ minHeight: '100vh', padding: '40px' }}>
            <header style={{ marginBottom: '40px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '20px' }}>
                <h1 style={{ color: 'var(--brand-red)' }}>Super Admin Panel</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Manage tenants and managers here.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '40px' }}>
                <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                    <h2>Create Manager</h2>
                    {formError && <div style={{ color: 'var(--brand-red)', marginBottom: '16px' }}>{formError}</div>}
                    <form onSubmit={handleCreateManager}>
                        <input type="text" className="input-field" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
                        <input type="password" className="input-field" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
                        <input type="email" className="input-field" placeholder="Email (optional)" value={email} onChange={e => setEmail(e.target.value)} />
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Manager</button>
                    </form>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                    <h2>All System Users</h2>
                    <table className="schedule-table" style={{ width: '100%', marginTop: '20px' }}>
                        <thead>
                            <tr><th>Username</th><th>Role</th><th>Status</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u._id}>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>{u.username}</td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>{u.role}</td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>{u.active ? 'Active' : 'Inactive'}</td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        {u.role !== 'super-admin' && u.active && (
                                            <button onClick={() => handleDeactivate(u._id)} className="btn btn-danger btn-sm">Deactivate</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
