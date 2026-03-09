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
        const { employeeId, date, shift, wfh } = await req.json();

        // Employees cannot directly set shifts — they must submit requests
        if (session.role === 'employee') {
            return Response.json({ error: 'Employees must submit a shift request' }, { status: 403 });
        }

        const emp = await Employee.findOne({ _id: employeeId, active: true });
        if (!emp) return Response.json({ error: 'Employee not found' }, { status: 404 });

        if (shift !== undefined) emp.schedule.set(date, shift);
        if (wfh !== undefined) emp.wfhDays.set(date, wfh);
        await emp.save();

        return Response.json({ success: true });
    } catch (err) {
        console.error('POST shift error:', err);
        return Response.json({ error: 'Server error' }, { status: 500 });
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
                if (u.shift !== undefined) emp.schedule.set(u.date, u.shift);
                if (u.wfh !== undefined) emp.wfhDays.set(u.date, u.wfh);
                await emp.save();
            }
        }

        return Response.json({ success: true });
    } catch (err) {
        console.error('PATCH shifts error:', err);
        return Response.json({ error: 'Server error' }, { status: 500 });
    }
}
