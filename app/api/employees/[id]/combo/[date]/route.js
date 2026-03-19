import { connectDB } from '@/lib/db';
import { Employee } from '@/models/Employee';
import { getSession } from '@/lib/auth';

export async function DELETE(req, { params }) {
    try {
        const session = await getSession();
        if (!session || !['manager', 'super-admin'].includes(session.role)) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        // Await params since Next.js 15+ dynamic route params are promises
        const { id, date } = await params;

        const emp = await Employee.findOne({ _id: id, active: true });
        if (!emp) return Response.json({ error: 'Employee not found' }, { status: 404 });

        // Find the combo-in entry to get the original shift
        const entryIndex = emp.comboHistory.findIndex(h => h.date === date && h.type === 'combo-in');
        
        if (entryIndex === -1) {
            return Response.json({ error: 'Combo entry not found for this date' }, { status: 404 });
        }

        const entry = emp.comboHistory[entryIndex];

        // Revert shift in schedule
        emp.schedule.set(date, entry.originalShift || 'off-day');

        // Remove from history
        emp.comboHistory.splice(entryIndex, 1);

        // Reconcile balances
        if (emp.reconcileBalances) {
            emp.reconcileBalances();
        }

        await emp.save();

        return Response.json({ success: true, employee: emp });
    } catch (err) {
        console.error('DELETE combo error:', err);
        return Response.json({ error: 'Server error' }, { status: 500 });
    }
}
