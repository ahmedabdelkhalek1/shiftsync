import { connectDB } from '@/lib/db';
import { Employee } from '@/models/Employee';
import { User } from '@/models/User';
import { ShiftRequest } from '@/models/ShiftRequest';
import { getSession } from '@/lib/auth';
import { sendEmail } from '@/lib/gmail';
import { schedulePublishedTemplate, scheduleUpdatedTemplate } from '@/lib/emailTemplates';
import { validateShift, validateDate, validateText, validateObjectId } from '@/lib/validate';

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

// POST /api/shifts — set single shift (manager only)
export async function POST(req) {
    try {
        const session = await getSession();
        if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
        if (session.role === 'employee') {
            return Response.json({ error: 'Employees must submit a shift request' }, { status: 403 });
        }

        await connectDB();
        const { employeeId, date, shift, wfh, reason, isComboIn } = await req.json();

        // ── Input Validation ───────────────────────────────────────────────────
        const idCheck = validateObjectId(employeeId, 'employeeId');
        if (!idCheck.valid) return Response.json({ error: idCheck.error }, { status: 400 });

        const dateCheck = validateDate(date);
        if (!dateCheck.valid) return Response.json({ error: dateCheck.error }, { status: 400 });

        if (shift !== undefined) {
            const shiftCheck = validateShift(shift);
            if (!shiftCheck.valid) return Response.json({ error: shiftCheck.error }, { status: 400 });
        }

        if (reason !== undefined) {
            const reasonCheck = validateText(reason, 'Reason', { maxLength: 300 });
            if (!reasonCheck.valid) return Response.json({ error: reasonCheck.error }, { status: 400 });
        }

        // ── Manager Isolation ──────────────────────────────────────────────────
        // Build query: managers can only modify employees they created
        const ownershipFilter = session.role === 'manager'
            ? { _id: employeeId, createdBy: session.userId, active: true }
            : { _id: employeeId, active: true }; // super-admin can access all

        const emp = await Employee.findOne(ownershipFilter);
        if (!emp) {
            return Response.json({ error: 'Employee not found or access denied' }, { status: 404 });
        }

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

            // WFH balance deduction (Fix #16 from audit)
            if (shift !== 'off-day' && wfh === true && !emp.wfhDays.get(date)) {
                if (emp.balances.wfh > 0) emp.balances.wfh--;
            } else if (emp.wfhDays.get(date) && (wfh === false || shift === 'off-day')) {
                emp.balances.wfh++;
            }

            const wasComboIn = emp.comboHistory.some(h => h.date === date && h.type === 'combo-in');

            if (isComboIn && !wasComboIn) {
                emp.comboHistory.push({
                    date, originalShift: previousShift, newShift: shift,
                    reason: reason || 'Manual Update', type: 'combo-in', status: 'approved'
                });
            } else if (!isComboIn && wasComboIn) {
                // If the user changed the shift away from combo-in (e.g., to Off Day), remove the combo history
                emp.comboHistory = emp.comboHistory.filter(h => !(h.date === date && h.type === 'combo-in'));
            }

            if (shift === 'combo-out' && previousShift !== 'combo-out') {
                emp.comboHistory.push({
                    date, originalShift: previousShift, newShift: shift,
                    reason: reason || 'Assigned Off Day', type: 'combo-out', status: 'approved'
                });
            } else if (shift !== 'combo-out' && previousShift === 'combo-out') {
                emp.comboHistory = emp.comboHistory.filter(h => !(h.date === date && h.type === 'combo-out'));
            }

            emp.schedule.set(date, shift);
        }

        if (wfh !== undefined) emp.wfhDays.set(date, wfh);

        if (emp.reconcileBalances) emp.reconcileBalances();
        await emp.save();

        // ── Notify employee (fire-and-forget — don't block response) ──────────
        const empUser = await User.findOne({ employeeId: emp._id }).select('email').lean();
        if (empUser?.email && empUser.email.includes('@')) {
            getManagerName(session.userId).then(managerName => {
                sendEmail(
                    empUser.email,
                    '⚠️ Your Schedule Has Been Updated — Please Review',
                    scheduleUpdatedTemplate(managerName)
                ).catch(err => console.error('[EMAIL] Schedule update notification failed:', err));
            });
        }

        return Response.json({ success: true });
    } catch (err) {
        console.error('POST shift error:', err);
        return Response.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}

