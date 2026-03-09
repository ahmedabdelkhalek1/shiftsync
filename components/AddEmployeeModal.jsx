'use client';

import { useState } from 'react';

export default function AddEmployeeModal({ onClose, onEmployeeAdded }) {
    const [name, setName] = useState('');
    const [gender, setGender] = useState('male');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, gender, username, password, email }),
            });
            const data = await res.json();

            if (res.ok) {
                onEmployeeAdded(data.employee);
                onClose();
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
            <div className="modal-content">
                <h2>Add New Employee</h2>
                {error && <div style={{ color: 'var(--brand-red)', background: 'rgba(230, 0, 0, 0.1)', padding: '10px', borderRadius: '4px', marginBottom: '16px' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Full Name *</label>
                    <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Full name..." disabled={loading} />

                    <div className="gender-selection">
                        <label>Gender</label>
                        <label className="radio-label">
                            <input type="radio" name="gender" value="male" checked={gender === 'male'} onChange={() => setGender('male')} /> Male
                        </label>
                        <label className="radio-label">
                            <input type="radio" name="gender" value="female" checked={gender === 'female'} onChange={() => setGender('female')} /> Female
                        </label>
                    </div>

                    <hr style={{ borderColor: 'var(--border-subtle)', margin: '16px 0' }} />
                    <h3 style={{ fontSize: '14px', marginBottom: '16px', color: 'var(--text-secondary)' }}>Login Credentials</h3>

                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Username *</label>
                    <input type="text" className="input-field" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="e.g. jsmith" disabled={loading} />

                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Initial Password *</label>
                    <input type="text" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="e.g. Temp123!" disabled={loading} />

                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Email Address (Optional)</label>
                    <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="If provided, we'll email login details" disabled={loading} />

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Add Employee'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
