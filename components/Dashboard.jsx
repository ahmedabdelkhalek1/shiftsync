import { useAuth } from '@/components/AuthProvider';

export default function Dashboard({ employees, onOpenProfile, onRemoveEmployee }) {
    const { user } = useAuth();
    const canEdit = user && ['manager', 'super-admin'].includes(user.role);

    // Filter employees: Managers see all, employees see only themselves.
    const displayEmployees = canEdit
        ? employees
        : employees.filter(emp => emp._id === user?.employeeId);

    return (
        <div className="dashboard-wrapper">
            <div className="dashboard-container" style={{ padding: '24px 32px' }}>
                <table className="dashboard-table">
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left' }}>Employee Name</th>
                            <th>Role / Title</th>
                            <th>Combo Balance</th>
                            <th>Annual Leave</th>
                            <th>Sick Leave</th>
                            <th>WFH Balance</th>
                            {canEdit && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {displayEmployees.map(emp => (
                            <tr key={emp._id}>
                                <td style={{ fontWeight: 600 }}>{emp.name}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{emp.role || 'Employee'}</td>
                                <td>
                                    <div className="dashboard-balance-widget">
                                        <strong>{emp.balances?.combo || 0}</strong>
                                    </div>
                                </td>
                                <td>
                                    <div className="dashboard-balance-widget">
                                        <strong>{emp.balances?.annual || 0}</strong>
                                    </div>
                                </td>
                                <td>
                                    <div className="dashboard-balance-widget">
                                        <strong>{emp.balances?.sick || 0}</strong>
                                    </div>
                                </td>
                                <td>
                                    <div className="dashboard-balance-widget">
                                        <strong>{emp.balances?.wfh || 0}</strong>
                                    </div>
                                </td>
                                {canEdit && (
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            <button onClick={() => onOpenProfile(emp)} className="btn btn-secondary btn-sm" style={{ padding: '4px 12px' }}>Edit Profile</button>
                                            <button onClick={() => {
                                                if (confirm(`Remove ${emp.name}? This will deactivate their login.`)) {
                                                    onRemoveEmployee(emp._id);
                                                }
                                            }} className="btn btn-danger" style={{ padding: '4px 12px' }}>Remove</button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {displayEmployees.length === 0 && (
                            <tr>
                                <td colSpan={canEdit ? 7 : 6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No employees found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
