import { connectDB } from '@/lib/db';
import { User } from '@/models/User';

export async function POST(req) {
    try {
        await connectDB();
        const { token, newPassword } = await req.json();
        if (!token || !newPassword) return Response.json({ error: 'Token and new password are required' }, { status: 400 });
        if (newPassword.length < 6) return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 });

        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: new Date() },
            active: true,
        });

        if (!user) return Response.json({ error: 'Invalid or expired reset token' }, { status: 400 });

        user.passwordHash = await User.hashPassword(newPassword);
        user.resetToken = null;
        user.resetTokenExpiry = null;
        await user.save();

        return Response.json({ success: true, message: 'Password reset successful. You can now log in.' });
    } catch (err) {
        console.error('Reset password error:', err);
        return Response.json({ error: 'Server error' }, { status: 500 });
    }
}
