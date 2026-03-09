import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { getSession } from '@/lib/auth';

export async function POST(req) {
    try {
        const session = await getSession();
        if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword) {
            return Response.json({ error: 'Both current and new password are required' }, { status: 400 });
        }
        if (newPassword.length < 6) {
            return Response.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
        }

        const user = await User.findById(session.userId);
        if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

        const valid = await user.comparePassword(currentPassword);
        if (!valid) return Response.json({ error: 'Current password is incorrect' }, { status: 400 });

        user.passwordHash = await User.hashPassword(newPassword);
        await user.save();

        return Response.json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
        console.error('Change password error:', err);
        return Response.json({ error: 'Server error' }, { status: 500 });
    }
}
