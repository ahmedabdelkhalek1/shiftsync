'use client';

import { useAuth } from '@/components/AuthProvider';

export const SHIFT_OPTIONS = [
    { value: 'morning', label: '🌅 Morning', shortLabel: 'Morning' },
    { value: 'afternoon', label: '☀️ Afternoon', shortLabel: 'Afternoon' },
    { value: 'evening', label: '🌆 Evening', shortLabel: 'Evening' },
    { value: 'night', label: '🌙 Night', shortLabel: 'Night' },
    { value: 'off-day', label: '🟢 Off Day', shortLabel: 'OFF' },
    { value: 'national', label: '🛡️ National', shortLabel: 'Nat. Service' },
    { value: 'combo-in', label: '📥 Combo In', shortLabel: 'Combo In' },
    { value: 'combo-out', label: '📤 Combo Out', shortLabel: 'Combo Out' },
    { value: 'vacation', label: '🏖️ Vacation', shortLabel: 'Vacation' },
    { value: 'annual-leave', label: '📅 Annual', shortLabel: 'Annual' },
    { value: 'sick-leave', label: '🏥 Sick', shortLabel: 'Sick' }
];

export default function ShiftCell({ employee, dateStr, shift, wfh, onShiftChange, onShiftRequest }) {
    const { user } = useAuth();

    // Use props directly — NO local useState.
    // This ensures the component always reflects the latest data from the API.
    const currentShift = shift || 'off-day';
    const currentWfh = wfh || false;

    const canEdit = user && ['manager', 'super-admin'].includes(user.role);
    const isSelf = user && user.employeeId === employee._id;

    const handleSelectChange = (e) => {
        e.stopPropagation(); // Prevent td click from firing
        const val = e.target.value;
        if (onShiftChange) {
            onShiftChange(employee._id, dateStr, val, currentWfh);
        }
    };

    const handleWfhToggle = (e) => {
        e.stopPropagation();
        e.preventDefault();
        const newWfh = !currentWfh;
        if (onShiftChange) {
            onShiftChange(employee._id, dateStr, currentShift, newWfh);
        }
    };

    const handleClick = (e) => {
        // Only fire for employees requesting changes — managers use the td onclick for selection
        if (!canEdit && isSelf && onShiftRequest) {
            onShiftRequest(employee, dateStr, currentShift);
        }
    };

    const shiftLabel = SHIFT_OPTIONS.find(op => op.value === currentShift)?.shortLabel || 'OFF';

    return (
        <div
            className="shift-grid-cell"
            onClick={handleClick}
            style={{ cursor: canEdit || isSelf ? 'pointer' : 'default', width: '100%', height: '100%' }}
        >
            {canEdit ? (
                <select
                    className={`shift-select ${currentShift}`}
                    value={currentShift}
                    onChange={handleSelectChange}
                    onClick={e => e.stopPropagation()}
                >
                    {SHIFT_OPTIONS.map(op => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                    ))}
                </select>
            ) : (
                <div className={`shift-select ${currentShift}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {shiftLabel}
                </div>
            )}

            {/* WFH Toggle */}
            {canEdit ? (
                ['morning', 'afternoon', 'evening', 'night'].includes(currentShift) && (
                    <button
                        className={`wfh-toggle ${currentWfh ? 'active' : ''}`}
                        onClick={handleWfhToggle}
                        title="Toggle Work From Home"
                    >
                        {currentWfh ? '🏠 WFH' : '🏠'}
                    </button>
                )
            ) : currentWfh && (
                <div className="wfh-toggle active" style={{ cursor: 'default' }}>🏠 WFH</div>
            )}
        </div>
    );
}
