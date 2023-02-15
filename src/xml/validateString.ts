export function validateString(value: unknown): string {
    if (typeof value !== 'string') {
        throw new Error('Invalid string; not a string type');
    }

    return value;
}
