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

    // Selection & Bulk Edit
    const [selectedCells, setSelectedCells] = useState(new Set()); // Set of "empId|dateStr"
    const [bulkShiftSelect, setBulkShiftSelect] = useState('');

    // Warnings & Settings
    const [warnings, setWarnings] = useState([]);
    const [showWarnings, setShowWarnings] = useState(false);
    const [ignoreNightShift, setIgnoreNightShift] = useState(false);

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
            await fetch('/api/shifts', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates })
            });
            refetchEmployees();
            setSelectedCells(new Set());
            setBulkShiftSelect('');
        } catch { }
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
                    <button className="btn btn-profile" onClick={() => { setSelectedProfile(emp); setShowProfile(true); }}>Profile</button>
                </td>

                {/* Render day cells */}
                {visibleDates.map(({ date, isCurrentMonth, id }) => {
                    const shift = emp.schedule?.[id] || 'off-day';
                    const wfh = emp.wfhDays?.[id] || false;
                    const isSelected = selectedCells.has(`${emp._id}|${id}`);
                    const isFav = emp.favoriteOffDays?.includes(getDayName(date));

                    return (
                        <td
                            key={id}
                            className={`shift-cell ${!isCurrentMonth ? 'locked-date' : ''} ${isSelected ? 'selected' : ''}`}
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

                {/* Stats Columns */}
                <td className="stats-cell">{Object.values(emp.schedule || {}).filter(s => ['morning', 'afternoon', 'evening', 'night'].includes(s)).length}</td>
                <td className="stats-cell warning">{Object.values(emp.schedule || {}).filter(s => s === 'combo').length}</td>
                <td className="stats-cell error">{Object.values(emp.schedule || {}).filter(s => s === 'night').length}</td>
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
                                    <button className="btn btn-secondary btn-sm" onClick={() => setShowShuffle(true)}>🔀 Smart Shuffle</button>
                                    <BulkEditToolbar
                                        selectedCount={selectedCells.size}
                                        selectedShift={bulkShiftSelect}
                                        onShiftChange={setBulkShiftSelect}
                                        onApply={applyBulkEdit}
                                        onClear={() => setSelectedCells(new Set())}
                                    />
                                    <div className="warning-settings" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={ignoreNightShift} onChange={e => setIgnoreNightShift(e.target.checked)} />
                                            Ignore Night Shift Warning
                                        </label>
                                        <button className="btn btn-icon" onClick={() => setShowWarnings(true)} title="Show All Warnings" style={{ position: 'relative' }}>
                                            ⚠️ {warnings.length > 0 && <span className="badge-dot" style={{ position: 'absolute', top: '-2px', right: '-2px', background: 'var(--brand-red)', border: '2px solid var(--bg-app)', borderRadius: '50%', width: '10px', height: '10px' }} />}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="schedule-wrapper">
                            <div className="schedule-container">
                                <table className="schedule-table">
                                    <thead>
                                        <tr>
                                            <th className="employee-header">Employee</th>
                                            {visibleDates.map(({ date, isCurrentMonth, id }) => (
                                                <th key={id} className={`day-header ${!isCurrentMonth ? 'locked-date' : ''} ${isWeekend(date) ? 'weekend' : ''} ${isToday(date) ? 'today' : ''}`}>
                                                    {getShortDayName(date)}
                                                    <span className="date-label">{date.getDate()}</span>
                                                </th>
                                            ))}
                                            <th className="stats-header">Shifts</th>
                                            <th className="stats-header">Combos</th>
                                            <th className="stats-header">Nights</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employees.map(renderEmployeeRow)}
                                    </tbody>
                                </table>
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
                {requestTarget && <RequestChangeModal employee={requestTarget.employee} dateStr={requestTarget.date} currentShift={requestTarget.currentShift} onClose={() => setRequestTarget(null)} onSubmit={() => { refetchEmployees(); alert('Request submitted successfully'); }} />}
                {comboTarget && <ComboReasonModal employee={comboTarget.employee} dateStr={comboTarget.date} shift={comboTarget.shift} onClose={() => setComboTarget(null)} onSubmit={refetchEmployees} />}
                {showShuffle && <ShuffleModal employees={employees} onClose={() => setShowShuffle(false)} onShuffle={handleShuffle} />}
            </div>
        </AuthGuard>
    );
}
