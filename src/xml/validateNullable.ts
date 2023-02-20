export function validateNullable(value: unknown): [value: unknown | null, stop: boolean] {
    return [value, value === null];
}
