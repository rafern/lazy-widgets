export function validateNumber(value: unknown): [value: number, stop: boolean] {
    if (typeof value !== 'number') {
        throw new Error('Invalid number; not a number type');
    }

    if (isNaN(value)) {
        throw new Error('Invalid number; not a number (NaN)');
    }

    return [value, false];
}
