export function validateFunction(value: unknown): [value: CallableFunction, stop: boolean] {
    if (typeof value !== 'function') {
        throw new Error('Invalid function; not an function type');
    }

    return [value, false];
}
