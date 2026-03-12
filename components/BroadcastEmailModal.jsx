import { useState } from 'react';

export default function BroadcastEmailModal({ employees = [], onClose, onSend }) {
    const [target, setTarget] = useState('all');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!subject.trim() || !message.trim()) {
            setError('Please provide both a subject and a message.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/email/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target, subject, message })
            });

            const data = await res.json();

            if (res.ok) {
                alert(`Successfully sent announcement to ${data.sentCount} employee(s).`);
                onSend();
            } else {
                setError(data.error || 'Failed to send announcement');
            }
        } catch (err) {
            setError('Network error while sending announcement.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h2>📢 Send Announcement</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                
                {error && <div className="error-message" style={{ margin: '15px 20px 0' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ padding: '0 20px 20px' }}>
                    
                    <div className="form-group" style={{ marginTop: '20px' }}>
                        <label>To:</label>
                        <select 
                            className="input-field" 
                            value={target} 
                            onChange={(e) => setTarget(e.target.value)}
                            disabled={loading}
                        >
                            <option value="all">All My Employees</option>
                            <optgroup label="Specific Employee">
                                {employees.map(emp => (
                                    <option key={emp._id} value={emp._id}>{emp.name}</option>
                                ))}
                            </optgroup>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Subject</label>
                        <input 
                            type="text" 
                            className="input-field" 
                            value={subject} 
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="e.g. Important Update Regarding Upcoming Shifts"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label>Message</label>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '-8px', marginBottom: '8px' }}>
                            Your message will be sent inside the branded ShiftSync email template.
                        </p>
                        <textarea 
                            className="input-field" 
                            rows="8"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Write your announcement here. Line breaks are preserved."
                            disabled={loading}
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    <div className="modal-actions" style={{ marginTop: '24px' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ background: 'var(--brand-red)', color: 'white', border: 'none' }}>
                            {loading ? 'Sending...' : 'Send Email'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
