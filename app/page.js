'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth, AuthGuard } from '@/components/AuthProvider';
import { getVisibleDates, formatDate, isWeekend, isToday, getShortDayName, getDayName, getMonthName } from '@/utils/dateUtils';
import { calculateWarnings } from '@/utils/validationUtils';
import { useEmployees } from '@/hooks/useEmployees';

import Navbar from '@/components/Navbar';
import Dashboard from '@/components/Dashboard';
import ShiftCell from '@/components/ShiftCell';
import AddEmployeeModal from '@/components/AddEmployeeModal';
import ProfileModal from '@/components/ProfileModal';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import RequestChangeModal from '@/components/RequestChangeModal';
import ApprovalsInbox from '@/components/ApprovalsInbox';
import WarningsModal from '@/components/WarningsModal';
import BulkEditToolbar from '@/components/BulkEditToolbar';
import ComboReasonModal from '@/components/ComboReasonModal';
import ShuffleModal from '@/components/ShuffleModal';
import MonthSummaryBar from '@/components/MonthSummaryBar';
import SettingsModal from '@/components/SettingsModal';
import MyRequestsModal from '@/components/MyRequestsModal';
import BroadcastEmailModal from '@/components/BroadcastEmailModal';
import { performSmartShuffle } from '@/utils/shuffleUtils';

