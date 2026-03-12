import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, default: '', lowercase: true, trim: true },
    emails: [{ type: String, lowercase: true, trim: true }],
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['super-admin', 'manager', 'employee'], required: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdAt: { type: Date, default: Date.now },
    active: { type: Boolean, default: true },
});

UserSchema.methods.comparePassword = async function (plain) {
    return bcrypt.compare(plain, this.passwordHash);
};

UserSchema.statics.hashPassword = async function (plain) {
    return bcrypt.hash(plain, 12);
};

UserSchema.statics.generateResetToken = function () {
    return crypto.randomBytes(32).toString('hex');
};

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
