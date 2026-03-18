'use client';

import { useState, useEffect } from 'react';

export function useEmployees() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchEmployees = async (start, end) => {
        try {
            setLoading(true);
            const query = new URLSearchParams();
            if (start) query.append('start', start);
            if (end) query.append('end', end);
            const qs = query.toString() ? `?${query.toString()}` : '';
            
            const res = await fetch(`/api/employees${qs}`);
            if (res.ok) {
                const data = await res.json();
                setEmployees(data.employees || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    return { employees, loading, refetchEmployees: fetchEmployees };
}
