export function validateBoolean(value: unknown): [value: boolean, stop: boolean] {
    if (typeof value !== 'boolean') {
        throw new Error('Invalid boolean; not a boolean type');
    }

    return [value, false];
}
