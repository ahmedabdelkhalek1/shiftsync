export function performSmartShuffle({ employees, visibleDates, lockedIds, floaterIds, includeNight = false }) {
    const newScheduleUpdates = []; // { employeeId, dateStr, shift }
    const currentMonthDates = visibleDates.filter(d => d.isCurrentMonth);

    // Group dates by week (Monday-Sunday)
    const weeks = [];
    let currentWeek = [];
    currentMonthDates.forEach(({ date, id }) => {
        currentWeek.push({ date, id });
        if (date.getDay() === 0) { // Sunday is 0
            weeks.push(currentWeek);
            currentWeek = [];
        }
    });
    if (currentWeek.length > 0) weeks.push(currentWeek);

    const shifts = ['morning', 'afternoon', 'evening'];
    if (includeNight) shifts.push('night');

    weeks.forEach(weekDates => {
        const employeesToShuffle = employees.filter(emp => !lockedIds.includes(emp._id));
        if (employeesToShuffle.length === 0) return;

        // 1. Demand Deck
        const dailyDemand = weekDates.map(({ date }) => {
            const slots = [];
            const dayIndex = date.getDay();
            const isFriSun = (dayIndex === 5 || dayIndex === 6 || dayIndex === 0);

            const morningCount = isFriSun ? 1 : 2;
            const afternoonCount = 1;
            const eveningCount = 1;

            for (let k = 0; k < morningCount; k++) slots.push('morning');
            for (let k = 0; k < afternoonCount; k++) slots.push('afternoon');
            for (let k = 0; k < eveningCount; k++) slots.push('evening');
            if (includeNight) slots.push('night');
            return slots;
        });

        // 2. Identify Groups
        const floaters = employeesToShuffle.filter(e => floaterIds.includes(e._id));
        const consistents = employeesToShuffle.filter(e => !floaterIds.includes(e._id));

        // 3. Assign Roles to Consistents
        const shuffledConsistents = [...consistents].sort(() => Math.random() - 0.5);
        const roles = {};
        const rolePriorityCycle = ['morning', 'evening', 'afternoon'];
        if (includeNight) rolePriorityCycle.splice(2, 0, 'night');

        let cycleIndex = 0;
        shuffledConsistents.forEach(emp => {
            let assigned = false;
            let attempts = 0;
            while (!assigned && attempts < rolePriorityCycle.length) {
                const candidate = rolePriorityCycle[cycleIndex % rolePriorityCycle.length];
                let allowed = true;
                if (emp.gender === 'female' && (candidate === 'evening' || candidate === 'night')) allowed = false;

                if (allowed) {
                    roles[emp._id] = candidate;
                    assigned = true;
                }
                cycleIndex++;
                attempts++;
            }
            if (!assigned) roles[emp._id] = 'morning';
        });

        floaters.forEach(emp => roles[emp._id] = 'floater');

        // 4. Allocation
        const processingOrder = [...shuffledConsistents, ...floaters];
        processingOrder.forEach((emp, i) => {
            const role = roles[emp._id];
            let offDayIndices = [];

            // Favorite weekend days
            if (emp.favoriteOffDays?.length > 0) {
                const favIndices = [];
                weekDates.forEach(({ date }, idx) => {
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                    if (emp.favoriteOffDays.includes(dayName)) favIndices.push(idx);
                });
                if (favIndices.length >= 2) offDayIndices = [favIndices[0], favIndices[1]];
                else if (favIndices.length === 1) offDayIndices = [favIndices[0], (favIndices[0] + 1) % 7];
            }

            if (offDayIndices.length === 0) {
                if (role === 'morning') {
                    const p = i % 3;
                    if (p === 0) offDayIndices = [4, 5]; // Fri, Sat
                    else if (p === 1) offDayIndices = [5, 6]; // Sat, Sun
                    else offDayIndices = [6, 0]; // Sun, Mon
                } else {
                    const start = Math.floor(Math.random() * 6);
                    offDayIndices = [start, (start + 1) % 7];
                }
            }

            weekDates.forEach(({ id: dateStr }, dayIndex) => {
                if (offDayIndices.includes(dayIndex)) {
                    newScheduleUpdates.push({ employeeId: emp._id, dateStr, shift: 'off-day' });
                } else {
                    const needed = dailyDemand[dayIndex];
                    let chosen;

                    if (role === 'floater') {
                        if (needed.length > 0) {
                            const priority = ['morning', 'afternoon', 'evening', 'night'];
                            needed.sort((a, b) => priority.indexOf(a) - priority.indexOf(b));
                            let slotIdx = 0;
                            if (emp.gender === 'female') {
                                const nonE = needed.findIndex(s => s !== 'evening' && s !== 'night');
                                if (nonE !== -1) slotIdx = nonE;
                            }
                            chosen = needed.splice(slotIdx, 1)[0];
                        } else {
                            chosen = 'morning';
                        }
                    } else {
                        const roleIdx = needed.indexOf(role);
                        if (roleIdx !== -1) {
                            chosen = needed.splice(roleIdx, 1)[0];
                        } else if (needed.length > 0) {
                            const priority = ['morning', 'afternoon', 'evening', 'night'];
                            needed.sort((a, b) => priority.indexOf(a) - priority.indexOf(b));
                            let slotIdx = 0;
                            if (emp.gender === 'female') {
                                const nonE = needed.findIndex(s => s !== 'evening' && s !== 'night');
                                if (nonE !== -1) slotIdx = nonE;
                            }
                            chosen = needed.splice(slotIdx, 1)[0];
                        } else {
                            chosen = role;
                        }
                    }
                    newScheduleUpdates.push({ employeeId: emp._id, dateStr, shift: chosen });
                }
            });
        });
    });

    return newScheduleUpdates;
}
