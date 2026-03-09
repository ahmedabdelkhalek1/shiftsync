import { connectDB } from '@/lib/db';
import { Employee } from '@/models/Employee';
import { User } from '@/models/User';
import { getSession } from '@/lib/auth';

export async function GET(req, { params }) {
    try {
        const session = await getSession();
        if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const { id } = await params;

        // Employees can only view their own
        if (session.role === 'employee' && session.employeeId !== id) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        const emp = await Employee.findOne({ _id: id, active: true }).lean();
        if (!emp) return Response.json({ error: 'Employee not found' }, { status: 404 });

        return Response.json({
            employee: {
                ...emp,
                _id: emp._id.toString(),
                schedule: emp.schedule ? Object.fromEntries(Object.entries(emp.schedule)) : {},
                wfhDays: emp.wfhDays ? Object.fromEntries(Object.entries(emp.wfhDays)) : {},
            }
        });
    } catch (err) {
        return Response.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    try {
        const session = await getSession();
        if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const { id } = await params;
        const body = await req.json();

        const emp = await Employee.findOne({ _id: id, active: true });
        if (!emp) return Response.json({ error: 'Employee not found' }, { status: 404 });

        // Employees can only update limited fields (favoriteOffDays)
        if (session.role === 'employee') {
            if (session.employeeId !== id) return Response.json({ error: 'Forbidden' }, { status: 403 });
            if (body.favoriteOffDays !== undefined) emp.favoriteOffDays = body.favoriteOffDays;
        } else {
            // Managers can update all fields
            if (body.name !== undefined) emp.name = body.name;
            if (body.gender !== undefined) emp.gender = body.gender;
            if (body.role !== undefined) emp.role = body.role;
            if (body.favoriteOffDays !== undefined) emp.favoriteOffDays = body.favoriteOffDays;
            if (body.balances !== undefined) emp.balances = { ...emp.balances.toObject(), ...body.balances };
            if (body.comboHistory !== undefined) emp.comboHistory = body.comboHistory;
            if (body.ignoredWarnings !== undefined) emp.ignoredWarnings = body.ignoredWarnings;
        }

        await emp.save();
        return Response.json({
            success: true,
            employee: {
                ...emp.toObject(),
                _id: emp._id.toString(),
                schedule: emp.schedule ? Object.fromEntries(Object.entries(emp.schedule)) : {},
                wfhDays: emp.wfhDays ? Object.fromEntries(Object.entries(emp.wfhDays)) : {}
            }
        });
    } catch (err) {
        console.error('PUT employee error:', err);
        return Response.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const session = await getSession();
        if (!session || !['manager', 'super-admin'].includes(session.role)) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const { id } = await params;

        // Soft-delete employee
        await Employee.findByIdAndUpdate(id, { active: false });
        // Deactivate linked user
        await User.findOneAndUpdate({ employeeId: id }, { active: false });

        return Response.json({ success: true });
    } catch (err) {
        return Response.json({ error: 'Server error' }, { status: 500 });
    }
}
