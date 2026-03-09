import { connectDB } from '@/lib/db';
import { Employee } from '@/models/Employee';
import { ShiftRequest } from '@/models/ShiftRequest';
import { getSession } from '@/lib/auth';

// POST /api/shifts — set shift (manager) or update schedule
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
            // Leave Deduction Logic (Parity with Legacy)
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

        // Reconcile Balances (Combo logic)
        if (emp.reconcileBalances) emp.reconcileBalances();

        await emp.save();

        return Response.json({ success: true });
    } catch (err) {
        console.error('POST shift error:', err);
        return Response.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}

// PATCH /api/shifts — bulk update multiple shifts (manager only)
export async function PATCH(req) {
    try {
        const session = await getSession();
        if (!session || !['manager', 'super-admin'].includes(session.role)) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const { updates } = await req.json(); // [{ employeeId, date, shift }]

        for (const u of updates) {
            const emp = await Employee.findOne({ _id: u.employeeId, active: true });
            if (emp) {
                if (u.shift !== undefined) {
                    const prev = emp.schedule.get(u.dateStr) || 'off-day';
                    // Apply leave logic in bulk too
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

                    emp.schedule.set(u.dateStr, u.shift);
                }
                if (u.wfh !== undefined) emp.wfhDays.set(u.dateStr, u.wfh);

                if (emp.reconcileBalances) emp.reconcileBalances();
                await emp.save();
            }
        }

        return Response.json({ success: true });
    } catch (err) {
        console.error('PATCH shifts error:', err);
        return Response.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
