'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/ToastProvider';
import { useConfirm } from '@/components/ConfirmDialog';

export default function SuperAdminPage() {
    const { user } = useAuth();
    const toast = useToast();
    const { confirm, ConfirmDialog } = useConfirm();
    const [users, setUsers] = useState([]);
    const [employees, setEmployees] = useState([]);
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
        } catch (e) { }
    };

    const fetchEmployees = async () => {
        try {
            const res = await fetch('/api/admin/employees');
            const data = await res.json();
            if (res.ok) setEmployees(data.employees || []);
        } catch (e) { }
    };

    useEffect(() => {
        Promise.all([fetchUsers(), fetchEmployees()]).finally(() => setLoading(false));
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
                toast.success(`Manager "${username}" created successfully`);
            } else { setFormError(data.error); }
        } catch { setFormError('Network error'); }
    };

    const handleDeactivate = async (id) => {
        const ok = await confirm('Deactivating this manager will prevent them from logging in. Continue?', {
            title: 'Deactivate Manager', danger: true
        });
        if (!ok) return;
        try {
            await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
            fetchUsers();
            toast.success('Manager deactivated');
        } catch {
            toast.error('Failed to deactivate manager');
        }
    };

    if (!user || user.role !== 'super-admin') return null;

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    };

    return (
        <div className="app-container" style={{ minHeight: '100vh', padding: '40px' }}>
            <header style={{ marginBottom: '40px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ color: 'var(--brand-red)' }}>Super Admin Panel</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage tenants, managers, and system users here.</p>
                </div>
                <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
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

                    <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                        <h2>All Employees</h2>
                        <table className="schedule-table" style={{ width: '100%', marginTop: '20px' }}>
                            <thead>
                                <tr><th>Employee Name</th><th>Linked User</th><th>Managed By (Org)</th></tr>
                            </thead>
                            <tbody>
                                {employees.map(e => (
                                    <tr key={e._id}>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>{e.name}</td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            {users.find(u => u.employeeId === e._id)?.username || <span style={{ color: 'var(--text-muted)' }}>Pending</span>}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            {e.createdBy ? (
                                                <span style={{ color: 'var(--brand-green-light)', fontWeight: 600 }}>{e.createdBy.username}</span>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <ConfirmDialog />
        </div>
    );
}
