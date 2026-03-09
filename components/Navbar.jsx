'use client';

import { useAuth } from '@/components/AuthProvider';

export default function Navbar({
    onViewSchedule,
    onViewDashboard,
    onAddEmployee,
    onShowApprovals,
    onShowMyRequests,
    onSave,
    pendingCount = 0
}) {
    const { user, logout } = useAuth();

    if (!user) return null;

    return (
        <header className="app-header">
            <div className="header-content">
                <h1>
                    <span style={{ color: 'var(--brand-red)', fontWeight: 800, fontSize: '22px', letterSpacing: '-1px' }}>
                        e&amp;
                    </span>
                    &nbsp;Employee Schedule Manager
                </h1>
                <div className="header-actions">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginRight: '16px' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--brand-red-light)' }}>
                            {user.username} <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px' }}>{user.role}</span>
                        </span>
                        <button onClick={logout} className="btn btn-secondary btn-sm">Logout</button>
                    </div>

                    <div className="view-toggles" style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px', marginRight: '16px' }}>
                        <button onClick={onViewSchedule} className="btn btn-primary btn-sm">📅 Schedule</button>
                        <button onClick={onViewDashboard} className="btn btn-secondary btn-sm" style={{ border: 'none' }}>📊 Dashboard</button>
                    </div>

                    {['manager', 'super-admin'].includes(user.role) ? (
                        <>
                            <button
                                onClick={onShowApprovals}
                                className={`btn ${pendingCount > 0 ? 'btn-warning-indicator' : 'btn-secondary'}`}
                                style={{ marginRight: '8px' }}
                            >
                                📬 Inbox <span style={{ marginLeft: '4px', fontWeight: 'bold' }}>{pendingCount}</span>
                            </button>
                            <button onClick={onAddEmployee} className="btn btn-primary">＋ Add Employee</button>
                        </>
                    ) : (
                        <button onClick={onShowMyRequests} className="btn btn-secondary">📋 My Requests</button>
                    )}
                </div>
            </div>
        </header>
    );
}
