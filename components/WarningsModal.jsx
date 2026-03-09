'use client';

import { useState, useMemo } from 'react';

export default function WarningsModal({ warnings, onClose }) {
    const [openGroup, setOpenGroup] = useState(null);

    const errors = warnings.filter(w => w.severity === 'error');
    const warns = warnings.filter(w => w.severity === 'warning');

    // Group by type
    const groups = useMemo(() => {
        const map = {};
        warnings.forEach(w => {
            const key = w.type || 'Other';
            if (!map[key]) map[key] = [];
            map[key].push(w);
        });
        return Object.entries(map).sort((a, b) => {
            // Errors first
            const aHasError = a[1].some(x => x.severity === 'error');
            const bHasError = b[1].some(x => x.severity === 'error');
            if (aHasError && !bHasError) return -1;
            if (!aHasError && bHasError) return 1;
            return 0;
        });
    }, [warnings]);

    const toggleGroup = (key) => setOpenGroup(prev => prev === key ? null : key);

    return (
        <div className="modal active">
            <div className="modal-content modal-large">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h2 style={{ margin: 0 }}>⚠️ Schedule Warnings</h2>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {errors.length > 0 && (
                            <span style={{ background: 'rgba(224,8,0,0.15)', color: 'var(--brand-red-light)', padding: '4px 10px', borderRadius: 'var(--radius-pill)', fontSize: '12px', fontWeight: 700, border: '1px solid rgba(224,8,0,0.3)' }}>
                                🛑 {errors.length} Error{errors.length !== 1 ? 's' : ''}
                            </span>
                        )}
                        {warns.length > 0 && (
                            <span style={{ background: 'rgba(253,203,110,0.1)', color: '#FDCB6E', padding: '4px 10px', borderRadius: 'var(--radius-pill)', fontSize: '12px', fontWeight: 700, border: '1px solid rgba(253,203,110,0.3)' }}>
                                ⚠️ {warns.length} Warning{warns.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>

                {warnings.length === 0 ? (
                    <div className="empty-state">
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                        <h3 style={{ color: 'var(--brand-green-light)' }}>All Clear!</h3>
                        <p>No schedule conflicts or warnings for the current month.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '500px', overflowY: 'auto' }}>
                        {groups.map(([type, items]) => {
                            const hasError = items.some(x => x.severity === 'error');
                            const isOpen = openGroup === type;
                            const accent = hasError ? 'var(--brand-red-light)' : '#FDCB6E';
                            const accentBg = hasError ? 'rgba(224,8,0,0.08)' : 'rgba(253,203,110,0.06)';
                            const accentBorder = hasError ? 'rgba(224,8,0,0.25)' : 'rgba(253,203,110,0.2)';

                            return (
                                <div key={type} style={{ background: accentBg, borderRadius: 'var(--radius-md)', border: `1px solid ${accentBorder}`, overflow: 'hidden' }}>
                                    {/* Group Header */}
                                    <button
                                        onClick={() => toggleGroup(type)}
                                        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', gap: '12px' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '16px' }}>{hasError ? '🛑' : '⚠️'}</span>
                                            <span style={{ fontWeight: 700, fontSize: '13px', color: accent, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{type}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ background: accent, color: '#000', borderRadius: 'var(--radius-pill)', fontSize: '11px', fontWeight: 700, padding: '1px 8px', minWidth: '24px', textAlign: 'center' }}>
                                                {items.length}
                                            </span>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '12px', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>▼</span>
                                        </div>
                                    </button>

                                    {/* Items */}
                                    {isOpen && (
                                        <div style={{ borderTop: `1px solid ${accentBorder}` }}>
                                            {items.map((w, i) => (
                                                <div key={i} style={{ padding: '10px 16px 10px 42px', fontSize: '13px', color: 'var(--text-secondary)', borderBottom: i < items.length - 1 ? `1px solid ${accentBorder}` : 'none', lineHeight: 1.6 }}
                                                    dangerouslySetInnerHTML={{ __html: w.message }} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="modal-actions" style={{ marginTop: '20px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', flex: 1 }}>{warnings.length} total issue{warnings.length !== 1 ? 's' : ''} found</span>
                    <button onClick={onClose} className="btn btn-secondary">Close</button>
                </div>
            </div>
        </div>
    );
}
