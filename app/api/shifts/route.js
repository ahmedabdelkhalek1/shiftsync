import { connectDB } from '@/lib/db';
import { Employee } from '@/models/Employee';
import { User } from '@/models/User';
import { ShiftRequest } from '@/models/ShiftRequest';
import { getSession } from '@/lib/auth';
import { sendEmail } from '@/lib/gmail';
import { schedulePublishedTemplate, scheduleUpdatedTemplate } from '@/lib/emailTemplates';

// Helper: get name of a manager User by userId string
async function getManagerName(managerId) {
    try {
        const mgr = await User.findById(managerId).select('username').lean();
        return mgr?.username || 'Your Manager';
    } catch {
        return 'Your Manager';
    }
}

// Helper: send emails to all employees of a manager (fire-and-forget)
async function notifyAllEmployees(managerId, subject, htmlFn) {
    const employees = await Employee.find({ createdBy: managerId, active: true }).select('_id').lean();
    if (!employees.length) return;

    const empIds = employees.map(e => e._id);
    const users = await User.find({ employeeId: { $in: empIds }, active: true }).select('email').lean();

    const sends = users
        .filter(u => u.email && u.email.includes('@'))
        .map(u => sendEmail(u.email, subject, htmlFn()));

    await Promise.allSettled(sends);
}

// POST /api/shifts — set single shift (manager) → Feature 5: notify affected employee
export async function POST(req) {
    try {
        const session = await getSession();
        if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const { employeeId, date, shift, wfh, reason } = await req.json();

        if (session.role === 'employee') {
            return Response.json({ error: 'Employees must submit a shift request' }, { status: 403 });
        }

        const emp = await Employee.findOne({ _id: employeeId, active: true });
        if (!emp) return Response.json({ error: 'Employee not found' }, { status: 404 });

        const previousShift = emp.schedule.get(date) || 'off-day';

        if (shift !== undefined) {
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

            const isEarningCombo = (shift === 'combo-in' && previousShift !== 'combo-in') ||
                (previousShift === 'vacation' && ['morning', 'afternoon', 'evening', 'night'].includes(shift));

            if (isEarningCombo) {
                emp.comboHistory.push({
                    date, originalShift: previousShift, newShift: shift,
                    reason: reason || 'Manual Update', type: 'combo-in', status: 'approved'
                });
            } else if (shift === 'combo-out' && previousShift !== 'combo-out') {
                emp.comboHistory.push({
                    date, originalShift: previousShift, newShift: shift,
                    reason: reason || 'Assigned Off Day', type: 'combo-out', status: 'approved'
                });
            }

            emp.schedule.set(date, shift);
        }

        if (wfh !== undefined) emp.wfhDays.set(date, wfh);

        if (emp.reconcileBalances) emp.reconcileBalances();
        await emp.save();

        // ── FEATURE 5: Notify employee that their schedule was updated ──
        const empUser = await User.findOne({ employeeId: emp._id }).select('email').lean();
        if (empUser?.email && empUser.email.includes('@')) {
            const managerName = await getManagerName(session.userId);
            const html = scheduleUpdatedTemplate(managerName);
            try {
                await sendEmail(
                    empUser.email,
                    '⚠️ Your Schedule Has Been Updated — Please Review',
                    html
                );
            } catch (err) {
                console.error('[EMAIL] Schedule update notification failed:', err);
            }
        }

        return Response.json({ success: true });
    } catch (err) {
        console.error('POST shift error:', err);
        return Response.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}

// PATCH /api/shifts — bulk update (manager) → Feature 3: schedule published email
export async function PATCH(req) {
    try {
        const session = await getSession();
        if (!session || !['manager', 'super-admin'].includes(session.role)) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        // publish flag + month/year are optional extras; updates is the main payload
        const { updates, publish, month, year } = await req.json();

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

                    const isEarningCombo = (u.shift === 'combo-in' && prev !== 'combo-in') ||
                        (prev === 'vacation' && ['morning', 'afternoon', 'evening', 'night'].includes(u.shift));

                    if (isEarningCombo) {
                        emp.comboHistory.push({
                            date: u.dateStr, originalShift: prev, newShift: u.shift,
                            reason: 'Bulk Update', type: 'combo-in', status: 'approved'
                        });
                    } else if (u.shift === 'combo-out' && prev !== 'combo-out') {
                        emp.comboHistory.push({
                            date: u.dateStr, originalShift: prev, newShift: u.shift,
                            reason: 'Bulk Assigned Off Day', type: 'combo-out', status: 'approved'
                        });
                    }

                    emp.schedule.set(u.dateStr, u.shift);
                }
                if (u.wfh !== undefined) emp.wfhDays.set(u.dateStr, u.wfh);
            }

            if (emp.reconcileBalances) emp.reconcileBalances();
            await emp.save();
        }

        // ── FEATURE 3: If this is a publish action, email all employees ──
        if (publish && month && year) {
            const managerName = await getManagerName(session.userId);
            try {
                await notifyAllEmployees(
                    session.userId,
                    `📅 New Schedule Published — ${month} ${year}`,
                    () => schedulePublishedTemplate(managerName, month, year)
                );
            } catch (err) {
                console.error('[EMAIL] Schedule published notification failed:', err);
            }
        }

        return Response.json({ success: true });
    } catch (err) {
        console.error('PATCH shifts error:', err);
        return Response.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
