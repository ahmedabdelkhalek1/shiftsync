import { connectDB } from '@/lib/db';
import { Employee } from '@/models/Employee';
import { ShiftRequest } from '@/models/ShiftRequest';
import { getSession } from '@/lib/auth';

// POST /api/shifts — set single shift (manager)
export async function POST(req) {
    try {
        const session = await getSession();
        if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const { employeeId, date, shift, wfh, reason } = await req.json();

        // Employees cannot directly set shifts — they must submit requests
        if (session.role === 'employee') {
            return Response.json({ error: 'Employees must submit a shift request' }, { status: 403 });
        }

        const emp = await Employee.findOne({ _id: employeeId, active: true });
        if (!emp) return Response.json({ error: 'Employee not found' }, { status: 404 });

        const previousShift = emp.schedule.get(date) || 'off-day';

        if (shift !== undefined) {
            // Leave Deduction Logic
            if (shift === 'annual-leave' && previousShift !== 'annual-leave') {
                if (emp.balances.annual > 0) emp.balances.annual--;
            } else if (previousShift === 'annual-leave' && shift !== 'annual-leave') {
                emp.balances.annual++;
            }

            if (shift === 'sick-leave' && previousShift !== 'sick-leave') {
                if (emp.balances.sick > 0) emp.balances.sick--;
            } else if (previousShift === 'sick-leave' && shift !== 'sick-leave') {
                emp.balances.sick++;
            }

            // Combo history recording
            const isEarningCombo = (shift === 'combo-in' && previousShift !== 'combo-in') ||
                (previousShift === 'vacation' && ['morning', 'afternoon', 'evening', 'night'].includes(shift));

            if (isEarningCombo) {
                emp.comboHistory.push({
                    date: date,
                    originalShift: previousShift,
                    newShift: shift,
                    reason: reason || 'Manual Update',
                    type: 'combo-in',
                    status: 'approved'
                });
            } else if (shift === 'combo-out' && previousShift !== 'combo-out') {
                emp.comboHistory.push({
                    date: date,
                    originalShift: previousShift,
                    newShift: shift,
                    reason: reason || 'Assigned Off Day',
                    type: 'combo-out',
                    status: 'approved'
                });
            }

            emp.schedule.set(date, shift);
        }

        if (wfh !== undefined) emp.wfhDays.set(date, wfh);

        // Reconcile Balances
        if (emp.reconcileBalances) emp.reconcileBalances();

        await emp.save();
        return Response.json({ success: true });
    } catch (err) {
        console.error('POST shift error:', err);
        return Response.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}

// PATCH /api/shifts — bulk update multiple shifts (manager only)
// Optimised to prevent VersionError by grouping updates by employee
export async function PATCH(req) {
    try {
        const session = await getSession();
        if (!session || !['manager', 'super-admin'].includes(session.role)) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const { updates } = await req.json(); // [{ employeeId, dateStr, shift, wfh }]

        // 1. Group updates by employee
        const grouped = updates.reduce((acc, upd) => {
            if (!acc[upd.employeeId]) acc[upd.employeeId] = [];
            acc[upd.employeeId].push(upd);
            return acc;
        }, {});

        // 2. Process each employee once
        for (const [employeeId, empUpdates] of Object.entries(grouped)) {
            const emp = await Employee.findOne({ _id: employeeId, active: true });
            if (!emp) continue;

            for (const u of empUpdates) {
                if (u.shift !== undefined) {
                    const prev = emp.schedule.get(u.dateStr) || 'off-day';

                    // Logic parity with single update (Leave Deduction)
                    if (u.shift === 'annual-leave' && prev !== 'annual-leave') {
                        if (emp.balances.annual > 0) emp.balances.annual--;
                    } else if (prev === 'annual-leave' && u.shift !== 'annual-leave') {
                        emp.balances.annual++;
                    }

                    if (u.shift === 'sick-leave' && prev !== 'sick-leave') {
                        if (emp.balances.sick > 0) emp.balances.sick--;
                    } else if (prev === 'sick-leave' && u.shift !== 'sick-leave') {
                        emp.balances.sick++;
                    }

                    // Combo history recording (Logic parity with single update)
                    const isEarningCombo = (u.shift === 'combo-in' && prev !== 'combo-in') ||
                        (prev === 'vacation' && ['morning', 'afternoon', 'evening', 'night'].includes(u.shift));

                    if (isEarningCombo) {
                        emp.comboHistory.push({
                            date: u.dateStr,
                            originalShift: prev,
                            newShift: u.shift,
                            reason: 'Bulk Update',
                            type: 'combo-in',
                            status: 'approved'
                        });
                    } else if (u.shift === 'combo-out' && prev !== 'combo-out') {
                        emp.comboHistory.push({
                            date: u.dateStr,
                            originalShift: prev,
                            newShift: u.shift,
                            reason: 'Bulk Assigned Off Day',
                            type: 'combo-out',
                            status: 'approved'
                        });
                    }

                    emp.schedule.set(u.dateStr, u.shift);
                }
                if (u.wfh !== undefined) emp.wfhDays.set(u.dateStr, u.wfh);
            }

            if (emp.reconcileBalances) emp.reconcileBalances();
            await emp.save();
        }

        return Response.json({ success: true });
    } catch (err) {
        console.error('PATCH shifts error:', err);
        return Response.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
