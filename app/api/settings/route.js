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
        await connectDB();
        let setting = await Settings.findOne({ key: 'shiftTimes' });
        if (!setting) {
            setting = await Settings.create({ key: 'shiftTimes', value: DEFAULT_SHIFT_TIMES });
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

        await Settings.findOneAndUpdate(
            { key: 'shiftTimes' },
            { value, updatedAt: new Date() },
            { upsert: true }
        );

        return Response.json({ success: true });
    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}
