'use client';

import { useState, useEffect } from 'react';

const STATUS_STYLE = {
    pending: { bg: 'rgba(253,203,110,0.15)', color: '#FDCB6E', label: '⏳ Pending' },
    approved: { bg: 'rgba(130,170,64,0.15)', color: 'var(--brand-green-light)', label: '✅ Approved' },
    rejected: { bg: 'rgba(224,8,0,0.12)', color: 'var(--brand-red-light)', label: '❌ Rejected' },
};

export default function ManagerRequestLog({ currentDate, onClose }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const monthName = currentDate.toLocaleString('default', { month: 'long' });

    useEffect(() => {
        fetch('/api/requests')
            .then(r => r.json())
            .then(d => {
                if (d.requests) {
                    // Filter to current month
                    const filtered = d.requests.filter(r => {
                        const rDate = new Date(r.date || r.createdAt);
                        return rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear;
                    });
                    setRequests(filtered);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [currentMonth, currentYear]);

    const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

    const counts = {
        all: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        rejected: requests.filter(r => r.status === 'rejected').length,
    };

    return (
        <div className="modal active">
            <div className="modal-content modal-large">
                <h2>📋 Request Log — {monthName} {currentYear}</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '13px' }}>
                    All employee requests received during this month.
                </p>

                {/* Filter Tabs */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    {['all', 'pending', 'approved', 'rejected'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                padding: '5px 14px',
                                borderRadius: 'var(--radius-pill)',
                                border: '1px solid ' + (filter === f ? 'var(--brand-red)' : 'var(--border-default)'),
                                background: filter === f ? 'var(--brand-red)' : 'var(--bg-card)',
                                color: filter === f ? '#fff' : 'var(--text-secondary)',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'var(--transition)'
                            }}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
                        </button>
                    ))}
                </div>

                <div style={{ maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading...</div>
                    ) : filtered.length === 0 ? (
                        <div className="empty-state">
                            <p>No {filter === 'all' ? '' : filter} requests for {monthName}.</p>
                        </div>
                    ) : (
                        filtered.map(req => {
                            const s = STATUS_STYLE[req.status] || STATUS_STYLE.pending;
                            return (
                                <div key={req._id} style={{
                                    background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)',
                                    padding: '14px 16px', border: '1px solid var(--border-subtle)',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px'
                                }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '4px' }}>
                                            👤 {req.employeeName || 'Unknown'}
                                        </div>
                                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>📅 {req.date}</div>
                                        <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                                            <span style={{ color: '#FDCB6E' }}>{req.currentShift || 'off-day'}</span>
                                            <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>→</span>
                                            <span style={{ color: 'var(--brand-green-light)' }}>{req.requestedShift}</span>
                                        </div>
                                        {req.reason && (
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                                                &quot;{req.reason}&quot;
                                            </div>
                                        )}
                                    </div>
                                    <span style={{
                                        background: s.bg, color: s.color, padding: '4px 12px',
                                        borderRadius: 'var(--radius-pill)', fontSize: '12px',
                                        fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0
                                    }}>
                                        {s.label}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="modal-actions" style={{ marginTop: '20px' }}>
                    <button onClick={onClose} className="btn btn-secondary">Close</button>
                </div>
            </div>
        </div>
    );
}
