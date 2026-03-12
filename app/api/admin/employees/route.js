import { connectDB } from '@/lib/db';
import { Employee } from '@/models/Employee';
import { User } from '@/models/User';
import { getSession } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== 'super-admin') {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();

        // Fetch all employees and populate the creator to show manager mapping
        const employees = await Employee.find({}).populate('createdBy', 'username email').lean();

        // Fetch emails from the User collection for all these employees (for their own email field)
        const employeeIds = employees.map(e => e._id);
        const users = await User.find({ employeeId: { $in: employeeIds } }).select('employeeId email').lean();
        
        // Map employeeId -> email for quick lookup
        const emailMap = {};
        users.forEach(u => {
            if (u.employeeId) emailMap[u.employeeId.toString()] = u.email || '';
        });

        // Convert Map fields to avoid JSON errors
        const serialized = employees.map(emp => ({
            ...emp,
            _id: emp._id.toString(),
            email: emailMap[emp._id.toString()] || '',
            createdBy: emp.createdBy ? {
                _id: emp.createdBy._id.toString(),
                username: emp.createdBy.username,
                email: emp.createdBy.email
            } : null,
            schedule: emp.schedule ? Object.fromEntries(Object.entries(emp.schedule)) : {},
            wfhDays: emp.wfhDays ? Object.fromEntries(Object.entries(emp.wfhDays)) : {}
        }));

        return Response.json({ employees: serialized });
    } catch (err) {
        console.error('GET admin employees error:', err);
        return Response.json({ error: 'Server error' }, { status: 500 });
    }
}