// PATCH /api/shifts — bulk update (manager) → schedule published email
export async function PATCH(req) {
    try {
        const session = await getSession();
        if (!session || !['manager', 'super-admin'].includes(session.role)) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const { updates, publish, month, year } = await req.json();

        if (!Array.isArray(updates)) {
            return Response.json({ error: 'updates must be an array' }, { status: 400 });
        }

        // ── Input Validation on each update ───────────────────────────────────
        for (const u of updates) {
            const idCheck = validateObjectId(u.employeeId, 'employeeId');
            if (!idCheck.valid) return Response.json({ error: idCheck.error }, { status: 400 });

            const dateCheck = validateDate(u.dateStr);
            if (!dateCheck.valid) return Response.json({ error: dateCheck.error }, { status: 400 });

            if (u.shift !== undefined) {
                const shiftCheck = validateShift(u.shift);
                if (!shiftCheck.valid) return Response.json({ error: shiftCheck.error }, { status: 400 });
            }
        }

        // 1. Group by employee
        const grouped = updates.reduce((acc, upd) => {
            if (!acc[upd.employeeId]) acc[upd.employeeId] = [];
            acc[upd.employeeId].push(upd);
            return acc;
        }, {});

        // ── Manager Isolation ──────────────────────────────────────────────────
        // Batch-load employees the manager actually owns (single DB query)
        const requestedIds = Object.keys(grouped);
        const ownershipFilter = session.role === 'manager'
            ? { _id: { $in: requestedIds }, createdBy: session.userId, active: true }
            : { _id: { $in: requestedIds }, active: true };

        const empList = await Employee.find(ownershipFilter);

        // 2. Process each valid employee
        for (const emp of empList) {
            const empUpdates = grouped[emp._id.toString()] || [];

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

                    const wasComboIn = emp.comboHistory.some(h => h.date === u.dateStr && h.type === 'combo-in');
                    const isEarningCombo = u.isComboIn || (u.shift === 'combo-in' && prev !== 'combo-in') ||
                        (prev === 'vacation' && ['morning', 'afternoon', 'evening', 'night'].includes(u.shift));

                    if (isEarningCombo && !wasComboIn) {
                        emp.comboHistory.push({
                            date: u.dateStr, originalShift: prev, newShift: u.shift,
                            reason: u.reason || 'Bulk Update', type: 'combo-in', status: 'approved'
                        });
                    } else if (!isEarningCombo && wasComboIn) {
                        emp.comboHistory = emp.comboHistory.filter(h => !(h.date === u.dateStr && h.type === 'combo-in'));
                    }

                    const wasComboOut = emp.comboHistory.some(h => h.date === u.dateStr && h.type === 'combo-out');
                    if (u.shift === 'combo-out' && !wasComboOut) {
                        emp.comboHistory.push({
                            date: u.dateStr, originalShift: prev, newShift: u.shift,
                            reason: u.reason || 'Bulk Assigned Off Day', type: 'combo-out', status: 'approved'
                        });
                    } else if (u.shift !== 'combo-out' && wasComboOut) {
                        emp.comboHistory = emp.comboHistory.filter(h => !(h.date === u.dateStr && h.type === 'combo-out'));
                    }

                    emp.schedule.set(u.dateStr, u.shift);
                }
                if (u.wfh !== undefined) emp.wfhDays.set(u.dateStr, u.wfh);
            }

            if (emp.reconcileBalances) emp.reconcileBalances();
            await emp.save();
        }

        // ── Publish: email all employees (fire-and-forget) ────────────────────
        if (publish && month && year) {
            const monthCheck = validateText(month, 'month', { required: true, maxLength: 20 });
            const yearCheck = validateText(year, 'year', { required: true, maxLength: 4 });
            if (!monthCheck.valid || !yearCheck.valid) {
                return Response.json({ error: 'Invalid month or year' }, { status: 400 });
            }

            getManagerName(session.userId).then(managerName => {
                notifyAllEmployees(
                    session.userId,
                    `📅 New Schedule Published — ${month} ${year}`,
                    () => schedulePublishedTemplate(managerName, month, year)
                ).catch(err => console.error('[EMAIL] Schedule published notification failed:', err));
            });
        }

        return Response.json({ success: true });
    } catch (err) {
        console.error('PATCH shifts error:', err);
        return Response.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
