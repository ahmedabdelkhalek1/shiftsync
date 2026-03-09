import mongoose from 'mongoose';

const ComboHistorySchema = new mongoose.Schema({
    date: String,
    originalShift: String,
    newShift: String,
    reason: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    type: { type: String, enum: ['combo-in', 'combo-out'], default: 'combo-in' },
    workingShift: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
});

const EmployeeSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    gender: { type: String, enum: ['male', 'female'], default: 'male' },
    role: { type: String, default: '' },
    // Schedule: { "2026-03-15": "morning", ... }
    schedule: { type: Map, of: String, default: {} },
    // WFH overlay: { "2026-03-15": true, ... }
    wfhDays: { type: Map, of: Boolean, default: {} },
    balances: {
        combo: { type: Number, default: 0 },
        annual: { type: Number, default: 21 },
        sick: { type: Number, default: 10 },
        wfh: { type: Number, default: 10 },
    },
    favoriteOffDays: { type: [String], default: [] },
    comboHistory: { type: [ComboHistorySchema], default: [] },
    ignoredWarnings: { type: [String], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdAt: { type: Date, default: Date.now },
    active: { type: Boolean, default: true },
});

EmployeeSchema.methods.reconcileBalances = function () {
    // 1. Calculate Combo Balance
    // Count all 'combo-out' shifts in the schedule
    let comboUsed = 0;
    this.schedule.forEach((shift) => {
        if (shift === 'combo-out') comboUsed++;
    });

    // Reset history statuses
    this.comboHistory.forEach(item => {
        item.status = 'approved'; // Usually approved if in history
    });

    // Sort by date chronicly
    this.comboHistory.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Mark the first N as 'taken'
    let usedCount = 0;
    for (let i = 0; i < this.comboHistory.length; i++) {
        if (usedCount < comboUsed) {
            this.comboHistory[i].status = 'rejected'; // Or 'taken' - using 'rejected' as 'consumed' for UI badge? 
            // In legacy it was 'taken'. Let's stick to 'approved' vs 'taken' logic.
            // Actually let's just update the numeric balance.
            usedCount++;
        }
    }

    // In our new schema, we have balances.combo
    const earned = this.comboHistory.filter(h => h.type === 'combo-in').length;
    this.balances.combo = Math.max(0, earned - comboUsed);

    // Note: Annual/Sick balances are usually deducted manually or on-shift-set in the API.
    // Reconciling them from schedule might be dangerous if history isn't perfect.
    // So we'll keep manual/API deduction for those.
};

export const Employee = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);
