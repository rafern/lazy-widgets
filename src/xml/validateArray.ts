export function validateArray<T>(value: unknown): Array<T> {
    if (typeof value !== 'object') {
        throw new Error('Invalid array; not an object type');
    }

    if (value === null) {
        throw new Error('Invalid array; null');
    }

    if (!Array.isArray(value)) {
        throw new Error('Invalid array; Array.isArray is false');
    }

    return value;
}
