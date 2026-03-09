import { connectDB } from '@/lib/db';
import { ShiftRequest } from '@/models/ShiftRequest';
import { Employee } from '@/models/Employee';
import { getSession } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();

        let requests;
        if (session.role === 'employee') {
            requests = await ShiftRequest.find({ employeeId: session.employeeId }).sort({ createdAt: -1 }).lean();
        } else {
            requests = await ShiftRequest.find({}).sort({ createdAt: -1 }).lean();
        }

        return Response.json({ requests: requests.map(r => ({ ...r, _id: r._id.toString(), employeeId: r.employeeId.toString() })) });
    } catch (err) {
        return Response.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'employee') {
            return Response.json({ error: 'Only employees can submit requests' }, { status: 403 });
        }

        await connectDB();
        const { date, currentShift, requestedShift, workingShift, reason } = await req.json();

        const emp = await Employee.findOne({ _id: session.employeeId, active: true });
        if (!emp) return Response.json({ error: 'Employee not found' }, { status: 404 });

        // Check for duplicate pending request for same date
        const existing = await ShiftRequest.findOne({ employeeId: session.employeeId, date, status: 'pending' });
        if (existing) return Response.json({ error: 'You already have a pending request for this date' }, { status: 400 });

        const request = await ShiftRequest.create({
            employeeId: session.employeeId,
            employeeName: emp.name,
            date,
            currentShift,
            requestedShift,
            workingShift: workingShift || null,
            reason: reason || '',
        });

        return Response.json({ success: true, request: { ...request.toObject(), _id: request._id.toString() } });
    } catch (err) {
        console.error('POST request error:', err);
        return Response.json({ error: 'Server error' }, { status: 500 });
    }
}
