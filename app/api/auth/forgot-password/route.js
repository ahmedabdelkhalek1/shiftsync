import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(req) {
    try {
        await connectDB();
        const { username } = await req.json();
        if (!username) return Response.json({ error: 'Username is required' }, { status: 400 });

        const user = await User.findOne({ username: username.toLowerCase().trim(), active: true });
        // Always return success to avoid user enumeration
        if (!user || !user.email) {
            return Response.json({ success: true, message: 'If the account exists, a reset email was sent.' });
        }

        const token = User.generateResetToken();
        user.resetToken = token;
        user.resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
        await user.save();

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const resetUrl = `${appUrl}/reset-password?token=${token}`;
        await sendPasswordResetEmail(user.email, user.username, resetUrl);

        return Response.json({ success: true, message: 'If the account exists, a reset email was sent.' });
    } catch (err) {
        console.error('Forgot password error:', err);
        return Response.json({ error: 'Server error' }, { status: 500 });
    }
}
