import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';

export const SHIFT_OPTIONS = [
    { value: 'morning', label: '🌅 Morning', shortLabel: 'Morning' },
    { value: 'afternoon', label: '☀️ Afternoon', shortLabel: 'Afternoon' },
    { value: 'evening', label: '🌆 Evening', shortLabel: 'Evening' },
    { value: 'night', label: '🌙 Night', shortLabel: 'Night' },
    { value: 'off-day', label: '🟢 Off Day', shortLabel: 'OFF' },
    { value: 'national', label: '🛡️ National', shortLabel: 'Nat. Service' },
    { value: 'combo', label: '🔄 Combo', shortLabel: 'Combo' },
    { value: 'vacation', label: '🏖️ Vacation', shortLabel: 'Vacation' },
    { value: 'annual-leave', label: '📅 Annual', shortLabel: 'Annual' },
    { value: 'sick-leave', label: '🏥 Sick', shortLabel: 'Sick' }
];

export default function ShiftCell({ employee, dateStr, shift, wfh, onShiftChange, onShiftRequest }) {
    const { user } = useAuth();
    const [localShift, setLocalShift] = useState(shift || 'off-day');
    const [isWfh, setIsWfh] = useState(wfh || false);

    const canEdit = user && ['manager', 'super-admin'].includes(user.role);
    const isSelf = user && user.employeeId === employee._id;

    const handleSelectChange = (e) => {
        const val = e.target.value;
        setLocalShift(val);
        if (onShiftChange) {
            onShiftChange(employee._id, dateStr, val, isWfh);
        }
    };

    const handleWfhToggle = (e) => {
        e.stopPropagation();
        const newWfh = !isWfh;
        setIsWfh(newWfh);
        if (onShiftChange) {
            onShiftChange(employee._id, dateStr, localShift, newWfh);
        }
    };

    const handleClick = () => {
        if (!canEdit && isSelf && onShiftRequest) {
            onShiftRequest(employee, dateStr, localShift);
        }
    };

    const shiftLabel = SHIFT_OPTIONS.find(op => op.value === localShift)?.shortLabel || 'OFF';

    return (
        <td
            className="shift-cell"
            onClick={handleClick}
            style={{ cursor: canEdit || isSelf ? 'pointer' : 'default' }}
            title={isSelf && !canEdit ? "Click to request shift change" : undefined}
        >
            {canEdit ? (
                <select
                    className={`shift-select ${localShift}`}
                    value={localShift}
                    onChange={handleSelectChange}
                    onClick={e => e.stopPropagation()}
                >
                    {SHIFT_OPTIONS.map(op => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                    ))}
                </select>
            ) : (
                <div className={`shift-select ${localShift}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {shiftLabel}
                </div>
            )}

            {/* WFH Toggle */}
            {canEdit ? (
                <button
                    className={`wfh-toggle ${isWfh ? 'active' : ''}`}
                    onClick={handleWfhToggle}
                    title="Toggle Work From Home"
                >
                    {isWfh ? '🏠 WFH' : '🏠'}
                </button>
            ) : isWfh && (
                <div className="wfh-toggle active" style={{ cursor: 'default' }}>🏠 WFH</div>
            )}
        </td>
    );
}
