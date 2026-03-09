'use client';

import { useState } from 'react';

export default function SettingsModal({ shiftTimes, onClose, onUpdate }) {
    const [values, setValues] = useState({ ...shiftTimes });
    const [saving, setSaving] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value: values })
            });
            if (res.ok) {
                onUpdate(values);
                onClose();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to save settings');
            }
        } catch (err) {
            alert('Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '450px' }}>
                <div className="modal-header">
                    <h2>Shift Time Settings</h2>
                    <button className="btn-close" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSave} className="settings-grid">
                    <div className="settings-field">
                        <label>Morning Shift</label>
                        <input
                            value={values.morning}
                            onChange={(e) => setValues({ ...values, morning: e.target.value })}
                            placeholder="e.g. 7 AM – 3 PM"
                            required
                        />
                    </div>
                    <div className="settings-field">
                        <label>Afternoon Shift</label>
                        <input
                            value={values.afternoon}
                            onChange={(e) => setValues({ ...values, afternoon: e.target.value })}
                            placeholder="e.g. 11 AM – 7 PM"
                            required
                        />
                    </div>
                    <div className="settings-field">
                        <label>Evening Shift</label>
                        <input
                            value={values.evening}
                            onChange={(e) => setValues({ ...values, evening: e.target.value })}
                            placeholder="e.g. 3 PM – 11 PM"
                            required
                        />
                    </div>
                    <div className="settings-field">
                        <label>Night Shift</label>
                        <input
                            value={values.night}
                            onChange={(e) => setValues({ ...values, night: e.target.value })}
                            placeholder="e.g. 11 PM – 7 AM"
                            required
                        />
                    </div>

                    <div className="modal-footer" style={{ marginTop: '24px', paddingBottom: 0 }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
