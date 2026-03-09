import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { getSession } from '@/lib/auth';

export async function DELETE(req, { params }) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'super-admin') {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const { id } = await params;

        // Prevent deleting yourself
        if (id === session.userId) {
            return Response.json({ error: 'Cannot delete your own account' }, { status: 400 });
        }

        await User.findByIdAndUpdate(id, { active: false });
        return Response.json({ success: true });
    } catch (err) {
        return Response.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function PATCH(req, { params }) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'super-admin') {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const { id } = await params;
        const { password, email, active } = await req.json();

        const user = await User.findById(id);
        if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

        if (password) user.passwordHash = await User.hashPassword(password);
        if (email !== undefined) user.email = email;
        if (active !== undefined) user.active = active;
        await user.save();

        return Response.json({ success: true });
    } catch (err) {
        return Response.json({ error: 'Server error' }, { status: 500 });
    }
}