export default function Home() {
    const { user } = useAuth();
    const { employees, refetchEmployees } = useEmployees();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState('schedule'); // schedule | dashboard
    const [pendingCount, setPendingCount] = useState(0);

    // Modals
    const [showAddEmployee, setShowAddEmployee] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [showApprovals, setShowApprovals] = useState(false);
    const [showShuffle, setShowShuffle] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [requestTarget, setRequestTarget] = useState(null); // { employee, date, currentShift }
    const [comboTarget, setComboTarget] = useState(null); // { employee, date, shift }
    const [showBroadcast, setShowBroadcast] = useState(false);

    // Selection & Bulk Edit
    const [selectedCells, setSelectedCells] = useState(new Set()); // Set of "empId|dateStr"
    const [bulkShiftSelect, setBulkShiftSelect] = useState('');

    // Warnings & Settings
    const [warnings, setWarnings] = useState([]);
    const [showWarnings, setShowWarnings] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showMyRequests, setShowMyRequests] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [shiftTimes, setShiftTimes] = useState({
        morning: "7 AM – 3 PM",
        afternoon: "11 AM – 7 PM",
        evening: "3 PM – 11 PM",
        night: "11 PM – 7 AM"
    });

    // Persist ignoreNightShift in localStorage
    const [ignoreNightShift, setIgnoreNightShift] = useState(() => {
        try { return localStorage.getItem('ignoreNightShift') === 'true'; } catch { return false; }
    });
    const handleIgnoreNightShift = (val) => {
        setIgnoreNightShift(val);
        try { localStorage.setItem('ignoreNightShift', String(val)); } catch { }
    };

    // Fetch shift times
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
                    setShiftTimes(data);
                }
            } catch (err) { console.error('Fetch settings error:', err); }
        };
        fetchSettings();
    }, []);

    // Computed visible dates
    const visibleDates = useMemo(() => getVisibleDates(currentDate), [currentDate]);

    useEffect(() => {
        if (user && ['manager', 'super-admin'].includes(user.role)) {
            fetch('/api/requests')
                .then(r => r.json())
                .then(d => {
                    if (d.requests) setPendingCount(d.requests.filter(req => req.status === 'pending').length);
                });
        }
    }, [user]);

    // Update Warnings
    useEffect(() => {
        const w = calculateWarnings(employees, visibleDates, ignoreNightShift);
        setWarnings(w);
    }, [employees, visibleDates, ignoreNightShift]);

    // Handle Month Navigation
    const changeMonth = (delta) => {
        setCurrentDate(prev => {
            const n = new Date(prev);
            n.setMonth(n.getMonth() + delta);
            return n;
        });
        setSelectedCells(new Set());
    };

    const handleShiftChange = async (employeeId, dateStr, shift, wfh) => {
        const emp = employees.find(e => e._id === employeeId);
        const previousShift = emp?.schedule?.[dateStr] || 'off-day';

        // Check if we need to show the Reason Modal (Combo-In or Vacation -> Work)
        const isEarningCombo = (shift === 'combo-in' && previousShift !== 'combo-in') ||
            (previousShift === 'vacation' && ['morning', 'afternoon', 'evening', 'night'].includes(shift));

        if (isEarningCombo && emp) {
            setComboTarget({ employee: emp, date: dateStr, shift });
            return;
        }

        try {
            const res = await fetch('/api/shifts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeId, date: dateStr, shift, wfh })
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                console.error('Shift save failed:', data.error || res.statusText);
            }
            await refetchEmployees();
        } catch (e) {
            console.error('Shift error', e);
        }
    };

    const toggleCellSelection = (empId, dateStr) => {
        if (!user || user.role === 'employee') return; // Managers only
        const key = `${empId}|${dateStr}`;
        setSelectedCells(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const applyBulkEdit = async () => {
        if (!bulkShiftSelect || selectedCells.size === 0) return;

        const updates = Array.from(selectedCells).map(key => {
            const [employeeId, dateStr] = key.split('|');
            const isWfhToggle = bulkShiftSelect === 'wfh-toggle';
            return {
                employeeId, dateStr: dateStr,
                ...(isWfhToggle ? { wfh: true } : { shift: bulkShiftSelect })
            };
        });

        try {
            const res = await fetch('/api/shifts', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates })
            });

            if (res.ok) {
                await refetchEmployees();
                setSelectedCells(new Set());
                setBulkShiftSelect('');
            } else {
                const data = await res.json();
                alert(data.error || 'Bulk update failed');
            }
        } catch (err) {
            alert('Network error during bulk update');
        } finally {
            setLoading(false);
        }
    };

    const publishSchedule = async () => {
        const monthYear = getMonthName(currentDate);
        if (!window.confirm(`Are you sure you want to publish the schedule for ${monthYear}? This will email all your employees.`)) return;
        
        setLoading(true);
        try {
            const [month, year] = monthYear.split(' ');
            const res = await fetch('/api/shifts', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates: [], publish: true, month, year })
            });

            if (res.ok) {
                alert(`Schedule for ${monthYear} published successfully! Emails have been sent.`);
            } else {
                const data = await res.json();
                alert(data.error || 'Publish failed');
            }
        } catch (err) {
            alert('Network error during publish');
        } finally {
            setLoading(false);
        }
    };

    const handleShuffle = async ({ lockedIds, floaterIds, includeNight }) => {
        const updates = performSmartShuffle({ employees, visibleDates, lockedIds, floaterIds, includeNight });

        try {
            const res = await fetch('/api/shifts', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates })
            });
            if (res.ok) {
                refetchEmployees();
                setShowShuffle(false);
                alert('Schedule shuffled successfully!');
            } else {
                const data = await res.json();
                alert(data.error || 'Shuffle failed');
            }
        } catch (err) {
            alert('Shuffle failed');
        }
    };

    const removeEmployee = async (id) => {
        try {
            await fetch(`/api/employees/${id}`, { method: 'DELETE' });
            refetchEmployees();
        } catch { }
    };

    // Render Schedule Row (Employee Context)
    const renderEmployeeRow = (emp) => {
        return (
            <tr key={emp._id}>
                <td className="employee-cell">
                    <div className="employee-name" title={emp.name}>{emp.name}</div>
                    {(['manager', 'super-admin'].includes(user?.role) || user?.employeeId === emp._id) && (
                        <button className="btn btn-profile" onClick={() => { setSelectedProfile(emp); setShowProfile(true); }}>Profile</button>
                    )}
                </td>

                {/* Render day cells */}
                {visibleDates.map(({ date, isCurrentMonth, id }) => {
                    const shift = emp.schedule?.[id] || 'off-day';
                    const wfh = emp.wfhDays?.[id] || false;
                    const isSelected = selectedCells.has(`${emp._id}|${id}`);
                    const isFav = emp.favoriteOffDays?.includes(getDayName(date));

                    const isLastDayOfWeek = date.getDay() === 6; // Saturday = end of week

                    return (
                        <td
                            key={id}
                            className={`shift-cell ${!isCurrentMonth ? 'locked-date' : ''} ${isSelected ? 'selected' : ''} ${isLastDayOfWeek ? 'week-end' : ''}`}
                            style={{ position: 'relative' }}
                            onClick={(e) => {
                                if (!isCurrentMonth) return;
                                // Manager: Toggle selection for bulk editing
                                if (['manager', 'super-admin'].includes(user?.role)) {
                                    toggleCellSelection(emp._id, id);
                                } else if (user?.employeeId === emp._id) {
                                    // Employee: Request change
                                    setRequestTarget({ employee: emp, date: id, currentShift: shift });
                                }
                            }}
                        >
                            <ShiftCell
                                employee={emp}
                                dateStr={id}
                                shift={shift}
                                wfh={wfh}
                                onShiftChange={(employeeId, dateStr, shift, wfh) => handleShiftChange(employeeId, dateStr, shift, wfh)}
                                onShiftRequest={(emp, dStr, cShift) => setRequestTarget({ employee: emp, date: dStr, currentShift: cShift })}
                            />
                            {isFav && <span className="favorite-day-indicator favorite-day-match">❤️</span>}
                        </td>
                    );
                })}

                {/* Stats Columns — per-employee M/A/E/N counts (filtered by visible months) */}
                {['manager', 'super-admin'].includes(user?.role) && (() => {
                    const monthDateIds = visibleDates.filter(d => d.isCurrentMonth).map(d => d.id);
                    const currentMonthShifts = monthDateIds.map(id => emp.schedule?.[id]).filter(Boolean);
                    
                    const mCount = currentMonthShifts.filter(s => s === 'morning').length;
                    const aCount = currentMonthShifts.filter(s => s === 'afternoon').length;
                    const eCount = currentMonthShifts.filter(s => s === 'evening').length;
                    const nCount = currentMonthShifts.filter(s => s === 'night').length;
                    return (
                        <>
                            <td className="stat-badge-cell">
                                <span className="stat-badge morning-badge">{mCount}</span>
                            </td>
                            <td className="stat-badge-cell">
                                <span className="stat-badge afternoon-badge">{aCount}</span>
                            </td>
                            <td className="stat-badge-cell">
                                <span className="stat-badge evening-badge">{eCount}</span>
                            </td>
                            <td className="stat-badge-cell">
                                <span className="stat-badge night-badge">{nCount}</span>
                            </td>
                        </>
                    );
                })()}
            </tr>
        );
    };

    return (
        <AuthGuard>
            <div className="app-container">
                <Navbar
                    onViewSchedule={() => setView('schedule')}
                    onViewDashboard={() => setView('dashboard')}
                    onAddEmployee={() => setShowAddEmployee(true)}
                    onShowApprovals={() => setShowApprovals(true)}
                    onShowMyRequests={() => setShowMyRequests(true)}
                    pendingCount={pendingCount}
                />

                {view === 'schedule' ? (
                    <>
                        <div className="controls-panel">
                            <div className="week-selector">
                                <button onClick={() => changeMonth(-1)} className="btn btn-icon">← Prev</button>
                                <span className="month-label">{getMonthName(currentDate)}</span>
                                <button onClick={() => changeMonth(+1)} className="btn btn-icon">Next →</button>
                            </div>

                            {['manager', 'super-admin'].includes(user?.role) && (
                                <div className="settings-controls">
                                    <button className="btn btn-primary" onClick={() => setShowBroadcast(true)} style={{ background: 'var(--brand-red)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', fontWeight: 'bold' }}>
                                        📢 Send Announcement
                                    </button>
                                    <button className="btn btn-primary" onClick={publishSchedule} disabled={loading} style={{ background: 'var(--brand-red)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', fontWeight: 'bold' }}>
                                        {loading ? 'Publishing...' : '📢 Publish Schedule'}
                                    </button>
                                    <button className="btn btn-auto-shuffle" onClick={() => setShowShuffle(true)}>🎲 Auto Shuffle</button>
                                    <BulkEditToolbar
                                        selectedCount={selectedCells.size}
                                        selectedShift={bulkShiftSelect}
                                        onShiftChange={setBulkShiftSelect}
                                        onApply={applyBulkEdit}
                                        onClear={() => setSelectedCells(new Set())}
                                    />
                                    <div className="warning-settings">
                                        <div
                                            className={`btn-pill-toggle ${ignoreNightShift ? 'active' : ''}`}
                                            onClick={() => handleIgnoreNightShift(!ignoreNightShift)}
                                        >
                                            <div className="check-icon">{ignoreNightShift ? '✓' : ''}</div>
                                            Ignore Night Warnings
                                        </div>
                                        <button className="btn btn-warnings-pill" onClick={() => setShowWarnings(true)}>
                                            ⚠️ {warnings.length} {warnings.length === 1 ? 'Warning' : 'Warnings'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <MonthSummaryBar employees={employees} visibleDates={visibleDates} />

                        <div className="schedule-wrapper">
                            <div className="schedule-container">
                                <table className="schedule-table">
                                    <thead>
                                        <tr>
                                            <th className="employee-header">Employee</th>
                                            {visibleDates.map(({ date, isCurrentMonth, id }) => {
                                                const isLastDayOfWeek = date.getDay() === 6;
                                                return (
                                                    <th key={id} className={`day-header ${!isCurrentMonth ? 'locked-date' : ''} ${isWeekend(date) ? 'weekend' : ''} ${isToday(date) ? 'today' : ''} ${isLastDayOfWeek ? 'week-end' : ''}`}>
                                                        {getShortDayName(date)}
                                                        <span className="date-label">{date.getDate()}</span>
                                                    </th>
                                                );
                                            })}
                                            <th className="stats-header morning-header">M</th>
                                            <th className="stats-header afternoon-header">A</th>
                                            <th className="stats-header evening-header">E</th>
                                            <th className="stats-header night-header">N</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employees.map(renderEmployeeRow)}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td className="coverage-label">COVERAGE</td>
                                            {visibleDates.map(({ date, isCurrentMonth, id }) => {
                                                const isLastDayOfWeek = date.getDay() === 6;
                                                const m = employees.filter(e => e.schedule?.[id] === 'morning').length;
                                                const a = employees.filter(e => e.schedule?.[id] === 'afternoon').length;
                                                const ev = employees.filter(e => e.schedule?.[id] === 'evening').length;
                                                const n = employees.filter(e => e.schedule?.[id] === 'night').length;
                                                return (
                                                    <td key={id} className={`coverage-cell ${!isCurrentMonth ? 'locked-date' : ''} ${isLastDayOfWeek ? 'week-end' : ''}`}>
                                                        <div className="coverage-badges">
                                                            <span className={`coverage-badge morning ${m === 0 ? 'uncovered' : ''}`} title="Morning">{m}</span>
                                                            <span className={`coverage-badge afternoon ${a === 0 ? 'uncovered' : ''}`} title="Afternoon">{a}</span>
                                                            <span className={`coverage-badge evening ${ev === 0 ? 'uncovered' : ''}`} title="Evening">{ev}</span>
                                                            {(!ignoreNightShift || n > 0) && (
                                                                <span className={`coverage-badge night ${n === 0 && !ignoreNightShift ? 'uncovered' : ''}`} title="Night">{n}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                            <td colSpan={3} className="coverage-cell" />
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        <div className="shift-legend">
                            <div className="shift-legend-title">
                                Shift Times
                                {(user?.role === 'manager' || user?.role === 'super-admin') && (
                                    <button className="btn-edit-legend" onClick={() => setShowSettings(true)} title="Edit Shift Times">
                                        ✏️
                                    </button>
                                )}
                            </div>
                            <div className="shift-legend-items">
                                <div className="legend-item"><div className="legend-dot morning" /> Morning: {shiftTimes.morning}</div>
                                <div className="legend-item"><div className="legend-dot afternoon" /> Afternoon: {shiftTimes.afternoon}</div>
                                <div className="legend-item"><div className="legend-dot evening" /> Evening: {shiftTimes.evening}</div>
                                <div className="legend-item"><div className="legend-dot night" /> Night: {shiftTimes.night}</div>
                                <div className="legend-item"><div className="legend-dot annual" /> Annual Leave</div>
                                <div className="legend-item"><div className="legend-dot sick" /> Sick Leave</div>
                            </div>
                        </div>
                    </>
                ) : (
                    <Dashboard employees={employees} onOpenProfile={(emp) => { setSelectedProfile(emp); setShowProfile(true); }} onRemoveEmployee={removeEmployee} />
                )}

                {/* Modals Container */}
                {showAddEmployee && <AddEmployeeModal onClose={() => setShowAddEmployee(false)} onEmployeeAdded={refetchEmployees} />}
                {showProfile && selectedProfile && <ProfileModal employee={selectedProfile} onClose={() => setShowProfile(false)} onUpdate={refetchEmployees} />}
                {showApprovals && <ApprovalsInbox onClose={() => setShowApprovals(false)} onUpdate={() => { refetchEmployees(); setPendingCount(Math.max(0, pendingCount - 1)); }} />}
                {showWarnings && <WarningsModal warnings={warnings} onClose={() => setShowWarnings(false)} />}
                {showSettings && <SettingsModal shiftTimes={shiftTimes} onClose={() => setShowSettings(false)} onUpdate={(newTimes) => setShiftTimes(newTimes)} />}
                {requestTarget && <RequestChangeModal employee={requestTarget.employee} dateStr={requestTarget.date} currentShift={requestTarget.currentShift} onClose={() => setRequestTarget(null)} onSubmit={() => { refetchEmployees(); alert('Request submitted successfully'); }} />}
                {comboTarget && <ComboReasonModal employee={comboTarget.employee} dateStr={comboTarget.date} shift={comboTarget.shift} onClose={() => setComboTarget(null)} onSubmit={refetchEmployees} />}
                {showShuffle && <ShuffleModal employees={employees} onClose={() => setShowShuffle(false)} onShuffle={handleShuffle} />}
                {showMyRequests && <MyRequestsModal onClose={() => setShowMyRequests(false)} />}
                {showBroadcast && <BroadcastEmailModal employees={employees} onClose={() => setShowBroadcast(false)} onSend={() => setShowBroadcast(false)} />}
            </div>
        </AuthGuard>
    );
}
