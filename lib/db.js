import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global.mongoose;
if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
    if (!MONGODB_URI) {
        throw new Error('CRITICAL: MONGODB_URI is not defined in Vercel Environment Variables. Please add it and redeploy.');
    }

    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {
            bufferCommands: false,
        }).catch(err => {
            console.error('Mongoose connect error:', err);
            throw new Error(`MongoDB Connection Failed: ${err.message}`);
        });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}
