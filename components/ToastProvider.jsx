'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

/**
 * Toast provider — wrap in layout or a page.
 * Provides useToast() hook with { success, error, info, warn } methods.
 */
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const idRef = useRef(0);

    const add = useCallback((message, type = 'info', duration = 3500) => {
        const id = ++idRef.current;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const toast = {
        success: (msg, dur) => add(msg, 'success', dur),
        error:   (msg, dur) => add(msg, 'error', dur ?? 5000),
        info:    (msg, dur) => add(msg, 'info', dur),
        warn:    (msg, dur) => add(msg, 'warn', dur),
        dismiss: (id) => setToasts(prev => prev.filter(t => t.id !== id)),
    };

    const icons = { success: '✅', error: '❌', info: 'ℹ️', warn: '⚠️' };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="toast-container" aria-live="polite">
                {toasts.map(t => (
                    <div key={t.id} className={`toast toast-${t.type}`}>
                        <span className="toast-icon">{icons[t.type]}</span>
                        <span className="toast-message">{t.message}</span>
                        <button
                            className="toast-close"
                            onClick={() => toast.dismiss(t.id)}
                            aria-label="Dismiss"
                        >×</button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within a ToastProvider');
    return ctx;
}
