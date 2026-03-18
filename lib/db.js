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
            // Reset promise so the next request can retry the connection
            cached.promise = null;
            console.error('Mongoose connect error:', err);
            throw new Error(`MongoDB Connection Failed: ${err.message}`);
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (err) {
        cached.promise = null;
        throw err;
    }
    return cached.conn;
}
