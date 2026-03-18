import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

if (!process.env.JWT_SECRET) {
    throw new Error('CRITICAL: JWT_SECRET environment variable is not set. The application cannot start securely.');
}
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function signToken(payload) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(SECRET);
}

export async function verifyToken(token) {
    try {
        const { payload } = await jwtVerify(token, SECRET);
        return payload;
    } catch {
        return null;
    }
}

export async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

export function withAuth(handler, allowedRoles = []) {
    return async (req, context) => {
        const session = await getSession();
        if (!session) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }
        req.session = session;
        return handler(req, context);
    };
}
