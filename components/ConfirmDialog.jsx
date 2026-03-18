'use client';

import { useState } from 'react';

/**
 * Reusable confirmation dialog — replaces native window.confirm().
 *
 * Usage:
 *   const { ConfirmDialog, confirm } = useConfirm();
 *   // in JSX: <ConfirmDialog />
 *   // in handler: const ok = await confirm('Are you sure?', { title: 'Delete', danger: true });
 */
export function useConfirm() {
    const [state, setState] = useState(null); // { message, title, danger, resolve }

    const confirm = (message, { title = 'Confirm', danger = false } = {}) =>
        new Promise(resolve => {
            setState({ message, title, danger, resolve });
        });

    const handleChoice = (result) => {
        state?.resolve(result);
        setState(null);
    };

    function ConfirmDialog() {
        if (!state) return null;
        return (
            <div className="modal-overlay" style={{ zIndex: 9999 }}>
                <div className="modal-content" style={{ maxWidth: '420px', textAlign: 'center' }}>
                    <h3 style={{ marginBottom: '12px', color: state.danger ? 'var(--brand-red)' : 'var(--text-primary)' }}>
                        {state.title}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
                        {state.message}
                    </p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => handleChoice(false)}
                        >
                            Cancel
                        </button>
                        <button
                            className={`btn ${state.danger ? 'btn-danger' : 'btn-primary'}`}
                            onClick={() => handleChoice(true)}
                            autoFocus
                        >
                            {state.title}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return { confirm, ConfirmDialog };
}
