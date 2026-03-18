/**
 * Simple in-memory rate limiter.
 * For production with multiple instances, replace with Redis-backed solution.
 *
 * Usage:
 *   const { success } = rateLimit(ip, { limit: 5, window: 60_000 });
 *   if (!success) return Response.json({ error: 'Too many attempts' }, { status: 429 });
 */

const store = new Map(); // key -> { count, resetAt }

/**
 * @param {string} key       - Usually the client IP address
 * @param {object} options
 * @param {number} options.limit  - Max requests allowed in window (default: 5)
 * @param {number} options.window - Window size in ms (default: 60_000 = 1 min)
 * @returns {{ success: boolean, remaining: number, resetIn: number }}
 */
export function rateLimit(key, { limit = 5, window = 60_000 } = {}) {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
        // New window
        store.set(key, { count: 1, resetAt: now + window });
        return { success: true, remaining: limit - 1, resetIn: window };
    }

    if (entry.count >= limit) {
        return { success: false, remaining: 0, resetIn: entry.resetAt - now };
    }

    entry.count++;
    return { success: true, remaining: limit - entry.count, resetIn: entry.resetAt - now };
}

/**
 * Helper: extract the best available client IP from a Next.js Request.
 */
export function getClientIp(req) {
    return (
        req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        req.headers.get('x-real-ip') ||
        'unknown'
    );
}
