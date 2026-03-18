import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { signToken } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req) {
    try {
        // ── Rate Limiting ──────────────────────────────────────────────────────
        const ip = getClientIp(req);
        const { success, remaining, resetIn } = rateLimit(`login:${ip}`, { limit: 5, window: 60_000 });
        if (!success) {
            const seconds = Math.ceil(resetIn / 1000);
            return Response.json(
                { error: `Too many login attempts. Please wait ${seconds} seconds and try again.` },
                { status: 429, headers: { 'Retry-After': String(seconds) } }
            );
        }

        await connectDB();
        const { username, password } = await req.json();

        if (!username || !password) {
            return Response.json({ error: 'Username and password are required' }, { status: 400 });
        }

        const user = await User.findOne({ username: username.toLowerCase().trim(), active: true });
        if (!user) {
            return Response.json({ error: 'Invalid username or password' }, { status: 401 });
        }

        const valid = await user.comparePassword(password);
        if (!valid) {
            return Response.json({ error: 'Invalid username or password' }, { status: 401 });
        }

        const token = await signToken({
            userId: user._id.toString(),
            username: user.username,
            role: user.role,
            employeeId: user.employeeId?.toString() || null,
        });

        const response = Response.json({
            success: true,
            user: { id: user._id, username: user.username, role: user.role, employeeId: user.employeeId },
        });

        response.headers.set('Set-Cookie', `auth_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}`);
        return response;
    } catch (err) {
        console.error('Login error:', err);
        return Response.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
