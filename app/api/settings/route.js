import { connectDB } from '@/lib/db';
import { Settings } from '@/models/Settings';
import { getSession } from '@/lib/auth';

const DEFAULT_SHIFT_TIMES = {
    morning: "7 AM – 3 PM",
    afternoon: "11 AM – 7 PM",
    evening: "3 PM – 11 PM",
    night: "11 PM – 7 AM"
};

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();

        // Determine which manager's settings to fetch
        let managerId = null;
        if (session.role === 'manager') managerId = session.userId;
        else if (session.role === 'employee') {
            const emp = await Employee.findById(session.employeeId).select('createdBy');
            if (emp && emp.createdBy) managerId = emp.createdBy.toString();
        }

        const settingKey = managerId ? `shiftTimes_${managerId}` : 'shiftTimes';

        let setting = await Settings.findOne({ key: settingKey });
        if (!setting) {
            setting = await Settings.create({ key: settingKey, value: DEFAULT_SHIFT_TIMES });
        }
        return Response.json(setting.value);
    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        const session = await getSession();
        if (!session || !['manager', 'super-admin'].includes(session.role)) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const { value } = await req.json();

        const settingKey = session.role === 'manager' ? `shiftTimes_${session.userId}` : 'shiftTimes';

        await Settings.findOneAndUpdate(
            { key: settingKey },
            { value, updatedAt: new Date() },
            { upsert: true }
        );

        return Response.json({ success: true });
    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}
