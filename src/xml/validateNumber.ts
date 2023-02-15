export function validateNumber(value: unknown): number {
    if (typeof value !== 'number') {
        throw new Error('Invalid number; not a number type');
    }

    if (isNaN(value)) {
        throw new Error('Invalid number; not a number (NaN)');
    }

    return value;
}
