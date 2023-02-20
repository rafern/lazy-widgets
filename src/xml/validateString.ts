export function validateString(value: unknown): [value: string, stop: boolean] {
    if (typeof value !== 'string') {
        throw new Error('Invalid string; not a string type');
    }

    return [value, false];
}
