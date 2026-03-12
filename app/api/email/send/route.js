import { getSession } from '@/lib/auth';
import { sendEmail } from '@/lib/gmail';

/**
 * POST /api/email/send
 * Internal route for sending emails. Requires manager or super-admin session.
 * Body: { to: string, subject: string, html: string }
 */
export async function POST(req) {
    try {
        const session = await getSession();
        if (!session || !['manager', 'super-admin'].includes(session.role)) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { to, subject, html } = await req.json();

        if (!to || !subject || !html) {
            return Response.json({ error: 'Missing required fields: to, subject, html' }, { status: 400 });
        }

        await sendEmail(to, subject, html);
        return Response.json({ success: true });
    } catch (err) {
        console.error('POST /api/email/send error:', err);
        return Response.json({ error: 'Failed to send email' }, { status: 500 });
    }
}
