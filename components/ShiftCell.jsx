'use client';

import { useAuth } from '@/components/AuthProvider';
import { useState } from 'react';

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

export default function ShiftCell({ employee, dateStr, shift, wfh, isComboIn, onShiftChange, onShiftRequest }) {
    const { user } = useAuth();
    const [isSaving, setIsSaving] = useState(false);

    const currentShift = shift || 'off-day';
    const currentWfh = wfh || false;

    const canEdit = user && ['manager', 'super-admin'].includes(user.role);
    const isSelf = user && user.employeeId === employee._id;

    const handleSelectChange = async (e) => {
        e.stopPropagation();
        const val = e.target.value;
        if (onShiftChange) {
            setIsSaving(true);
            try {
                await onShiftChange(employee._id, dateStr, val, currentWfh);
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleWfhToggle = async (e) => {
        e.stopPropagation();
        e.preventDefault();
        const newWfh = !currentWfh;
        if (onShiftChange) {
            setIsSaving(true);
            try {
                await onShiftChange(employee._id, dateStr, currentShift, newWfh);
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleClick = (e) => {
        if (!canEdit && isSelf && onShiftRequest) {
            onShiftRequest(employee, dateStr, currentShift);
        }
    };

    const shiftLabel = SHIFT_OPTIONS.find(op => op.value === currentShift)?.shortLabel || 'OFF';

    return (
        <div
            className="shift-grid-cell"
            onClick={handleClick}
            style={{ cursor: canEdit || isSelf ? 'pointer' : 'default', width: '100%', height: '100%', position: 'relative' }}
        >
            {isSaving && (
                <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 5, borderRadius: '4px', fontSize: '10px', color: 'white',
                    fontWeight: 700, letterSpacing: '0.5px'
                }}>
                    saving…
                </div>
            )}
            {canEdit ? (
                <div style={{ position: 'relative', width: '100%' }}>
                    <select
                        className={`shift-select ${currentShift}`}
                        value={currentShift}
                        onChange={handleSelectChange}
                        onClick={(e) => e.stopPropagation()}
                        disabled={isSaving}
                    >
                        {SHIFT_OPTIONS.map(op => (
                            <option key={op.value} value={op.value}>{op.label}</option>
                        ))}
                    </select>
                </div>
            ) : (
                <div className={`shift-select ${currentShift}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {shiftLabel}
                </div>
            )}

            {/* Badges Container (Bottom Left) */}
            <div style={{ position: 'absolute', bottom: '4px', left: '4px', display: 'flex', gap: '4px', zIndex: 2 }}>
                {isComboIn && (
                    <div className="wfh-toggle active" style={{ position: 'static', cursor: 'default', padding: '2px 6px' }}>
                        📥 Combo In
                    </div>
                )}
                
                {/* WFH Toggle */}
                {canEdit ? (
                    ['morning', 'afternoon', 'evening', 'night'].includes(currentShift) && (
                        <button
                            className={`wfh-toggle ${currentWfh ? 'active' : ''}`}
                            onClick={handleWfhToggle}
                            title="Toggle Work From Home"
                            disabled={isSaving}
                            style={{ position: 'static' }}
                        >
                            {currentWfh ? '🏠 WFH' : '🏠'}
                        </button>
                    )
                ) : currentWfh && (
                    <div className="wfh-toggle active" style={{ cursor: 'default', position: 'static' }}>🏠 WFH</div>
                )}
            </div>
        </div>
    );
}
