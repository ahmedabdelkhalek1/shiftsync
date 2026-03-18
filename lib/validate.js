/**
 * Input validation helpers shared across API routes.
 * Returns { valid: true } on success or { valid: false, error: '...' } on failure.
 */

const VALID_SHIFTS = new Set([
    'morning', 'afternoon', 'evening', 'night',
    'off-day', 'national', 'combo-in', 'combo-out',
    'vacation', 'annual-leave', 'sick-leave',
]);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate a shift value against the allowed enum.
 */
export function validateShift(shift) {
    if (!VALID_SHIFTS.has(shift)) {
        return { valid: false, error: `Invalid shift value: "${shift}". Must be one of: ${[...VALID_SHIFTS].join(', ')}` };
    }
    return { valid: true };
}

/**
 * Validate a date string is in YYYY-MM-DD format and a real calendar date.
 */
export function validateDate(dateStr) {
    if (!dateStr || !DATE_RE.test(dateStr)) {
        return { valid: false, error: `Invalid date format: "${dateStr}". Expected YYYY-MM-DD.` };
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
        return { valid: false, error: `"${dateStr}" is not a valid calendar date.` };
    }
    return { valid: true };
}

/**
 * Validate a text string field — ensure it's non-empty and within max length.
 */
export function validateText(value, fieldName, { required = false, maxLength = 500 } = {}) {
    if (required && (!value || !String(value).trim())) {
        return { valid: false, error: `${fieldName} is required.` };
    }
    if (value && String(value).length > maxLength) {
        return { valid: false, error: `${fieldName} must be at most ${maxLength} characters.` };
    }
    return { valid: true };
}

/**
 * Validate a MongoDB ObjectId string (24 hex chars).
 */
export function validateObjectId(id, fieldName = 'id') {
    if (!id || !/^[a-f\d]{24}$/i.test(String(id))) {
        return { valid: false, error: `Invalid ${fieldName}.` };
    }
    return { valid: true };
}
