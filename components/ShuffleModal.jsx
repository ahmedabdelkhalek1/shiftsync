'use client';

import { useState } from 'react';

export default function ShuffleModal({ employees, onClose, onShuffle }) {
    const [lockedIds, setLockedIds] = useState([]);
    const [floaterIds, setFloaterIds] = useState([]);
    const [includeNight, setIncludeNight] = useState(false);

    const toggleLock = (id) => {
        setLockedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
        setFloaterIds(prev => prev.filter(x => x !== id));
    };

    const toggleFloater = (id) => {
        setFloaterIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
        setLockedIds(prev => prev.filter(x => x !== id));
    };

    return (
        <div className="modal active">
            <div className="modal-content modal-large">
                <h2>Smart Shuffle Settings</h2>
                <div style={{ maxHeight: '400px', overflowY: 'auto', margin: '20px 0', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-strong)' }}>
                            <tr>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Employee</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>🔒 Lock</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>🌊 Floater</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map(emp => (
                                <tr key={emp._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                    <td style={{ padding: '12px' }}>{emp.name}</td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={lockedIds.includes(emp._id)}
                                            onChange={() => toggleLock(emp._id)}
                                        />
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={floaterIds.includes(emp._id)}
                                            onChange={() => toggleFloater(emp._id)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={includeNight} onChange={e => setIncludeNight(e.target.checked)} />
                        Include Night Shift in Shuffle
                    </label>
                </div>

                <div className="modal-actions">
                    <button onClick={onClose} className="btn btn-secondary">Cancel</button>
                    <button
                        onClick={() => onShuffle({ lockedIds, floaterIds, includeNight })}
                        className="btn btn-primary"
                    >
                        Perform Shuffle
                    </button>
                </div>
            </div>
        </div>
    );
}
