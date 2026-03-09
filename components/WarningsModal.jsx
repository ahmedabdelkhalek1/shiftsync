export default function WarningsModal({ warnings, onClose }) {
    return (
        <div className="modal active">
            <div className="modal-content modal-large">
                <h2>⚠️ Schedule Warnings</h2>
                <p className="shuffle-description">Review schedule issues below.</p>

                {warnings.length === 0 ? (
                    <div className="empty-state">
                        <h3 style={{ color: 'var(--brand-green-light)' }}>Looking Good!</h3>
                        <p>There are no schedule conflicts or warnings for the current view.</p>
                    </div>
                ) : (
                    <div className="warnings-list">
                        {warnings.map((w, idx) => (
                            <div key={idx} className={`warning-item ${w.severity}`}>
                                <div className="warning-header">
                                    <span className="warning-title-text" style={{
                                        color: w.severity === 'error' ? 'var(--brand-red-light)' : '#FDCB6E'
                                    }}>{w.title}</span>
                                </div>
                                <div className="warning-details" style={{ display: 'flex' }}>
                                    <span className="warning-message-icon">{w.severity === 'error' ? '🛑' : '⚠️'}</span>
                                    <div className="warning-message-text" dangerouslySetInnerHTML={{ __html: w.message }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="modal-actions">
                    <button onClick={onClose} className="btn btn-secondary">Close</button>
                </div>
            </div>
        </div>
    );
}
