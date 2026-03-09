import { connectDB } from '@/lib/db';
import { User } from '@/models/User';

export async function GET() {
    try {
        await connectDB();

        // Safety check - only run if no users exist
        const userCount = await User.countDocuments();
        if (userCount > 0) {
            return Response.json({ error: 'Setup already completed. Users exist.' }, { status: 400 });
        }

        const username = process.env.SUPER_ADMIN_USERNAME || 'superadmin';
        const password = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456';

        const passwordHash = await User.hashPassword(password);

        await User.create({
            username,
            passwordHash,
            role: 'super-admin',
            active: true,
        });

        return Response.json({
            success: true,
            message: `Setup complete. Super-admin created.`,
            credentials: { username, password }
        });
    } catch (err) {
        console.error('Setup error:', err);
        return Response.json({ error: 'Server error' }, { status: 500 });
    }
}
