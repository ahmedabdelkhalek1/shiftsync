import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { getSession } from '@/lib/auth';
import { sendEmail } from '@/lib/gmail';
import { welcomeEmailTemplate } from '@/lib/emailTemplates';

// GET all users (super-admin only) 
export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== 'super-admin') {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const users = await User.find({}).select('-passwordHash -resetToken -resetTokenExpiry').lean();
        return Response.json({ users: users.map(u => ({ ...u, _id: u._id.toString() })) });
    } catch (err) {
        return Response.json({ error: 'Server error' }, { status: 500 });
    }
}

// POST create a manager (super-admin only)
export async function POST(req) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'super-admin') {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const { username, password, email, role } = await req.json();

        if (!username || !password) {
            return Response.json({ error: 'Username and password are required' }, { status: 400 });
        }

        const allowedRoles = ['manager', 'super-admin'];
        const targetRole = allowedRoles.includes(role) ? role : 'manager';

        const existing = await User.findOne({ username: username.toLowerCase().trim() });
        if (existing) return Response.json({ error: 'Username already taken' }, { status: 400 });

        const passwordHash = await User.hashPassword(password);
        const user = await User.create({ username: username.toLowerCase().trim(), email: email || '', passwordHash, role: targetRole, createdBy: session.userId });

        // Send welcome email if an email was provided
        if (email && email.includes('@')) {
            const html = welcomeEmailTemplate(username, username.toLowerCase().trim(), password);
            try {
                await sendEmail(
                    email,
                    'Welcome to ShiftSync — Your Account is Ready 🎉',
                    html
                );
            } catch (err) {
                console.error('[EMAIL] Admin welcome email failed:', err);
            }
        }

        return Response.json({ success: true, user: { _id: user._id.toString(), username: user.username, role: user.role } });
    } catch (err) {
        console.error('POST admin user error:', err);
        return Response.json({ error: 'Server error' }, { status: 500 });
    }
}
