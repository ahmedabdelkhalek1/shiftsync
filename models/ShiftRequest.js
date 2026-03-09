import mongoose from 'mongoose';

const ShiftRequestSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    employeeName: { type: String, required: true },
    date: { type: String, required: true },
    currentShift: { type: String, required: true },
    requestedShift: { type: String, required: true },
    workingShift: { type: String, default: null }, // for combo-in
    reason: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
});

export const ShiftRequest = mongoose.models.ShiftRequest || mongoose.model('ShiftRequest', ShiftRequestSchema);
