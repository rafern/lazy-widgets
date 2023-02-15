export function validateObject(value: unknown): object {
    if (typeof value !== 'object') {
        throw new Error('Invalid object; not an object type');
    }

    if (value === null) {
        throw new Error('Invalid object; null');
    }

    return value;
}
