import { connectDB } from '@/lib/db';
import { Employee } from '@/models/Employee';
import { User } from '@/models/User';
import { getSession } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/email';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();

        let employees = await Employee.find({ active: true }).lean();

        // Convert Map fields to plain objects for JSON serialization
        const serialized = employees.map(emp => ({
            ...emp,
            _id: emp._id.toString(),
            schedule: emp.schedule ? Object.fromEntries(Object.entries(emp.schedule)) : {},
            wfhDays: emp.wfhDays ? Object.fromEntries(Object.entries(emp.wfhDays)) : {},
        }));

        return Response.json({ employees: serialized });
    } catch (err) {
        console.error('GET employees error:', err);
        return Response.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const session = await getSession();
        if (!session || !['manager', 'super-admin'].includes(session.role)) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const { name, gender, username, password, email } = await req.json();

        if (!name || !username || !password) {
            return Response.json({ error: 'Name, username, and password are required' }, { status: 400 });
        }

        // Check username uniqueness
        const existingUser = await User.findOne({ username: username.toLowerCase().trim() });
        if (existingUser) {
            return Response.json({ error: 'Username already taken' }, { status: 400 });
        }

        // Create employee record
        const employee = await Employee.create({
            name,
            gender: gender || 'male',
            createdBy: session.userId,
        });

        // Create user account
        const passwordHash = await User.hashPassword(password);
        const user = await User.create({
            username: username.toLowerCase().trim(),
            email: email || '',
            passwordHash,
            role: 'employee',
            employeeId: employee._id,
            createdBy: session.userId,
        });

        // Send welcome email if email provided
        if (email) {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            await sendWelcomeEmail(email, username, password, appUrl).catch(console.error);
        }

        return Response.json({
            success: true,
            employee: {
                ...employee.toObject(),
                _id: employee._id.toString(),
                schedule: {},
                wfhDays: {},
            },
            userId: user._id.toString(),
        });
    } catch (err) {
        console.error('POST employee error:', err);
        return Response.json({ error: 'Server error' }, { status: 500 });
    }
}
