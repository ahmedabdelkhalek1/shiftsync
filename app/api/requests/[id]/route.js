import { connectDB } from '@/lib/db';
import { ShiftRequest } from '@/models/ShiftRequest';
import { Employee } from '@/models/Employee';
import { User } from '@/models/User';
import { getSession } from '@/lib/auth';
import { sendEmail } from '@/lib/gmail';
import { changeRequestApprovedTemplate, changeRequestRejectedTemplate } from '@/lib/emailTemplates';

export async function PATCH(req, { params }) {
    try {
        const session = await getSession();
        if (!session || !['manager', 'super-admin'].includes(session.role)) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const { id } = await params;
        const { status, managerComment } = await req.json();

        if (!['approved', 'rejected'].includes(status)) {
            return Response.json({ error: 'Invalid status' }, { status: 400 });
        }

        const request = await ShiftRequest.findById(id);
        if (!request) return Response.json({ error: 'Request not found' }, { status: 404 });
        if (request.status !== 'pending') return Response.json({ error: 'Request already processed' }, { status: 400 });

        request.status = status;
        request.managerComment = managerComment || '';
        request.reviewedBy = session.userId;
        request.reviewedAt = new Date();
        await request.save();

        // If approved, update the employee's schedule
        if (status === 'approved') {
            const emp = await Employee.findById(request.employeeId);
            if (emp) {
                const prev = emp.schedule.get(request.date) || 'off-day';

                if (request.requestedShift === 'combo-in') {
                    emp.schedule.set(request.date, request.workingShift || 'morning');
                    emp.balances.combo = (emp.balances.combo || 0) + 1;
                    emp.comboHistory.push({ date: request.date, originalShift: prev, newShift: request.workingShift || 'morning', reason: request.reason, status: 'approved', type: 'combo-in' });
                } else if (request.requestedShift === 'combo-out') {
                    if ((emp.balances.combo || 0) <= 0) {
                        return Response.json({ error: 'Employee has no combo balance' }, { status: 400 });
                    }
                    emp.schedule.set(request.date, 'vacation');
                    emp.balances.combo = emp.balances.combo - 1;
                    emp.comboHistory.push({ date: request.date, originalShift: prev, newShift: 'vacation', reason: request.reason, status: 'approved', type: 'combo-out' });
                } else if (request.requestedShift === 'wfh') {
                    emp.wfhDays.set(request.date, true);
                    emp.balances.wfh = Math.max(0, (emp.balances.wfh || 0) - 1);
                } else if (request.requestedShift === 'annual-leave') {
                    emp.schedule.set(request.date, 'annual-leave');
                    emp.balances.annual = Math.max(0, (emp.balances.annual || 0) - 1);
                } else if (request.requestedShift === 'sick-leave') {
                    emp.schedule.set(request.date, 'sick-leave');
                    emp.balances.sick = Math.max(0, (emp.balances.sick || 0) - 1);
                } else {
                    emp.schedule.set(request.date, request.requestedShift);
                }

                await emp.save();
            }
        }

        // ── FEATURE 4B: Notify the employee (fire-and-forget) ───────────────
        User.findOne({ employeeId: request.employeeId }).select('email').lean().then(empUser => {
            if (!empUser?.email?.includes('@')) return;
            const displayShift = request.requestedShift === 'combo-in'
                ? (request.workingShift || 'morning')
                : request.requestedShift;
            const html = status === 'approved'
                ? changeRequestApprovedTemplate(request.employeeName, request.date, displayShift, request.managerComment)
                : changeRequestRejectedTemplate(request.employeeName, request.date, displayShift, request.managerComment);
            const subject = status === 'approved'
                ? '✅ Your Schedule Change Was Approved'
                : '❌ Your Schedule Change Was Not Approved';
            sendEmail(empUser.email, subject, html).catch(err =>
                console.error('[EMAIL] Request decision email failed:', err)
            );
        });

        return Response.json({ success: true, status });
    } catch (err) {
        console.error('PATCH request error:', err);
        return Response.json({ error: 'Server error' }, { status: 500 });
    }
}
