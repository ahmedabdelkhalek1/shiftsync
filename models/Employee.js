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

export const Employee = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);
