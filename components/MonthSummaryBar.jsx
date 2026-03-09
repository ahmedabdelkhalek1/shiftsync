'use client';

export default function MonthSummaryBar({ employees, visibleDates }) {
    const currentMonthDates = visibleDates.filter(d => d.isCurrentMonth);
    const totalEmployees = employees.length;

    let totalAssigned = 0;
    let totalOffDays = 0;
    let totalShiftSlots = 0;

    currentMonthDates.forEach(({ id }) => {
        employees.forEach(emp => {
            const s = emp.schedule?.[id] || 'off-day';
            totalShiftSlots++;
            if (['morning', 'afternoon', 'evening', 'night'].includes(s)) totalAssigned++;
            if (s === 'off-day') totalOffDays++;
        });
    });

    const coveragePct = totalShiftSlots > 0 ? Math.round((totalAssigned / totalShiftSlots) * 100) : 0;

    const stats = [
        { label: 'Employees', value: totalEmployees, icon: '👥', color: 'var(--text-primary)' },
        { label: 'Shifts Assigned', value: totalAssigned, icon: '📋', color: 'var(--color-morning)' },
        { label: 'Coverage', value: `${coveragePct}%`, icon: '📊', color: coveragePct >= 70 ? 'var(--brand-green-light)' : 'var(--brand-red-light)' },
        { label: 'Working Days', value: currentMonthDates.length, icon: '📅', color: 'var(--color-evening)' },
        { label: 'Off Days', value: totalOffDays, icon: '🟢', color: 'var(--color-off-day)' },
    ];

    return (
        <div style={{ display: 'flex', gap: '12px', padding: '10px 0', flexWrap: 'wrap' }}>
            {stats.map(({ label, value, icon, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '8px 14px', border: '1px solid var(--border-subtle)', flex: '1', minWidth: '110px' }}>
                    <span style={{ fontSize: '18px' }}>{icon}</span>
                    <div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>{label}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}
