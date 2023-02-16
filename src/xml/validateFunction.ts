export function validateFunction(value: unknown): CallableFunction {
    if (typeof value !== 'function') {
        throw new Error('Invalid function; not an function type');
    }

    return value;
}
