'use client';

import { useState, useEffect, useCallback } from 'react';

// Build a YYYY-MM-DD string offset by `months` from today
function offsetMonth(months) {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split('T')[0];
}

export function useEmployees() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchEmployees = useCallback(async (start, end) => {
        try {
            setLoading(true);
            // Default: 1 month back → 2 months forward (3-month window instead of 15)
            const s = start || offsetMonth(-1);
            const e = end   || offsetMonth(2);
            
            const res = await fetch(`/api/employees?start=${s}&end=${e}`);
            if (res.ok) {
                const data = await res.json();
                setEmployees(data.employees || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    return { employees, loading, setEmployees, refetchEmployees: fetchEmployees };
}
