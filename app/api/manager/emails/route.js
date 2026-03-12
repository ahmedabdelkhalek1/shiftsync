import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { getSession } from '@/lib/auth';

// GET — return the manager's notification emails
export async function GET() {
    try {
        const session = await getSession();
        if (!session || !['manager', 'super-admin'].includes(session.role)) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const user = await User.findById(session.userId).select('email emails').lean();
        if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

        // Combine primary email + extra emails into one deduplicated list
        const allEmails = [];
        if (user.email && user.email.includes('@')) allEmails.push(user.email);
        if (user.emails?.length) {
            for (const e of user.emails) {
                if (e && e.includes('@') && !allEmails.includes(e)) allEmails.push(e);
            }
        }

        return Response.json({ emails: allEmails, primaryEmail: user.email || '' });
    } catch (err) {
        console.error('GET manager emails error:', err);
        return Response.json({ error: 'Server error' }, { status: 500 });
    }
}

// POST — add a new notification email
export async function POST(req) {
    try {
        const session = await getSession();
        if (!session || !['manager', 'super-admin'].includes(session.role)) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const { email } = await req.json();

        if (!email || !email.includes('@') || !email.includes('.')) {
            return Response.json({ error: 'Invalid email address' }, { status: 400 });
        }

        const trimmed = email.toLowerCase().trim();
        const user = await User.findById(session.userId);
        if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

        // Check duplicates across primary + extras
        const existing = [user.email, ...(user.emails || [])].map(e => (e || '').toLowerCase().trim());
        if (existing.includes(trimmed)) {
            return Response.json({ error: 'This email is already added' }, { status: 400 });
        }

        user.emails = [...(user.emails || []), trimmed];
        await user.save();

        return Response.json({ success: true });
    } catch (err) {
        console.error('POST manager email error:', err);
        return Response.json({ error: 'Server error' }, { status: 500 });
    }
}

// DELETE — remove a notification email
export async function DELETE(req) {
    try {
        const session = await getSession();
        if (!session || !['manager', 'super-admin'].includes(session.role)) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const { email } = await req.json();
        const trimmed = (email || '').toLowerCase().trim();

        const user = await User.findById(session.userId);
        if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

        // Don't allow removing the primary email (it can only be changed, not deleted)
        if (user.email && user.email.toLowerCase().trim() === trimmed) {
            return Response.json({ error: 'Cannot remove your primary email. You can change it from your profile.' }, { status: 400 });
        }

        user.emails = (user.emails || []).filter(e => e.toLowerCase().trim() !== trimmed);
        await user.save();

        return Response.json({ success: true });
    } catch (err) {
        console.error('DELETE manager email error:', err);
        return Response.json({ error: 'Server error' }, { status: 500 });
    }
}
