/**
 * A validator function which checks whether an input value is null or any other
 * type. If null, then the validator chain is stopped and null is returned,
 * otherwise, the validator chain is not stopped and the value is returned.
 *
 * @category XML
 */
export function validateNullable(value: unknown): [value: unknown | null, stop: boolean] {
    return [value, value === null];
}
