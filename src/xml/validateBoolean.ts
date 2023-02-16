export function validateBoolean(value: unknown): boolean {
    if (typeof value !== 'boolean') {
        throw new Error('Invalid boolean; not a boolean type');
    }

    return value;
}
