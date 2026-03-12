'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';

export default function ProfileModal({ employee, onClose, onUpdate }) {
    const { user } = useAuth();

    // Local state initialized from employee data
    const [favoriteOffDays, setFavoriteOffDays] = useState(employee.favoriteOffDays || []);
    const [balances, setBalances] = useState({
        combo: employee.balances?.combo || 0,
        annual: employee.balances?.annual || 0,
        sick: employee.balances?.sick || 0,
        wfh: employee.balances?.wfh || 0,
    });
    const [gender, setGender] = useState(employee.gender || 'male');
    const [email, setEmail] = useState(employee.email || '');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const canEditBalances = user && ['manager', 'super-admin'].includes(user.role);

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const handleFavoriteToggle = (day) => {
        setFavoriteOffDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const handleBalanceAdjust = (type, delta) => {
        if (!canEditBalances) return;
        setBalances(prev => ({
            ...prev,
            [type]: Math.max(0, prev[type] + delta)
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        setError('');

        try {
            const payload = { favoriteOffDays };

            // Managers can edit email as well
            if (canEditBalances) {
                payload.balances = balances;
                payload.gender = gender;
                payload.email = email;
            }

            const res = await fetch(`/api/employees/${employee._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok) {
                onUpdate(data.employee);
                onClose();
            } else {
                setError(data.error);
            }
        } catch {
            setError('Failed to save profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal active">
            <div className="modal-content modal-large">
                <h2>{employee.name}'s Profile</h2>
                {error && <div style={{ color: 'var(--brand-red)', background: 'rgba(230,0,0,0.1)', padding: '10px', borderRadius: '4px', marginBottom: '16px' }}>{error}</div>}

                <div className="profile-section">
                    <h3>Favorite Off Days</h3>
                    <div className="weekend-preferences">
                        {daysOfWeek.map(day => (
                            <label key={day}>
                                <input
                                    type="checkbox"
                                    checked={favoriteOffDays.includes(day)}
                                    onChange={() => handleFavoriteToggle(day)}
                                    disabled={loading}
                                /> {day}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="profile-section">
                    <h3>Leave Balances</h3>
                    <div className="combo-balance-display">
                        {['combo', 'annual', 'sick', 'wfh'].map(type => (
                            <div key={type} className="balance-item">
                                <span style={{ textTransform: 'capitalize' }}>{
                                    type === 'combo' ? '🔄 Combo Balance' :
                                        type === 'annual' ? '📅 Annual Leave' :
                                            type === 'sick' ? '🏥 Sick Leave' : '🏠 WFH Balance'
                                }</span>
                                <div className="balance-adjuster">
                                    <strong className="combo-balance-number">{balances[type]}</strong>
                                    {canEditBalances && (
                                        <>
                                            <button onClick={() => handleBalanceAdjust(type, 1)} className="btn-combo-adjust" title={`Add ${type}`}>+</button>
                                            <button onClick={() => handleBalanceAdjust(type, -1)} className="btn-combo-adjust" title={`Deduct ${type}`}>-</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="profile-section">
                    <h3>Personal Info</h3>
                    
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Email Address</label>
                        {canEditBalances ? (
                            <input 
                                type="email" 
                                className="input-field" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                placeholder="Employee email address..." 
                                disabled={loading} 
                            />
                        ) : (
                            <div style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--border-subtle)', color: email ? '#fff' : '#666' }}>
                                {email || 'No email provided'}
                            </div>
                        )}
                    </div>

                    {canEditBalances && (
                        <div className="gender-selection profile-gender-edit" style={{ marginBottom: 0 }}>
                            <label>Gender</label>
                            <label className="radio-label">
                                <input type="radio" value="male" checked={gender === 'male'} onChange={() => setGender('male')} /> Male
                            </label>
                            <label className="radio-label">
                                <input type="radio" value="female" checked={gender === 'female'} onChange={() => setGender('female')} /> Female
                            </label>
                        </div>
                    )}
                </div>

                {employee.comboHistory && employee.comboHistory.length > 0 && (
                    <div className="profile-section">
                        <h3>Combo Days History</h3>
                        <p className="combo-summary">Total Earned: <strong>{employee.comboHistory.filter(h => h.type === 'combo-in' && h.status === 'approved').length}</strong></p>
                        <div className="combo-history-container">
                            <table className="combo-history-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Original</th>
                                        <th>New</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employee.comboHistory.map((h, i) => (
                                        <tr key={i}>
                                            <td>{h.date}</td>
                                            <td>{h.type === 'combo-in' ? <span className="status-badge status-available">Earned</span> : <span className="status-badge status-taken">Used</span>}</td>
                                            <td>{h.originalShift}</td>
                                            <td>{h.newShift}</td>
                                            <td>{h.status}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="modal-actions">
                    <button onClick={onClose} className="btn btn-secondary" disabled={loading}>Close</button>
                    <button onClick={handleSave} className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Profile'}</button>
                </div>
            </div>
        </div>
    );
}
