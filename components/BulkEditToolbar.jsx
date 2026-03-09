import { SHIFT_OPTIONS } from './ShiftCell';

export default function BulkEditToolbar({ selectedCount, selectedShift, onShiftChange, onApply, onClear }) {
    if (selectedCount === 0) return null;

    return (
        <div className="bulk-edit-toolbar" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-elevated)', padding: '6px 16px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-strong)', boxShadow: 'var(--shadow-md)' }}>
            <span className="selected-count" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brand-red-light)' }}>
                {selectedCount} selected
            </span>
            <select
                className="bulk-shift-select"
                value={selectedShift}
                onChange={e => onShiftChange(e.target.value)}
                style={{ padding: '6px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', outline: 'none' }}
            >
                <option value="">Change to...</option>
                {SHIFT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                <option value="wfh-toggle">🏠 Toggle WFH</option>
            </select>
            <button onClick={onApply} className="btn btn-primary btn-sm" disabled={!selectedShift}>Apply</button>
            <button onClick={onClear} className="btn btn-secondary btn-sm">Clear</button>
        </div>
    );
}
