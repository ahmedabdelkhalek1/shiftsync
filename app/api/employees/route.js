import { connectDB } from '@/lib/db';
import { Employee } from '@/models/Employee';
import { User } from '@/models/User';
import { getSession } from '@/lib/auth';
import { sendEmail } from '@/lib/gmail';
import { welcomeEmailTemplate } from '@/lib/emailTemplates';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();

        let employees = [];

        if (session.role === 'super-admin') {
            employees = await Employee.find({ active: true }).lean();
        } else if (session.role === 'manager') {
            employees = await Employee.find({ createdBy: session.userId, active: true }).lean();
        } else if (session.role === 'employee') {
            const self = await Employee.findById(session.employeeId);
            if (self && self.createdBy) {
                employees = await Employee.find({ createdBy: self.createdBy, active: true }).lean();
            } else {
                employees = self ? [self] : [];
            }
        }

        // Fetch emails from the User collection for all these employees
        const employeeIds = employees.map(e => e._id);
        const users = await User.find({ employeeId: { $in: employeeIds } }).select('employeeId email').lean();
        
        // Map employeeId -> email for quick lookup
        const emailMap = {};
        users.forEach(u => {
            if (u.employeeId) emailMap[u.employeeId.toString()] = u.email || '';
        });

        const serialized = employees.map(emp => ({
            ...emp,
            _id: emp._id.toString(),
            email: emailMap[emp._id.toString()] || '',
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
            email: email ? email.toLowerCase().trim() : '',
            passwordHash,
            role: 'employee',
            employeeId: employee._id,
            createdBy: session.userId,
        });

        // ── FEATURE 2: Send welcome email ────────────────────────
        if (email && email.includes('@')) {
            const html = welcomeEmailTemplate(name, username.toLowerCase().trim(), password);
            try {
                await sendEmail(
                    email,
                    'Welcome to ShiftSync — Your Account is Ready 🎉',
                    html
                );
            } catch (err) {
                console.error('[EMAIL] Welcome email failed:', err);
            }
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
