export function getMonthName(date) {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

export function getDayName(date) {
    return date.toLocaleString('default', { weekday: 'long' });
}

export function getShortDayName(date) {
    return date.toLocaleString('default', { weekday: 'short' });
}

export function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
}

export function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
}

export function formatDate(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

export function getVisibleDates(currentDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    let startPadding = firstDayOfMonth.getDay() - 1;
    if (startPadding < 0) startPadding = 6; // Sunday becomes 6

    let endPadding = 7 - lastDayOfMonth.getDay();
    if (endPadding === 7) endPadding = 0;

    const totalDays = startPadding + lastDayOfMonth.getDate() + endPadding;
    const targetRows = Math.ceil(totalDays / 7);
    const totalCells = targetRows * 7;
    endPadding += (totalCells - totalDays);

    const dates = [];

    // Previous month padding
    for (let i = startPadding; i > 0; i--) {
        const d = new Date(year, month, 1 - i);
        dates.push({ date: d, isCurrentMonth: false, id: formatDate(d) });
    }

    // Current month
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
        const d = new Date(year, month, i);
        dates.push({ date: d, isCurrentMonth: true, id: formatDate(d) });
    }

    // Next month padding
    for (let i = 1; i <= endPadding; i++) {
        const d = new Date(year, month + 1, i);
        dates.push({ date: d, isCurrentMonth: false, id: formatDate(d) });
    }

    return dates;
}
