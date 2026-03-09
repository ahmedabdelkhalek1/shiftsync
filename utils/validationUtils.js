export function calculateWarnings(employees, visibleDates, ignoreNightShift = false) {
    const warnings = [];
    const currentMonthDates = visibleDates.filter(d => d.isCurrentMonth);

    // 1. Daily Coverage Checks
    currentMonthDates.forEach(({ date, id }) => {
        const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon...
        const counts = { morning: 0, afternoon: 0, evening: 0, night: 0 };
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

        employees.forEach(emp => {
            const shift = emp.schedule?.[id];
            if (counts.hasOwnProperty(shift)) counts[shift]++;

            // Female in Evening Rule
            if (shift === 'evening' && emp.gender === 'female') {
                warnings.push({
                    id: `female-evening-${emp._id}-${id}`,
                    type: 'Gender Constraint',
                    severity: 'warning',
                    message: `<strong>${emp.name}</strong> (Female) is assigned to Evening shift on ${dayName} ${date.getDate()}.`
                });
            }
        });

        // Business Rules
        if ([1, 2, 3, 4].includes(dayOfWeek)) { // Mon-Thu
            if (counts.morning < 2) {
                warnings.push({
                    id: `coverage-morning-${id}`,
                    type: 'Low Coverage',
                    severity: 'error',
                    message: `Morning shift on ${dayName} ${date.getDate()} has only ${counts.morning} employee(s). (Target: 2)`
                });
            }
        }

        ['morning', 'afternoon', 'evening', 'night'].forEach(s => {
            if (s === 'night' && ignoreNightShift) return;
            if (counts[s] < 1) {
                warnings.push({
                    id: `missing-${s}-${id}`,
                    type: 'Missing Coverage',
                    severity: 'error',
                    message: `No employees assigned to ${s.toUpperCase()} shift on ${dayName} ${date.getDate()}.`
                });
            }
        });
    });

    // 2. Rest Period Violations (12-hour rule: Evening -> Morning)
    employees.forEach(emp => {
        for (let i = 0; i < currentMonthDates.length - 1; i++) {
            const d1 = currentMonthDates[i];
            const d2 = currentMonthDates[i + 1];
            const s1 = emp.schedule?.[d1.id];
            const s2 = emp.schedule?.[d2.id];

            if ((s1 === 'evening' || s1 === 'night') && s2 === 'morning') {
                warnings.push({
                    id: `rest-${emp._id}-${d1.id}`,
                    type: 'Rest Violation',
                    severity: 'warning',
                    message: `<strong>${emp.name}</strong> has less than 12h rest between ${d1.id} and ${d2.id}.`
                });
            }
        }
    });

    return warnings;
}
