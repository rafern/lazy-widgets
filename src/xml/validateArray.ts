export function validateArray(value: unknown): [value: Array<unknown>, stop: boolean] {
    if (!Array.isArray(value)) {
        throw new Error('Invalid array; Array.isArray is false');
    }

    return [value, false];
}
