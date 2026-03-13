'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext({
    user: null,
    loading: true,
    login: async () => { },
    logout: async () => { },
    refetch: async () => { },
});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const refetch = async () => {
        try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            setUser(data.user);
            return data.user;
        } catch {
            setUser(null);
            return null;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refetch();
    }, [pathname]);

    useEffect(() => {
        let timeoutId;
        const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes

        const handleActivity = () => {
            clearTimeout(timeoutId);
            if (user) {
                timeoutId = setTimeout(() => {
                    logout();
                }, INACTIVITY_LIMIT);
            }
        };

        if (user) {
            const events = ['mousemove', 'keydown', 'mousedown', 'scroll', 'touchstart'];
            events.forEach(event => window.addEventListener(event, handleActivity));
            handleActivity(); // Start initial timer

            return () => {
                clearTimeout(timeoutId);
                events.forEach(event => window.removeEventListener(event, handleActivity));
            };
        }
    }, [user, pathname]);

    const login = async (username, password) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (res.ok) {
            await refetch();
            if (data.user.role === 'super-admin') {
                router.replace('/admin');
            } else {
                router.replace('/');
            }
            return { success: true };
        }
        return { success: false, error: data.error };
    };

    const logout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        router.replace('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refetch }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);

export function AuthGuard({ children, allowedRoles = [] }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
                router.push(user.role === 'super-admin' ? '/admin' : '/');
            }
        }
    }, [user, loading, router]);

    if (loading || !user) return <div className="loading-spinner">Loading...</div>;
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) return null;

    return children;
}
