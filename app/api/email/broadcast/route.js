import { connectDB } from '@/lib/db';
import { Employee } from '@/models/Employee';
import { User } from '@/models/User';
import { getSession } from '@/lib/auth';
import { sendEmail } from '@/lib/gmail';
import { managerAnnouncementTemplate } from '@/lib/emailTemplates';

export async function POST(req) {
    try {
        const session = await getSession();
        if (!session || !['manager', 'super-admin'].includes(session.role)) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const { target, subject, message } = await req.json();

        if (!subject || !message) {
            return Response.json({ error: 'Subject and message are required' }, { status: 400 });
        }

        const manager = await User.findById(session.userId).select('username').lean();
        const managerName = manager?.username || 'Your Manager';

        let targetEmails = [];

        if (target === 'all') {
            // Find all employees managed by this user
            const employees = await Employee.find({ createdBy: session.userId, active: true }).select('_id').lean();
            if (!employees.length) return Response.json({ error: 'No employees found' }, { status: 404 });
            
            const empIds = employees.map(e => e._id);
            const users = await User.find({ employeeId: { $in: empIds }, active: true }).select('email').lean();
            targetEmails = users.map(u => u.email).filter(e => e && e.includes('@'));
        } else {
            // Target is a specific employee _id
            const targetUser = await User.findOne({ employeeId: target, active: true }).select('email').lean();
            if (targetUser?.email && targetUser.email.includes('@')) {
                targetEmails.push(targetUser.email);
            }
        }

        if (targetEmails.length === 0) {
            return Response.json({ error: 'No valid email addresses found for target(s)' }, { status: 404 });
        }

        const html = managerAnnouncementTemplate(managerName, subject, message);

        // Send all emails and strictly await them
        const sends = targetEmails.map(email => sendEmail(email, subject, html));
        await Promise.allSettled(sends);

        return Response.json({ success: true, sentCount: targetEmails.length });
    } catch (err) {
        console.error('POST broadcast email error:', err);
        return Response.json({ error: 'Server error' }, { status: 500 });
    }
}
