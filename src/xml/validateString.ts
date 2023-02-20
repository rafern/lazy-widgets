/**
 * A validator function which checks whether an input value is a string. Doesn't
 * stop the validator chain.
 *
 * @category XML
 */
export function validateString(value: unknown): [value: string, stop: boolean] {
    if (typeof value !== 'string') {
        throw new Error('Invalid string; not a string type');
    }

    return [value, false];
}
